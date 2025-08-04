# 🧪 SwamiCare Foundation Testing Guide

## 📋 **Testing Checklist**

### Step 1: Supabase Project Setup
- [ ] Create new Supabase project
- [ ] Configure environment variables
- [ ] Run database schema migration
- [ ] Setup RLS policies
- [ ] Create demo user accounts

### Step 2: Application Testing
- [ ] Build and run the application
- [ ] Test login functionality
- [ ] Verify role-based redirects
- [ ] Test all dashboard layouts
- [ ] Check navigation and permissions

### Step 3: Database Verification
- [ ] Verify all tables are created
- [ ] Test RLS policies work correctly
- [ ] Check database functions
- [ ] Verify user profiles integration

---

## 🚀 **Setup Instructions**

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready (2-3 minutes)
3. Get your project credentials:
   - Project URL: `https://your-project-id.supabase.co`
   - Anon Key: Found in Settings > API
   - Service Role Key: Found in Settings > API

### 2. Configure Environment Variables

Create `.env.local` file:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Database Migrations

In your Supabase project dashboard:

1. Go to **SQL Editor**
2. Create a new query
3. Copy and paste the content from `supabase/schema.sql`
4. Run the query
5. Repeat for `supabase/rls-policies.sql`
6. Finally run `supabase/seed-data.sql`

### 4. Create Demo User Accounts

In Supabase **Authentication** section:

#### Admin User:
- Email: `admin@swamicare.com`
- Password: `password123`
- **After creation**: Go to SQL Editor and run:
```sql
INSERT INTO user_profiles (id, name, email, role, department, specialization)
VALUES (
  'admin-user-id-from-auth-users-table',
  'Dr. Admin User',
  'admin@swamicare.com',
  'admin',
  'Administration',
  'System Administration'
);
```

#### Doctor User:
- Email: `doctor@swamicare.com`
- Password: `password123`
- **Profile**: Doctor, ENT Department

#### Receptionist User:
- Email: `receptionist@swamicare.com`
- Password: `password123`
- **Profile**: Receptionist, Reception Department

#### Service Attendant User:
- Email: `attendant@swamicare.com`
- Password: `password123`
- **Profile**: Service Attendant, ENT Department

#### Pharmacist User:
- Email: `pharmacist@swamicare.com`
- Password: `password123`
- **Profile**: Pharmacist, Pharmacy Department

---

## 🔧 **Development Setup**

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Open Application
Navigate to `http://localhost:3000`

---

## ✅ **Testing Scenarios**

### Authentication Testing

#### Scenario 1: Login Flow
1. Navigate to `/login`
2. Try logging in with demo accounts
3. Verify redirects to correct dashboards:
   - Admin → `/admin/dashboard`
   - Doctor → `/doctor/dashboard`
   - Receptionist → `/receptionist/dashboard`
   - Attendant → `/attendant/dashboard`
   - Pharmacist → `/pharmacy/dashboard`

#### Scenario 2: Role-Based Access
1. Login as Doctor
2. Try accessing `/admin/dashboard` directly
3. Verify redirect to unauthorized or dashboard
4. Test with different roles

#### Scenario 3: Session Management
1. Login successfully
2. Refresh the page
3. Verify user remains logged in
4. Test logout functionality

### Dashboard Testing

#### Admin Dashboard
- [ ] All stat cards display
- [ ] Department performance shows
- [ ] System status indicators work
- [ ] Quick actions are clickable
- [ ] Recent activity displays

#### Doctor Dashboard
- [ ] Patient queue displays
- [ ] Today's stats show correctly
- [ ] Quick actions work
- [ ] Navigation menu has doctor-specific items

#### Receptionist Dashboard
- [ ] Patient registration stats
- [ ] Queue management displays
- [ ] Department queue shows
- [ ] Revenue tracking visible

#### Service Attendant Dashboard
- [ ] Service queue displays
- [ ] Assigned services show
- [ ] Status indicators work
- [ ] Action buttons functional

#### Pharmacy Dashboard
- [ ] Prescription queue shows
- [ ] Inventory stats display
- [ ] Low stock alerts visible
- [ ] Expiry warnings show

### Navigation Testing

#### Sidebar Navigation
1. Login with each role
2. Verify sidebar shows role-appropriate menu items
3. Test navigation between pages
4. Check active state highlighting

#### Role-Based Menu Items
- **Admin**: All items visible
- **Doctor**: Consultations, Prescriptions, Treatment Plans
- **Receptionist**: Patients, Queue, Billing
- **Service Attendant**: Services, Procedures
- **Pharmacist**: Pharmacy, Inventory, Medicines

### UI/UX Testing

#### Responsive Design
1. Test on desktop (1920x1080)
2. Test on tablet (768px width)
3. Test on mobile (375px width)
4. Verify sidebar collapses on mobile

#### Component Testing
1. Cards display correctly
2. Buttons are interactive
3. Icons load properly
4. Typography is consistent
5. Colors follow theme

---

## 🐛 **Common Issues & Solutions**

### Issue 1: "Invalid JWT" Error
**Cause**: Environment variables not set correctly
**Solution**: 
1. Check `.env.local` file exists
2. Verify Supabase URL and keys are correct
3. Restart development server

### Issue 2: "Table does not exist" Error
**Cause**: Database schema not migrated
**Solution**:
1. Run the schema.sql file in Supabase SQL Editor
2. Verify all tables are created in the Database section

### Issue 3: "Access denied" Error
**Cause**: RLS policies not applied or user profiles missing
**Solution**:
1. Run rls-policies.sql in SQL Editor
2. Ensure user_profiles records exist for test users

### Issue 4: Redirect Loop on Login
**Cause**: User profile not found after authentication
**Solution**:
1. Check user_profiles table has records
2. Verify user IDs match between auth.users and user_profiles

### Issue 5: Sidebar Not Showing Correct Items
**Cause**: Role not properly set in user profile
**Solution**:
1. Check user_profiles.role column
2. Verify role enum values match TypeScript types

---

## 📊 **Testing Results Template**

### Environment
- **OS**: 
- **Browser**: 
- **Screen Resolution**: 
- **Supabase Project**: 

### Test Results

#### ✅ Authentication
- [ ] Login works for all roles
- [ ] Redirects to correct dashboards
- [ ] Session persistence works
- [ ] Logout functionality works

#### ✅ Role-Based Access
- [ ] Admin can access all areas
- [ ] Doctor sees doctor-specific menu
- [ ] Receptionist sees reception menu
- [ ] Service Attendant sees attendant menu
- [ ] Pharmacist sees pharmacy menu

#### ✅ UI/UX
- [ ] All dashboards render correctly
- [ ] Responsive design works
- [ ] Navigation is intuitive
- [ ] Performance is acceptable

#### ✅ Database
- [ ] All tables created successfully
- [ ] RLS policies working
- [ ] Demo data loaded
- [ ] User profiles linked correctly

### Issues Found
1. 
2. 
3. 

### Overall Assessment
- **Status**: ✅ Pass / ❌ Fail
- **Ready for Next Phase**: Yes / No
- **Notes**: 

---

## 🎯 **Success Criteria**

For the foundation to be considered "ready":

1. **✅ All 5 user roles can login successfully**
2. **✅ Role-based dashboards display correctly**
3. **✅ Navigation works for all roles**
4. **✅ No console errors or warnings**
5. **✅ Responsive design works on mobile/tablet**
6. **✅ Database tables and policies are functional**

Once these criteria are met, we can proceed with implementing the Receptionist module! 🚀