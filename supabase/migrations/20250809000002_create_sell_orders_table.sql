-- Create sell_orders table
CREATE TABLE IF NOT EXISTS sell_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_contact VARCHAR(255),
    customer_address TEXT,
    customer_email VARCHAR(255),
    sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    gst_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    payment_method VARCHAR(50) CHECK (payment_method IN ('cash', 'card', 'upi', 'online', 'credit')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'completed', 'refunded')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES users(id),
    patient_id UUID REFERENCES patients(id) -- Link to patient if it's a prescription sale
);

-- Create sell_order_items table
CREATE TABLE IF NOT EXISTS sell_order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sell_order_id UUID NOT NULL REFERENCES sell_orders(id) ON DELETE CASCADE,
    medicine_name VARCHAR(255) NOT NULL,
    salt_content VARCHAR(255),
    company_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    batch_number VARCHAR(100),
    expiry_date DATE,
    scheme_offer TEXT,
    gst_percentage DECIMAL(5,2) NOT NULL DEFAULT 18.00 CHECK (gst_percentage >= 0 AND gst_percentage <= 100),
    gst_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    prescription_id UUID REFERENCES prescriptions(id), -- Link to prescription if applicable
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_sell_orders_status ON sell_orders(status);
CREATE INDEX idx_sell_orders_sale_date ON sell_orders(sale_date);
CREATE INDEX idx_sell_orders_customer ON sell_orders(customer_name);
CREATE INDEX idx_sell_orders_order_number ON sell_orders(order_number);
CREATE INDEX idx_sell_orders_patient ON sell_orders(patient_id);
CREATE INDEX idx_sell_orders_payment_status ON sell_orders(payment_status);
CREATE INDEX idx_sell_order_items_sell_order ON sell_order_items(sell_order_id);
CREATE INDEX idx_sell_order_items_prescription ON sell_order_items(prescription_id);

-- Create function to generate sell order numbers
CREATE OR REPLACE FUNCTION generate_sell_order_number()
RETURNS TEXT AS $$
DECLARE
    year_suffix TEXT;
    next_number INTEGER;
    order_number TEXT;
BEGIN
    year_suffix := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    -- Get the next order number for this year
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(order_number FROM 'SO-' || year_suffix || '-(\d+)') AS INTEGER)
    ), 0) + 1
    INTO next_number
    FROM sell_orders
    WHERE order_number LIKE 'SO-' || year_suffix || '-%';
    
    order_number := 'SO-' || year_suffix || '-' || LPAD(next_number::TEXT, 3, '0');
    
    RETURN order_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate order numbers
CREATE OR REPLACE FUNCTION set_sell_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := generate_sell_order_number();
    END IF;
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sell_orders_set_order_number
    BEFORE INSERT ON sell_orders
    FOR EACH ROW
    EXECUTE FUNCTION set_sell_order_number();

-- Create trigger to update timestamps
CREATE OR REPLACE FUNCTION update_sell_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sell_orders_updated_at
    BEFORE UPDATE ON sell_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_sell_orders_updated_at();

CREATE TRIGGER sell_order_items_updated_at
    BEFORE UPDATE ON sell_order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_sell_orders_updated_at();

-- Enable RLS (Row Level Security)
ALTER TABLE sell_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sell_order_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all operations for now - can be restricted later)
CREATE POLICY "Allow all operations on sell_orders" ON sell_orders FOR ALL USING (true);
CREATE POLICY "Allow all operations on sell_order_items" ON sell_order_items FOR ALL USING (true);