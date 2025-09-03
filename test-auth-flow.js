/**
 * Test script to verify authentication flow
 * Run this in browser console to test the complete login → dashboard → refresh cycle
 */

console.log('🧪 Starting Authentication Flow Test');

// Test 1: Check if AuthProvider is properly initialized
const testAuthProvider = () => {
  console.log('\n1️⃣ Testing AuthProvider Initialization...');
  
  // Check if context is available
  const authElement = document.querySelector('[data-auth-context]');
  if (authElement) {
    console.log('✅ AuthProvider wrapper detected');
  } else {
    console.log('⚠️ AuthProvider wrapper not found - checking for auth state');
  }
  
  // Check localStorage auth state
  const localAuth = localStorage.getItem('swamicare_user');
  if (localAuth) {
    console.log('✅ Local auth data found:', JSON.parse(localAuth));
  } else {
    console.log('❌ No local auth data found');
  }
};

// Test 2: Verify page titles during navigation
const testPageTitles = () => {
  console.log('\n2️⃣ Testing Page Titles...');
  console.log('Current page title:', document.title);
  
  // Check if title changes appropriately
  const expectedTitles = {
    '/login': 'Login - SwamiCare',
    '/receptionist/dashboard': 'Receptionist Dashboard - SwamiCare',
    'loading': 'Loading... - SwamiCare'
  };
  
  const currentPath = window.location.pathname;
  const expectedTitle = expectedTitles[currentPath];
  
  if (expectedTitle && document.title === expectedTitle) {
    console.log('✅ Page title matches expected:', expectedTitle);
  } else {
    console.log('⚠️ Page title mismatch. Expected:', expectedTitle, 'Got:', document.title);
  }
};

// Test 3: Check authentication loading states
const testLoadingStates = () => {
  console.log('\n3️⃣ Testing Loading States...');
  
  const loadingElements = document.querySelectorAll('[class*="animate-spin"], [class*="loading"]');
  if (loadingElements.length > 0) {
    console.log('⏳ Loading indicators found:', loadingElements.length);
  } else {
    console.log('✅ No loading indicators (page fully loaded)');
  }
  
  // Check for "loading user" text that was causing the original issue
  const loadingUserText = document.body.textContent.includes('loading user');
  if (loadingUserText) {
    console.log('❌ Found "loading user" text - this was the original issue!');
  } else {
    console.log('✅ No "loading user" text found - issue resolved');
  }
};

// Test 4: Verify receptionist role access
const testRoleAccess = () => {
  console.log('\n4️⃣ Testing Role-based Access...');
  
  const currentPath = window.location.pathname;
  if (currentPath.includes('/receptionist/')) {
    console.log('✅ Successfully accessing receptionist pages');
    
    // Check if dashboard data is loading
    const dashboardStats = document.querySelectorAll('[class*="font-bold"]');
    if (dashboardStats.length > 0) {
      console.log('✅ Dashboard stats elements found:', dashboardStats.length);
    } else {
      console.log('⚠️ Dashboard stats not found - may still be loading');
    }
  }
};

// Test 5: Authentication persistence across page reload
const testAuthPersistence = () => {
  console.log('\n5️⃣ Testing Authentication Persistence...');
  
  const testReload = () => {
    console.log('Simulating page reload in 3 seconds...');
    console.log('Watch for authentication state preservation...');
    
    setTimeout(() => {
      window.location.reload();
    }, 3000);
  };
  
  // Only run if on dashboard (authenticated page)
  if (window.location.pathname.includes('/dashboard')) {
    console.log('Ready to test reload persistence. Call testReload() to proceed.');
    window.testReload = testReload;
  } else {
    console.log('Navigate to dashboard first to test persistence.');
  }
};

// Run all tests
const runAllTests = () => {
  testAuthProvider();
  testPageTitles();
  testLoadingStates();
  testRoleAccess();
  testAuthPersistence();
  
  console.log('\n🎯 Authentication Flow Test Complete!');
  console.log('Navigate through login → dashboard → refresh to verify all functionality.');
};

// Make functions available globally
window.testAuthProvider = testAuthProvider;
window.testPageTitles = testPageTitles;
window.testLoadingStates = testLoadingStates;
window.testRoleAccess = testRoleAccess;
window.testAuthPersistence = testAuthPersistence;
window.runAllTests = runAllTests;

// Auto-run tests
runAllTests();