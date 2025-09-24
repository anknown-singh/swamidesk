-- Pharmacy notification triggers for automatic notifications
-- This file creates database triggers that automatically generate notifications
-- for various pharmacy events like low stock, prescription updates, etc.

-- Function to create pharmacy notifications
CREATE OR REPLACE FUNCTION create_pharmacy_notification(
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_category TEXT DEFAULT 'pharmacy',
  p_priority TEXT DEFAULT 'normal',
  p_data JSONB DEFAULT '{}',
  p_recipient_id UUID DEFAULT NULL,
  p_role TEXT DEFAULT 'pharmacist',
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
    user_id,
    role,
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
    p_role,
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
  IF NEW.stock_quantity <= (NEW.minimum_stock * 0.1) THEN
    PERFORM create_pharmacy_notification(
      'stock_critical',
      'Critical Stock Level: ' || NEW.name,
      'Stock is critically low (' || NEW.stock_quantity || ' remaining). Immediate restocking required.',
      'pharmacy',
      'critical',
      jsonb_build_object(
        'medicine_id', NEW.id,
        'medicine_name', NEW.name,
        'stock_quantity', NEW.stock_quantity,
        'minimum_stock', NEW.minimum_stock,
        'category', NEW.category
      ),
      NULL,
      'pharmacist',
      '/pharmacy/medicines/' || NEW.id
    );
  -- Check if stock level is low (at or below minimum)
  ELSIF NEW.stock_quantity <= NEW.minimum_stock THEN
    PERFORM create_pharmacy_notification(
      'stock_low',
      'Low Stock Alert: ' || NEW.name,
      'Stock level is at minimum threshold (' || NEW.stock_quantity || ' remaining). Consider restocking.',
      'pharmacy',
      'high',
      jsonb_build_object(
        'medicine_id', NEW.id,
        'medicine_name', NEW.name,
        'stock_quantity', NEW.stock_quantity,
        'minimum_stock', NEW.minimum_stock,
        'category', NEW.category
      ),
      NULL,
      'pharmacist',
      '/pharmacy/medicines/' || NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for low stock notifications
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'medicines') THEN
    DROP TRIGGER IF EXISTS trigger_notify_low_stock ON medicines;
    CREATE TRIGGER trigger_notify_low_stock
      AFTER UPDATE OF stock_quantity ON medicines
      FOR EACH ROW
      WHEN (NEW.stock_quantity < OLD.stock_quantity AND NEW.stock_quantity <= NEW.minimum_stock)
      EXECUTE FUNCTION notify_low_stock();
  END IF;
END $$;

-- Trigger for prescription status updates
CREATE OR REPLACE FUNCTION notify_prescription_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify when prescription is ready for pickup
  IF NEW.status = 'ready' AND OLD.status != 'ready' THEN
    PERFORM create_pharmacy_notification(
      'prescription_ready',
      'Prescription Ready: ' || COALESCE(NEW.patient_name, 'Patient'),
      'Prescription #' || NEW.prescription_number || ' is ready for pickup.',
      'pharmacy',
      'normal',
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
      'Prescription Dispensed: ' || COALESCE(NEW.patient_name, 'Patient'),
      'Prescription #' || NEW.prescription_number || ' has been dispensed.',
      'pharmacy',
      'normal',
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
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prescriptions') THEN
    DROP TRIGGER IF EXISTS trigger_notify_prescription_status ON prescriptions;
    CREATE TRIGGER trigger_notify_prescription_status
      AFTER UPDATE OF status ON prescriptions
      FOR EACH ROW
      EXECUTE FUNCTION notify_prescription_status();
  END IF;
END $$;

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
        'URGENT: Medication Expiring Soon',
        NEW.name || ' expires in ' || days_until_expiry || ' days. Remove from inventory immediately.'
        'pharmacy',
        'critical',
        jsonb_build_object(
          'medicine_id', NEW.id,
          'medicine_name', NEW.name,
          'batch_number', NEW.batch_number,
          'expiry_date', NEW.expiry_date,
          'days_until_expiry', days_until_expiry,
          'stock_quantity', NEW.stock_quantity
        ),
        NULL,
        'pharmacist',
        '/pharmacy/medicines/' || NEW.id
      );
    -- High priority for medications expiring within 14 days
    ELSIF days_until_expiry <= 14 THEN
      PERFORM create_pharmacy_notification(
        'medication_expiring_soon',
        'Medication Expiring Soon',
        NEW.name || ' expires in ' || days_until_expiry || ' days. Plan for disposal or return.',
        'pharmacy',
        'high',
        jsonb_build_object(
          'medicine_id', NEW.id,
          'medicine_name', NEW.name,
          'batch_number', NEW.batch_number,
          'expiry_date', NEW.expiry_date,
          'days_until_expiry', days_until_expiry,
          'stock_quantity', NEW.stock_quantity
        ),
        NULL,
        'pharmacist',
        '/pharmacy/medicines/' || NEW.id
      );
    -- Normal priority for medications expiring within 30 days
    ELSE
      PERFORM create_pharmacy_notification(
        'medication_expiring',
        'Medication Expiry Notice',
        NEW.name || ' expires in ' || days_until_expiry || ' days.',
        'pharmacy',
        'normal',
        jsonb_build_object(
          'medicine_id', NEW.id,
          'medicine_name', NEW.name,
          'batch_number', NEW.batch_number,
          'expiry_date', NEW.expiry_date,
          'days_until_expiry', days_until_expiry,
          'stock_quantity', NEW.stock_quantity
        ),
        NULL,
        'pharmacist',
        '/pharmacy/medicines/' || NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for expiring medications (runs on INSERT and UPDATE of expiry_date)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'medicines') THEN
    DROP TRIGGER IF EXISTS trigger_notify_expiring_medications ON medicines;
    CREATE TRIGGER trigger_notify_expiring_medications
      AFTER INSERT OR UPDATE OF expiry_date ON medicines
      FOR EACH ROW
      EXECUTE FUNCTION notify_expiring_medications();
  END IF;
END $$;

-- Trigger for new purchase orders
CREATE OR REPLACE FUNCTION notify_new_purchase_order()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_pharmacy_notification(
    'purchase_order_created',
    'New Purchase Order Created',
    'Purchase order #' || NEW.order_number || ' has been created for ' || NEW.supplier_name || '.',
    'pharmacy',
    'normal',
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
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_orders') THEN
    DROP TRIGGER IF EXISTS trigger_notify_new_purchase_order ON purchase_orders;
    CREATE TRIGGER trigger_notify_new_purchase_order
      AFTER INSERT ON purchase_orders
      FOR EACH ROW
      EXECUTE FUNCTION notify_new_purchase_order();
  END IF;
END $$;

-- Trigger for purchase order status updates
CREATE OR REPLACE FUNCTION notify_purchase_order_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify on status changes
  IF NEW.status != OLD.status THEN
    CASE NEW.status
      WHEN 'confirmed' THEN
        PERFORM create_pharmacy_notification(
          'purchase_order_confirmed',
          'Purchase Order Confirmed',
          'Purchase order #' || NEW.order_number || ' has been confirmed.',
          'pharmacy',
          'normal',
          jsonb_build_object(
            'purchase_order_id', NEW.id,
            'order_number', NEW.order_number,
            'supplier_name', NEW.supplier_name,
            'total_amount', NEW.total_amount,
            'status', NEW.status
          ),
          NULL,
          'pharmacist',
          '/pharmacy/purchase-orders/' || NEW.id
        );
      WHEN 'received' THEN
        PERFORM create_pharmacy_notification(
          'purchase_order_received',
          'Purchase Order Received',
          'Purchase order #' || NEW.order_number || ' has been received. Update inventory.',
          'pharmacy',
          'high',
          jsonb_build_object(
            'purchase_order_id', NEW.id,
            'order_number', NEW.order_number,
            'supplier_name', NEW.supplier_name,
            'total_amount', NEW.total_amount,
            'actual_delivery_date', NEW.actual_delivery_date
          ),
          NULL,
          'pharmacist',
          '/pharmacy/purchase-orders/' || NEW.id
        );
      WHEN 'cancelled' THEN
        PERFORM create_pharmacy_notification(
          'purchase_order_cancelled',
          'Purchase Order Cancelled',
          'Purchase order #' || NEW.order_number || ' has been cancelled.',
          'pharmacy',
          'normal',
          jsonb_build_object(
            'purchase_order_id', NEW.id,
            'order_number', NEW.order_number,
            'supplier_name', NEW.supplier_name,
            'status', NEW.status,
            'notes', NEW.notes
          ),
          NULL,
          'pharmacist',
          '/pharmacy/purchase-orders/' || NEW.id
        );
      ELSE
        -- Handle other status values (e.g., 'draft', 'pending', 'rejected', etc.)
        -- No notification needed for these statuses
        NULL;
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for purchase order status updates
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_orders') THEN
    DROP TRIGGER IF EXISTS trigger_notify_purchase_order_status ON purchase_orders;
    CREATE TRIGGER trigger_notify_purchase_order_status
      AFTER UPDATE OF status ON purchase_orders
      FOR EACH ROW
      EXECUTE FUNCTION notify_purchase_order_status();
  END IF;
END $$;

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
  FROM medicines
  WHERE expiry_date < CURRENT_DATE AND stock_quantity > 0;
  
  -- Count medications expiring within 7 days
  SELECT COUNT(*) INTO expiring_soon_count
  FROM medicines
  WHERE expiry_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '7 days')
    AND stock_quantity > 0;
  
  -- Count low stock items
  SELECT COUNT(*) INTO low_stock_count
  FROM medicines
  WHERE stock_quantity <= minimum_stock;
  
  -- Create daily summary notification
  IF expired_count > 0 OR expiring_soon_count > 0 OR low_stock_count > 0 THEN
    PERFORM create_pharmacy_notification(
      'daily_summary',
      'Daily Pharmacy Summary',
      'Daily summary: ' || expired_count || ' expired items, ' || 
      expiring_soon_count || ' expiring soon, ' || 
      low_stock_count || ' low stock items.',
      'pharmacy',
      CASE 
        WHEN expired_count > 0 THEN 'critical'
        WHEN expiring_soon_count > 0 OR low_stock_count > 5 THEN 'high'
        ELSE 'normal'
      END,
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

-- Trigger for new sell orders
CREATE OR REPLACE FUNCTION notify_new_sell_order()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_pharmacy_notification(
    'sell_order_created',
    'New Sell Order Created',
    'Sell order #' || NEW.order_number || ' has been created for ' || NEW.customer_name || '.',
    'pharmacy',
    'normal',
    jsonb_build_object(
      'sell_order_id', NEW.id,
      'order_number', NEW.order_number,
      'customer_name', NEW.customer_name,
      'total_amount', NEW.total_amount,
      'status', NEW.status,
      'created_by', NEW.created_by
    ),
    NULL,
    'pharmacist',
    '/pharmacy/sell-orders/' || NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new sell orders
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sell_orders') THEN
    DROP TRIGGER IF EXISTS trigger_notify_new_sell_order ON sell_orders;
    CREATE TRIGGER trigger_notify_new_sell_order
      AFTER INSERT ON sell_orders
      FOR EACH ROW
      EXECUTE FUNCTION notify_new_sell_order();
  END IF;
END $$;

-- Trigger for sell order status updates
CREATE OR REPLACE FUNCTION notify_sell_order_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify on status changes
  IF NEW.status != OLD.status THEN
    CASE NEW.status
      WHEN 'confirmed' THEN
        PERFORM create_pharmacy_notification(
          'sell_order_confirmed',
          'Sell Order Confirmed',
          'Sell order #' || NEW.order_number || ' has been confirmed for ' || NEW.customer_name || '.',
          'pharmacy',
          'normal',
          jsonb_build_object(
            'sell_order_id', NEW.id,
            'order_number', NEW.order_number,
            'customer_name', NEW.customer_name,
            'total_amount', NEW.total_amount,
            'status', NEW.status
          ),
          NULL,
          'pharmacist',
          '/pharmacy/sell-orders/' || NEW.id
        );
      WHEN 'shipped' THEN
        PERFORM create_pharmacy_notification(
          'sell_order_shipped',
          'Sell Order Shipped',
          'Sell order #' || NEW.order_number || ' has been shipped to ' || NEW.customer_name || '.',
          'pharmacy',
          'normal',
          jsonb_build_object(
            'sell_order_id', NEW.id,
            'order_number', NEW.order_number,
            'customer_name', NEW.customer_name,
            'total_amount', NEW.total_amount,
            'status', NEW.status
          ),
          NULL,
          'pharmacist',
          '/pharmacy/sell-orders/' || NEW.id
        );
      WHEN 'delivered' THEN
        PERFORM create_pharmacy_notification(
          'sell_order_delivered',
          'Sell Order Delivered',
          'Sell order #' || NEW.order_number || ' has been delivered to ' || NEW.customer_name || '.',
          'pharmacy',
          'high',
          jsonb_build_object(
            'sell_order_id', NEW.id,
            'order_number', NEW.order_number,
            'customer_name', NEW.customer_name,
            'total_amount', NEW.total_amount,
            'status', NEW.status
          ),
          NULL,
          'pharmacist',
          '/pharmacy/sell-orders/' || NEW.id
        );
      WHEN 'cancelled' THEN
        PERFORM create_pharmacy_notification(
          'sell_order_cancelled',
          'Sell Order Cancelled',
          'Sell order #' || NEW.order_number || ' has been cancelled.',
          'pharmacy',
          'normal',
          jsonb_build_object(
            'sell_order_id', NEW.id,
            'order_number', NEW.order_number,
            'customer_name', NEW.customer_name,
            'status', NEW.status,
            'notes', NEW.notes
          ),
          NULL,
          'pharmacist',
          '/pharmacy/sell-orders/' || NEW.id
        );
      ELSE
        -- Handle other status values (e.g., 'pending')
        -- No notification needed for these statuses
        NULL;
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for sell order status updates
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sell_orders') THEN
    DROP TRIGGER IF EXISTS trigger_notify_sell_order_status ON sell_orders;
    CREATE TRIGGER trigger_notify_sell_order_status
      AFTER UPDATE OF status ON sell_orders
      FOR EACH ROW
      EXECUTE FUNCTION notify_sell_order_status();
  END IF;
END $$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_pharmacy_notification TO authenticated;
GRANT EXECUTE ON FUNCTION create_daily_pharmacy_notifications TO authenticated;