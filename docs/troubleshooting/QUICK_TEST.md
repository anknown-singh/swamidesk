# Quick Test Guide 🚀

## Current Status
✅ **Application is running on http://localhost:3001**
✅ **All code compiled successfully**
✅ **No TypeScript or build errors**

## ⚠️ Missing: Supabase Configuration

To complete the test, you need to:

### 1. Create Supabase Project (2 minutes)
1. Go to https://supabase.com/dashboard
2. Click "New Project" 
3. Name: `swamicare-clinic`
4. Set a database password
5. Click "Create new project"

### 2. Get Credentials (30 seconds)
Once project is ready:
1. Go to **Settings** → **API**
2. Copy these 3 values:
   - Project URL
   - `anon` public key  
   - `service_role` secret key

### 3. Add Environment Variables (30 seconds)
Create `.env.local` file in project root:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here  
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 4. Setup Database (2 minutes)
In Supabase SQL Editor, run:
1. **First:** Copy/paste all of `supabase/schema.sql`
2. **Second:** Copy/paste all of `supabase/rls-policies.sql`

### 5. Create Test Users (1 minute)
Run this SQL in Supabase SQL Editor:

```sql
-- Insert demo users
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role
) VALUES 
(gen_random_uuid(), 'admin@swamicare.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated'),
(gen_random_uuid(), 'doctor@swamicare.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated'),
(gen_random_uuid(), 'receptionist@swamicare.com', crypt('password123', gen_salt('bf')), NOW(), NOW(), NOW(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated');

-- Create user profiles  
INSERT INTO user_profiles (id, email, role, first_name, last_name, phone, is_active)
SELECT 
  id, email,
  CASE 
    WHEN email = 'admin@swamicare.com' THEN 'admin'::user_role
    WHEN email = 'doctor@swamicare.com' THEN 'doctor'::user_role  
    WHEN email = 'receptionist@swamicare.com' THEN 'receptionist'::user_role
  END,
  CASE 
    WHEN email = 'admin@swamicare.com' THEN 'Admin'
    WHEN email = 'doctor@swamicare.com' THEN 'Dr. Smith'
    WHEN email = 'receptionist@swamicare.com' THEN 'Jane'
  END,
  'User', '+91-9876543210', true
FROM auth.users 
WHERE email IN ('admin@swamicare.com', 'doctor@swamicare.com', 'receptionist@swamicare.com');
```

### 6. Test! (2 minutes)
1. Restart dev server: `npm run dev`
2. Go to http://localhost:3001
3. Should redirect to `/login`
4. Login with:
   - **Email:** admin@swamicare.com  
   - **Password:** password123
5. Should redirect to Admin Dashboard!

## Expected Results ✅
- Login page loads with SwamiCare branding
- Authentication works with demo credentials
- Admin dashboard shows clinic metrics
- Role-based navigation works
- No console errors

---
**Total Setup Time: ~6 minutes**
**After setup: Full clinic management system ready!** 🎉