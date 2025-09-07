-- Check if workflow_requests table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'workflow_requests';

-- If it exists, check its structure
\d+ workflow_requests;

-- Check if there are any workflow requests
SELECT COUNT(*) as total_requests FROM workflow_requests;