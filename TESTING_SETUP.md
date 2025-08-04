# SwamiCare Testing Setup Guide

## Foundation Status ✅
The SwamiCare foundation has been successfully built with:
- ✅ Complete database schema (11 tables)
- ✅ Row Level Security policies for all data access
- ✅ Role-based authentication system (5 user types)
- ✅ TypeScript types for all entities
- ✅ Dashboard layouts for each role
- ✅ All TypeScript/ESLint errors resolved

## Next Steps: Testing the Foundation

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Set project name: `swamicare-clinic`
5. Set database password (save this!)
6. Choose region closest to you
7. Click "Create new project"

### 2. Get Project Credentials

Once your project is ready:
1. Go to Settings → API
2. Copy the following values:
   - Project URL
   - `anon` public key
   - `service_role` secret key (for admin operations)

### 3. Setup Environment Variables

Create `.env.local` file in the project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 4. Run Database Migrations

Execute these SQL files in your Supabase SQL Editor (in order):

#### A. Create Schema (`supabase/schema.sql`)
```sql
-- Copy and paste the entire contents of supabase/schema.sql
-- This creates all 11 tables, custom functions, and triggers
```

#### B. Setup Row Level Security (`supabase/rls-policies.sql`)
```sql
-- Copy and paste the entire contents of supabase/rls-policies.sql  
-- This creates all security policies for role-based access
```

### 5. Create Demo Users

Run this in Supabase SQL Editor to create test accounts:

```sql
-- Create demo users for testing
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES 
(
  gen_random_uuid(),
  'admin@swamicare.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'doctor@swamicare.com', 
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'receptionist@swamicare.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'attendant@swamicare.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'pharmacist@swamicare.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
);

-- Create corresponding user profiles
INSERT INTO user_profiles (id, email, role, first_name, last_name, phone, is_active)
SELECT 
  id,
  email,
  CASE 
    WHEN email = 'admin@swamicare.com' THEN 'admin'::user_role
    WHEN email = 'doctor@swamicare.com' THEN 'doctor'::user_role
    WHEN email = 'receptionist@swamicare.com' THEN 'receptionist'::user_role
    WHEN email = 'attendant@swamicare.com' THEN 'service_attendant'::user_role
    WHEN email = 'pharmacist@swamicare.com' THEN 'pharmacist'::user_role
  END,
  CASE 
    WHEN email = 'admin@swamicare.com' THEN 'Admin'
    WHEN email = 'doctor@swamicare.com' THEN 'Dr. Smith'
    WHEN email = 'receptionist@swamicare.com' THEN 'Jane'
    WHEN email = 'attendant@swamicare.com' THEN 'Mike'
    WHEN email = 'pharmacist@swamicare.com' THEN 'Sarah'
  END,
  CASE 
    WHEN email = 'admin@swamicare.com' THEN 'User'
    WHEN email = 'doctor@swamicare.com' THEN 'Johnson'
    WHEN email = 'receptionist@swamicare.com' THEN 'Doe'
    WHEN email = 'attendant@swamicare.com' THEN 'Wilson'
    WHEN email = 'pharmacist@swamicare.com' THEN 'Brown'
  END,
  '+91-9876543210',
  true
FROM auth.users 
WHERE email IN (
  'admin@swamicare.com',
  'doctor@swamicare.com', 
  'receptionist@swamicare.com',
  'attendant@swamicare.com',
  'pharmacist@swamicare.com'
);
```

### 6. Test the Application

1. **Start Development Server:**
   ```bash
   npm run dev
   ```

2. **Test Authentication Flow:**
   - Go to `http://localhost:3000`
   - Should redirect to `/login`
   - Try logging in with demo accounts:
     - **Admin:** admin@swamicare.com / password123
     - **Doctor:** doctor@swamicare.com / password123  
     - **Receptionist:** receptionist@swamicare.com / password123
     - **Attendant:** attendant@swamicare.com / password123
     - **Pharmacist:** pharmacist@swamicare.com / password123

3. **Verify Role-based Dashboards:**
   - Each user should be redirected to their appropriate dashboard
   - Check that navigation and UI elements load correctly
   - Verify that users can't access other role dashboards

### 7. Test Checklist

- [ ] Supabase project created and configured
- [ ] Environment variables set correctly  
- [ ] Database schema migrated successfully
- [ ] RLS policies applied without errors
- [ ] Demo users created in auth.users table
- [ ] User profiles created and linked correctly
- [ ] Application starts without errors
- [ ] Login page loads and functions
- [ ] Admin dashboard accessible and loads correctly
- [ ] Doctor dashboard accessible and loads correctly  
- [ ] Receptionist dashboard accessible and loads correctly
- [ ] Attendant dashboard accessible and loads correctly
- [ ] Pharmacist dashboard accessible and loads correctly
- [ ] Users cannot access unauthorized dashboards
- [ ] Logout functionality works

### 8. Troubleshooting

**Common Issues:**

1. **Build Errors:** Ensure all environment variables are set
2. **Auth Errors:** Check Supabase URL and keys are correct  
3. **Database Errors:** Verify schema and RLS policies are applied
4. **Login Issues:** Confirm demo users were created successfully

**Debug Commands:**
```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Check if users exist in Supabase
# Run in Supabase SQL Editor:
SELECT email, created_at FROM auth.users;
SELECT email, role, first_name FROM user_profiles;
```

### 9. Ready for Next Phase

Once all tests pass, we can proceed with implementing the Receptionist module features:
- Patient registration forms
- Visit management 
- Queue management
- Basic billing interface

---

**Status:** Foundation Ready for Testing ✅
**Next:** Database setup and user testing