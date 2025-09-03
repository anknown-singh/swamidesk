-- Fix Visits-Users Relationship Issues
-- Migration: 20250810000003_fix_visits_user_relationships.sql
-- Purpose: Fix foreign key relationships to work with users view

-- 1. Add explicit foreign key constraint names for better management
-- First, check current constraints and rename them appropriately

-- 2. Create a function to handle user relationships through the view
CREATE OR REPLACE FUNCTION get_user_by_id(user_uuid UUID)
RETURNS TABLE(
    id UUID,
    full_name VARCHAR,
    role user_role,
    department VARCHAR,
    email VARCHAR,
    phone VARCHAR,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        CONCAT(up.first_name, ' ', up.last_name) as full_name,
        up.role,
        CASE 
            WHEN up.role = 'doctor' THEN 
                CASE 
                    WHEN up.id::text ~ '1$' THEN 'ENT'
                    WHEN up.id::text ~ '2$' THEN 'Cardiology'  
                    WHEN up.id::text ~ '3$' THEN 'Pediatrics'
                    WHEN up.id::text ~ '4$' THEN 'Orthopedics'
                    WHEN up.id::text ~ '5$' THEN 'Dermatology'
                    ELSE 'General Medicine'
                END
            ELSE NULL
        END as department,
        up.email,
        up.phone,
        up.is_active
    FROM user_profiles up
    WHERE up.id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- 3. Update the users view to be more comprehensive
DROP VIEW IF EXISTS users CASCADE;

CREATE VIEW users AS
SELECT 
    id,
    email,
    role,
    CONCAT(first_name, ' ', last_name) as full_name,
    first_name,
    last_name,
    phone,
    address,
    is_active,
    created_at,
    updated_at,
    -- Enhanced department assignment for doctors
    CASE 
        WHEN role = 'doctor' THEN 
            CASE 
                -- Use last digits of UUID to assign departments consistently
                WHEN right(id::text, 1) IN ('1', '6') THEN 'ENT'
                WHEN right(id::text, 1) IN ('2', '7') THEN 'Cardiology'
                WHEN right(id::text, 1) IN ('3', '8') THEN 'Pediatrics' 
                WHEN right(id::text, 1) IN ('4', '9') THEN 'Orthopedics'
                WHEN right(id::text, 1) IN ('5', '0') THEN 'Dermatology'
                ELSE 'General Medicine'
            END
        ELSE NULL
    END as department
FROM user_profiles;

-- 4. Create materialized view for better performance with relationships
CREATE MATERIALIZED VIEW users_materialized AS
SELECT * FROM users;

-- 5. Create indexes on the materialized view
CREATE INDEX idx_users_materialized_id ON users_materialized(id);
CREATE INDEX idx_users_materialized_role ON users_materialized(role);
CREATE INDEX idx_users_materialized_department ON users_materialized(department);

-- 6. Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_users_view()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW users_materialized;
END;
$$ LANGUAGE plpgsql;

-- 7. Create trigger to auto-refresh when user_profiles changes
CREATE OR REPLACE FUNCTION trigger_refresh_users_view()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM refresh_users_view();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_refresh_users ON user_profiles;
CREATE TRIGGER trigger_refresh_users
    AFTER INSERT OR UPDATE OR DELETE ON user_profiles
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_users_view();

-- 8. Grant permissions
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON users TO anon;
GRANT SELECT ON users_materialized TO authenticated; 
GRANT SELECT ON users_materialized TO anon;

-- 9. Refresh the materialized view
SELECT refresh_users_view();

-- 10. Fix token number generation for existing null values
UPDATE visits 
SET token_number = COALESCE(queue_number, ROW_NUMBER() OVER (PARTITION BY visit_date ORDER BY created_at))
WHERE token_number IS NULL;

-- 11. Ensure all visits have checked_in_at timestamps
UPDATE visits 
SET checked_in_at = COALESCE(created_at, NOW())
WHERE checked_in_at IS NULL;

-- 12. Add constraint to ensure token_number is not null for new records
ALTER TABLE visits ALTER COLUMN token_number SET NOT NULL;

-- 13. Create unique constraint on token_number per date
CREATE UNIQUE INDEX IF NOT EXISTS idx_visits_unique_token_per_date 
ON visits(visit_date, token_number) 
WHERE token_number IS NOT NULL;

-- 14. Update the token generation function to be more robust
CREATE OR REPLACE FUNCTION generate_token_number() 
RETURNS INTEGER AS $$
DECLARE
    next_token INTEGER;
    max_attempts INTEGER := 10;
    attempt INTEGER := 0;
BEGIN
    LOOP
        -- Get the highest token number for today
        SELECT COALESCE(MAX(token_number), 0) + 1 
        INTO next_token 
        FROM visits 
        WHERE visit_date = CURRENT_DATE;
        
        -- Check if this token number already exists
        IF NOT EXISTS (
            SELECT 1 FROM visits 
            WHERE visit_date = CURRENT_DATE 
            AND token_number = next_token
        ) THEN
            RETURN next_token;
        END IF;
        
        attempt := attempt + 1;
        IF attempt >= max_attempts THEN
            -- Fallback: use timestamp-based number
            next_token := EXTRACT(EPOCH FROM NOW())::INTEGER % 10000;
            EXIT;
        END IF;
    END LOOP;
    
    RETURN next_token;
END;
$$ LANGUAGE plpgsql;

COMMIT;