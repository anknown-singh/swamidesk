-- Add test patients to local database
INSERT INTO patients (id, full_name, phone, email, date_of_birth, gender, created_at, updated_at) VALUES 
('patient-1', 'John Smith', '+1234567890', 'john.smith@email.com', '1990-05-15', 'male', NOW(), NOW()),
('patient-2', 'Sarah Johnson', '+1234567891', 'sarah.johnson@email.com', '1985-08-22', 'female', NOW(), NOW()),
('patient-3', 'Michael Brown', '+1234567892', 'michael.brown@email.com', '1992-12-03', 'male', NOW(), NOW()),
('patient-4', 'Emily Davis', '+1234567893', 'emily.davis@email.com', '1988-03-17', 'female', NOW(), NOW()),
('patient-5', 'Robert Wilson', '+1234567894', 'robert.wilson@email.com', '1975-11-28', 'male', NOW(), NOW());