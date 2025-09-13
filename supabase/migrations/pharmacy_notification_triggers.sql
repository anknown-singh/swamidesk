-- Pharmacy notification triggers for automatic notifications
-- This file creates database triggers that automatically generate notifications
-- for various pharmacy events like low stock, prescription updates, etc.

-- Function to create pharmacy notifications
CREATE OR REPLACE FUNCTION create_pharmacy_notification(
  p_type TEXT,
  p_category TEXT DEFAULT 'pharmacy',
  p_priority TEXT DEFAULT 'normal',
  p_title TEXT,
  p_message TEXT,
  p_data JSONB DEFAULT '{}',
  p_recipient_id UUID DEFAULT NULL,
  p_recipient_role TEXT DEFAULT 'pharmacist',
  p_action_url TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (
    id,
    type,
    category,
    priority,
    title,
    message,
    data,
    recipient_id,
    recipient_role,
    action_url,
    created_at
  ) VALUES (
    gen_random_uuid(),
    p_type,
    p_category,
    p_priority,
    p_title,
    p_message,
    p_data,
    p_recipient_id,
    p_recipient_role,
    p_action_url,
    NOW()
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger for low stock alerts
CREATE OR REPLACE FUNCTION notify_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if stock level is critically low (less than 10% of target)
  IF NEW.current_stock <= (NEW.minimum_stock * 0.1) THEN
    PERFORM create_pharmacy_notification(
      'stock_critical',
      'pharmacy',
      'critical',
      'Critical Stock Level: ' || NEW.product_name,
      'Stock is critically low (' || NEW.current_stock || ' remaining). Immediate restocking required.',
      jsonb_build_object(
        'product_id', NEW.id,
        'product_name', NEW.product_name,
        'current_stock', NEW.current_stock,
        'minimum_stock', NEW.minimum_stock,
        'supplier_id', NEW.supplier_id
      ),
      NULL,
      'pharmacist',
      '/pharmacy/inventory/' || NEW.id
    );
  -- Check if stock level is low (at or below minimum)
  ELSIF NEW.current_stock <= NEW.minimum_stock THEN
    PERFORM create_pharmacy_notification(
      'stock_low',
      'pharmacy',
      'high',
      'Low Stock Alert: ' || NEW.product_name,
      'Stock level is at minimum threshold (' || NEW.current_stock || ' remaining). Consider restocking.',
      jsonb_build_object(
        'product_id', NEW.id,
        'product_name', NEW.product_name,
        'current_stock', NEW.current_stock,
        'minimum_stock', NEW.minimum_stock,
        'supplier_id', NEW.supplier_id
      ),
      NULL,
      'pharmacist',
      '/pharmacy/inventory/' || NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for low stock notifications
DROP TRIGGER IF EXISTS trigger_notify_low_stock ON inventory;
CREATE TRIGGER trigger_notify_low_stock
  AFTER UPDATE OF current_stock ON inventory
  FOR EACH ROW
  WHEN (NEW.current_stock < OLD.current_stock AND NEW.current_stock <= NEW.minimum_stock)
  EXECUTE FUNCTION notify_low_stock();

-- Trigger for prescription status updates
CREATE OR REPLACE FUNCTION notify_prescription_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify when prescription is ready for pickup
  IF NEW.status = 'ready' AND OLD.status != 'ready' THEN
    PERFORM create_pharmacy_notification(
      'prescription_ready',
      'pharmacy',
      'normal',
      'Prescription Ready: ' || COALESCE(NEW.patient_name, 'Patient'),
      'Prescription #' || NEW.prescription_number || ' is ready for pickup.',
      jsonb_build_object(
        'prescription_id', NEW.id,
        'prescription_number', NEW.prescription_number,
        'patient_name', NEW.patient_name,
        'medication', NEW.medication_name,
        'status', NEW.status
      ),
      NULL,
      'pharmacist',
      '/pharmacy/prescriptions/' || NEW.id
    );
  -- Notify when prescription is dispensed
  ELSIF NEW.status = 'dispensed' AND OLD.status != 'dispensed' THEN
    PERFORM create_pharmacy_notification(
      'prescription_dispensed',
      'pharmacy',
      'normal',
      'Prescription Dispensed: ' || COALESCE(NEW.patient_name, 'Patient'),
      'Prescription #' || NEW.prescription_number || ' has been dispensed.',
      jsonb_build_object(
        'prescription_id', NEW.id,
        'prescription_number', NEW.prescription_number,
        'patient_name', NEW.patient_name,
        'medication', NEW.medication_name,
        'dispensed_by', NEW.dispensed_by
      ),
      NULL,
      'pharmacist',
      '/pharmacy/prescriptions/' || NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for prescription status notifications
DROP TRIGGER IF EXISTS trigger_notify_prescription_status ON prescriptions;
CREATE TRIGGER trigger_notify_prescription_status
  AFTER UPDATE OF status ON prescriptions
  FOR EACH ROW
  EXECUTE FUNCTION notify_prescription_status();

-- Trigger for expiring medications
CREATE OR REPLACE FUNCTION notify_expiring_medications()
RETURNS TRIGGER AS $$
DECLARE
  days_until_expiry INTEGER;
BEGIN
  -- Calculate days until expiry
  days_until_expiry := (NEW.expiry_date - CURRENT_DATE);
  
  -- Notify for medications expiring within 30 days
  IF days_until_expiry <= 30 AND days_until_expiry > 0 THEN
    -- Critical alert for medications expiring within 7 days
    IF days_until_expiry <= 7 THEN
      PERFORM create_pharmacy_notification(
        'medication_expiring_critical',
        'pharmacy',
        'critical',
        'URGENT: Medication Expiring Soon',
        NEW.product_name || ' expires in ' || days_until_expiry || ' days. Remove from inventory immediately.',
        jsonb_build_object(
          'product_id', NEW.id,
          'product_name', NEW.product_name,
          'batch_number', NEW.batch_number,
          'expiry_date', NEW.expiry_date,
          'days_until_expiry', days_until_expiry,
          'current_stock', NEW.current_stock
        ),
        NULL,
        'pharmacist',
        '/pharmacy/inventory/' || NEW.id
      );
    -- High priority for medications expiring within 14 days
    ELSIF days_until_expiry <= 14 THEN
      PERFORM create_pharmacy_notification(
        'medication_expiring_soon',
        'pharmacy',
        'high',
        'Medication Expiring Soon',
        NEW.product_name || ' expires in ' || days_until_expiry || ' days. Plan for disposal or return.',
        jsonb_build_object(
          'product_id', NEW.id,
          'product_name', NEW.product_name,
          'batch_number', NEW.batch_number,
          'expiry_date', NEW.expiry_date,
          'days_until_expiry', days_until_expiry,
          'current_stock', NEW.current_stock
        ),
        NULL,
        'pharmacist',
        '/pharmacy/inventory/' || NEW.id
      );
    -- Normal priority for medications expiring within 30 days
    ELSE
      PERFORM create_pharmacy_notification(
        'medication_expiring',
        'pharmacy',
        'normal',
        'Medication Expiry Notice',
        NEW.product_name || ' expires in ' || days_until_expiry || ' days.',
        jsonb_build_object(
          'product_id', NEW.id,
          'product_name', NEW.product_name,
          'batch_number', NEW.batch_number,
          'expiry_date', NEW.expiry_date,
          'days_until_expiry', days_until_expiry,
          'current_stock', NEW.current_stock
        ),
        NULL,
        'pharmacist',
        '/pharmacy/inventory/' || NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for expiring medications (runs on INSERT and UPDATE of expiry_date)
DROP TRIGGER IF EXISTS trigger_notify_expiring_medications ON inventory;
CREATE TRIGGER trigger_notify_expiring_medications
  AFTER INSERT OR UPDATE OF expiry_date ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION notify_expiring_medications();

-- Trigger for new purchase orders
CREATE OR REPLACE FUNCTION notify_new_purchase_order()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_pharmacy_notification(
    'purchase_order_created',
    'pharmacy',
    'normal',
    'New Purchase Order Created',
    'Purchase order #' || NEW.order_number || ' has been created for ' || NEW.supplier_name || '.',
    jsonb_build_object(
      'purchase_order_id', NEW.id,
      'order_number', NEW.order_number,
      'supplier_name', NEW.supplier_name,
      'total_amount', NEW.total_amount,
      'status', NEW.status,
      'created_by', NEW.created_by
    ),
    NULL,
    'pharmacist',
    '/pharmacy/purchase-orders/' || NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new purchase orders
DROP TRIGGER IF EXISTS trigger_notify_new_purchase_order ON purchase_orders;
CREATE TRIGGER trigger_notify_new_purchase_order
  AFTER INSERT ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_purchase_order();

-- Trigger for purchase order status updates
CREATE OR REPLACE FUNCTION notify_purchase_order_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify on status changes
  IF NEW.status != OLD.status THEN
    CASE NEW.status
      WHEN 'approved' THEN
        PERFORM create_pharmacy_notification(
          'purchase_order_approved',
          'pharmacy',
          'normal',
          'Purchase Order Approved',
          'Purchase order #' || NEW.order_number || ' has been approved.',
          jsonb_build_object(
            'purchase_order_id', NEW.id,
            'order_number', NEW.order_number,
            'supplier_name', NEW.supplier_name,
            'total_amount', NEW.total_amount,
            'approved_by', NEW.approved_by
          ),
          NULL,
          'pharmacist',
          '/pharmacy/purchase-orders/' || NEW.id
        );
      WHEN 'received' THEN
        PERFORM create_pharmacy_notification(
          'purchase_order_received',
          'pharmacy',
          'high',
          'Purchase Order Received',
          'Purchase order #' || NEW.order_number || ' has been received. Update inventory.',
          jsonb_build_object(
            'purchase_order_id', NEW.id,
            'order_number', NEW.order_number,
            'supplier_name', NEW.supplier_name,
            'total_amount', NEW.total_amount,
            'received_date', NEW.received_date
          ),
          NULL,
          'pharmacist',
          '/pharmacy/purchase-orders/' || NEW.id
        );
      WHEN 'cancelled' THEN
        PERFORM create_pharmacy_notification(
          'purchase_order_cancelled',
          'pharmacy',
          'normal',
          'Purchase Order Cancelled',
          'Purchase order #' || NEW.order_number || ' has been cancelled.',
          jsonb_build_object(
            'purchase_order_id', NEW.id,
            'order_number', NEW.order_number,
            'supplier_name', NEW.supplier_name,
            'cancelled_reason', NEW.cancelled_reason
          ),
          NULL,
          'pharmacist',
          '/pharmacy/purchase-orders/' || NEW.id
        );
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for purchase order status updates
DROP TRIGGER IF EXISTS trigger_notify_purchase_order_status ON purchase_orders;
CREATE TRIGGER trigger_notify_purchase_order_status
  AFTER UPDATE OF status ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_purchase_order_status();

-- Function to check and create daily notifications (to be called by cron job or scheduled function)
CREATE OR REPLACE FUNCTION create_daily_pharmacy_notifications()
RETURNS void AS $$
DECLARE
  expired_count INTEGER;
  expiring_soon_count INTEGER;
  low_stock_count INTEGER;
BEGIN
  -- Count expired medications
  SELECT COUNT(*) INTO expired_count
  FROM inventory
  WHERE expiry_date < CURRENT_DATE AND current_stock > 0;
  
  -- Count medications expiring within 7 days
  SELECT COUNT(*) INTO expiring_soon_count
  FROM inventory
  WHERE expiry_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '7 days')
    AND current_stock > 0;
  
  -- Count low stock items
  SELECT COUNT(*) INTO low_stock_count
  FROM inventory
  WHERE current_stock <= minimum_stock;
  
  -- Create daily summary notification
  IF expired_count > 0 OR expiring_soon_count > 0 OR low_stock_count > 0 THEN
    PERFORM create_pharmacy_notification(
      'daily_summary',
      'pharmacy',
      CASE 
        WHEN expired_count > 0 THEN 'critical'
        WHEN expiring_soon_count > 0 OR low_stock_count > 5 THEN 'high'
        ELSE 'normal'
      END,
      'Daily Pharmacy Summary',
      'Daily summary: ' || expired_count || ' expired items, ' || 
      expiring_soon_count || ' expiring soon, ' || 
      low_stock_count || ' low stock items.',
      jsonb_build_object(
        'expired_count', expired_count,
        'expiring_soon_count', expiring_soon_count,
        'low_stock_count', low_stock_count,
        'summary_date', CURRENT_DATE
      ),
      NULL,
      'pharmacist',
      '/pharmacy/dashboard'
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_pharmacy_notification TO authenticated;
GRANT EXECUTE ON FUNCTION create_daily_pharmacy_notifications TO authenticated;