# SwamiCare Cloud Testing Setup 🚀

## Alternative: Cloud Supabase Project (Recommended)

Since Docker is not available locally, we'll use a cloud Supabase project which is actually **faster and easier** for testing!

## Quick Setup (3 minutes total)

### 1. Create Cloud Supabase Project (1 minute)
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Name: `swamicare-test`
4. Set database password: `swamicare123!`
5. Choose closest region
6. Click "Create new project"

### 2. Get Project Credentials (30 seconds)
Once ready, go to **Settings** → **API**:
- Copy **Project URL**
- Copy **anon public** key
- Copy **service_role secret** key

### 3. Set Environment Variables (30 seconds)
Create `.env.local` file:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 4. Run Database Migrations (1 minute)
In Supabase SQL Editor, run **in this exact order**:

**Step 1:** Copy/paste entire content of `supabase/migrations/20250804000001_initial_schema.sql`

**Step 2:** Copy/paste entire content of `supabase/migrations/20250804000002_rls_policies.sql`

**Step 3:** Copy/paste entire content of `supabase/seed.sql`

### 5. Test the Application! (30 seconds)
```bash
npm run dev
```

Go to http://localhost:3000 and login with:
- **Admin:** admin@swamicare.com / password123
- **Doctor:** doctor@swamicare.com / password123  
- **Receptionist:** receptionist@swamicare.com / password123

## ✅ Expected Results
- Login page loads with SwamiCare branding ✅
- Authentication redirects to appropriate dashboards ✅
- All role dashboards display correctly ✅
- Sample data visible (patients, services, medicines) ✅
- No console errors ✅

## 🎯 Advantages of Cloud Setup
- **No Docker required** - works on any machine
- **Faster setup** - no local containers to download
- **Real Supabase environment** - exactly like production
- **Built-in database GUI** - Supabase Studio included
- **Automatic backups** - data is safe in cloud
- **Easy sharing** - others can test same database

## Alternative: Local with Docker
If you prefer local development, install Docker Desktop first:
```bash
brew install --cask docker
# Then restart terminal and run: supabase start
```

---
**Recommended: Use cloud setup - it's faster and easier!** ⚡