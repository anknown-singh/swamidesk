-- Add supplier field to medicines table
-- Migration: 20250830000001_add_supplier_to_medicines.sql

-- Add supplier column to medicines table
ALTER TABLE medicines ADD COLUMN supplier VARCHAR(255);

-- Add index for better performance when searching by supplier
CREATE INDEX IF NOT EXISTS idx_medicines_supplier ON medicines(supplier);