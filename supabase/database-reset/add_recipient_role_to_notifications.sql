-- Migration: Add recipient_role column to notifications table
-- This allows notifications to be sent to specific roles or "all" users

-- Add the recipient_role column
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS recipient_role VARCHAR(50);

-- Set default values for existing notifications
UPDATE notifications 
SET recipient_role = COALESCE(role, 'all') 
WHERE recipient_role IS NULL;

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_role 
ON notifications(recipient_role);

-- Create an index for pharmacy notifications specifically
CREATE INDEX IF NOT EXISTS idx_notifications_pharmacy_role 
ON notifications(category, recipient_role, created_at);

-- Example notification types for different recipient roles:
-- recipient_role = 'all' -> visible to all users
-- recipient_role = 'admin' -> visible to admins only
-- recipient_role = 'doctor' -> visible to doctors only
-- recipient_role = 'pharmacist' -> visible to pharmacists only
-- recipient_role = 'receptionist' -> visible to receptionists only

COMMENT ON COLUMN notifications.recipient_role IS 'Role that should receive this notification: admin, doctor, pharmacist, receptionist, or "all" for everyone';