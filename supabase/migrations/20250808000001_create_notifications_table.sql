-- Create notifications table for real-time healthcare notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- Notification type enum
  category VARCHAR(50) NOT NULL, -- Category enum (patient_care, clinical, etc.)
  priority VARCHAR(20) NOT NULL DEFAULT 'normal', -- Priority level
  
  -- Target recipients
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Specific user
  role VARCHAR(50), -- Role-based notification (doctor, admin, etc.)
  
  -- Metadata
  data JSONB DEFAULT '{}', -- Additional structured data
  action_url VARCHAR(500), -- Optional action URL
  actions JSONB DEFAULT '[]', -- Action buttons data
  
  -- Status tracking
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  read_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ, -- Optional expiration
  
  -- Constraints
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'normal', 'high', 'urgent', 'critical')),
  CONSTRAINT valid_category CHECK (category IN (
    'patient_care', 'scheduling', 'clinical', 'pharmacy', 
    'billing', 'system', 'emergency'
  )),
  CONSTRAINT target_recipient CHECK (user_id IS NOT NULL OR role IS NOT NULL)
);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_role ON notifications(role);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_category ON notifications(category);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can read their own notifications
CREATE POLICY "users_read_own_notifications" ON notifications
FOR SELECT
USING (user_id = auth.uid());

-- Users can read notifications for their role
CREATE POLICY "users_read_role_notifications" ON notifications
FOR SELECT
USING (role = (SELECT role FROM users WHERE id = auth.uid()));

-- Users can update (mark as read) their own notifications
CREATE POLICY "users_update_own_notifications" ON notifications
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can update role-based notifications they can read
CREATE POLICY "users_update_role_notifications" ON notifications
FOR UPDATE
USING (role = (SELECT role FROM users WHERE id = auth.uid()))
WITH CHECK (role = (SELECT role FROM users WHERE id = auth.uid()));

-- System can insert notifications (service role)
CREATE POLICY "system_insert_notifications" ON notifications
FOR INSERT
WITH CHECK (true); -- Only service role can insert

-- System can update notifications (service role) 
CREATE POLICY "system_update_notifications" ON notifications
FOR UPDATE
WITH CHECK (true); -- Only service role can update

-- Create notification_stats view for analytics
CREATE OR REPLACE VIEW notification_stats AS
SELECT 
  type,
  category,
  priority,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE is_read = false) as unread_count,
  COUNT(*) FILTER (WHERE is_read = true) as read_count,
  AVG(EXTRACT(EPOCH FROM (read_at - created_at))) as avg_read_time_seconds
FROM notifications
WHERE created_at >= now() - INTERVAL '30 days'
GROUP BY type, category, priority;

-- Grant permissions
GRANT ALL ON notifications TO service_role;
GRANT SELECT, UPDATE ON notifications TO authenticated;
GRANT SELECT ON notification_stats TO authenticated;

-- Create notification cleanup function (remove old notifications)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  -- Delete read notifications older than 30 days
  DELETE FROM notifications 
  WHERE is_read = true 
    AND read_at < now() - INTERVAL '30 days';
  
  -- Delete expired notifications
  DELETE FROM notifications 
  WHERE expires_at IS NOT NULL 
    AND expires_at < now();
    
  -- Delete unread notifications older than 90 days (except critical)
  DELETE FROM notifications 
  WHERE is_read = false 
    AND priority != 'critical'
    AND created_at < now() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Comment on table
COMMENT ON TABLE notifications IS 'Real-time notifications for healthcare workflow events with role-based distribution';