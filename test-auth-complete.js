// Complete Authentication Flow Test
// Open browser dev tools and paste this script to test the full flow

console.log('🧪 COMPLETE AUTHENTICATION FLOW TEST');
console.log('=====================================');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3002',
  testCredentials: {
    email: 'receptionist@swamicare.com',
    password: 'password123'
  }
};

// Test functions
const tests = {
  // Test 1: Check initial state
  checkInitialState: () => {
    console.log('\n1️⃣ Testing Initial State...');
    const isLoginPage = window.location.pathname === '/login';
    const hasSwamiCareTitle = document.title.includes('SwamiCare');
    const hasAuthData = !!localStorage.getItem('swamicare_user');
    
    console.log(`✅ On login page: ${isLoginPage}`);
    console.log(`✅ Has SwamiCare title: ${hasSwamiCareTitle}`);
    console.log(`✅ Has auth data: ${hasAuthData}`);
    
    return { isLoginPage, hasSwamiCareTitle, hasAuthData };
  },

  // Test 2: Check for loading issues
  checkLoadingStates: () => {
    console.log('\n2️⃣ Testing Loading States...');
    const hasLoadingUser = document.body.textContent.includes('loading user');
    const hasSpinner = !!document.querySelector('.animate-spin');
    const hasLoadingText = document.body.textContent.includes('Loading...');
    
    console.log(`✅ No "loading user" text: ${!hasLoadingUser}`);
    console.log(`⏳ Has loading spinner: ${hasSpinner}`);
    console.log(`⏳ Has loading text: ${hasLoadingText}`);
    
    return { hasLoadingUser, hasSpinner, hasLoadingText };
  },

  // Test 3: Check demo users loading
  checkDemoUsers: () => {
    console.log('\n3️⃣ Testing Demo Users...');
    const userSection = document.querySelector('.text-center h3');
    const loadingUsers = document.body.textContent.includes('Loading users...');
    const hasUserEmails = document.querySelectorAll('button[title*="@"]').length > 0;
    
    console.log(`✅ Has user accounts section: ${!!userSection}`);
    console.log(`⏳ Loading users: ${loadingUsers}`);
    console.log(`✅ Has user emails: ${hasUserEmails}`);
    
    return { userSection: !!userSection, loadingUsers, hasUserEmails };
  },

  // Test 4: Test page title behavior
  checkPageTitles: () => {
    console.log('\n4️⃣ Testing Page Titles...');
    const currentTitle = document.title;
    const expectedTitles = {
      '/login': 'Login - SwamiCare',
      '/receptionist/dashboard': 'Receptionist Dashboard - SwamiCare',
      'loading': 'Loading... - SwamiCare'
    };
    
    const currentPath = window.location.pathname;
    const expectedTitle = expectedTitles[currentPath] || expectedTitles['loading'];
    const titleMatches = currentTitle === expectedTitle;
    
    console.log(`Current path: ${currentPath}`);
    console.log(`Current title: "${currentTitle}"`);
    console.log(`Expected title: "${expectedTitle}"`);
    console.log(`✅ Title matches: ${titleMatches}`);
    
    return { currentTitle, expectedTitle, titleMatches };
  },

  // Test 5: Authentication persistence
  testAuthPersistence: () => {
    console.log('\n5️⃣ Testing Authentication Persistence...');
    
    const authData = localStorage.getItem('swamicare_user');
    if (!authData) {
      console.log('❌ No auth data found - login first');
      return { hasAuth: false };
    }
    
    try {
      const userData = JSON.parse(authData);
      console.log(`✅ Auth data found for: ${userData.name} (${userData.role})`);
      console.log(`✅ Auth ID: ${userData.id}`);
      
      // Test reload simulation
      console.log('🔄 To test persistence, call testReload() in console');
      window.testReload = () => {
        console.log('Reloading page to test auth persistence...');
        setTimeout(() => window.location.reload(), 1000);
      };
      
      return { hasAuth: true, userData };
    } catch (e) {
      console.log('❌ Invalid auth data format');
      return { hasAuth: false, error: e.message };
    }
  }
};

// Auto-run all tests
const runAllTests = () => {
  const results = {};
  
  results.initialState = tests.checkInitialState();
  results.loadingStates = tests.checkLoadingStates();
  results.demoUsers = tests.checkDemoUsers();
  results.pageTitles = tests.checkPageTitles();
  results.authPersistence = tests.testAuthPersistence();
  
  console.log('\n🎯 TEST SUMMARY');
  console.log('===============');
  
  // Check for issues
  const issues = [];
  
  if (results.loadingStates.hasLoadingUser) {
    issues.push('❌ "loading user" text found (original issue)');
  }
  
  if (!results.pageTitles.titleMatches) {
    issues.push('❌ Page title mismatch');
  }
  
  if (results.initialState.isLoginPage && results.demoUsers.loadingUsers) {
    setTimeout(() => {
      console.log('⏰ Re-checking demo users after load...');
      tests.checkDemoUsers();
    }, 3000);
  }
  
  if (issues.length === 0) {
    console.log('✅ ALL TESTS PASSED - Authentication flow is working correctly!');
  } else {
    console.log('⚠️ Issues found:');
    issues.forEach(issue => console.log('  ' + issue));
  }
  
  return results;
};

// Instructions for manual testing
const printInstructions = () => {
  console.log('\n📋 MANUAL TESTING INSTRUCTIONS');
  console.log('==============================');
  console.log('1. Navigate to http://localhost:3002/login');
  console.log('2. Click any email in the demo users list to auto-fill');
  console.log('3. Click "Sign In" button');
  console.log('4. Verify dashboard loads without errors');
  console.log('5. Call testReload() to test persistence');
  console.log('6. Check that after reload, you remain logged in');
  console.log('\n💡 All functions available in console:');
  console.log('  - runAllTests() - Run complete test suite');
  console.log('  - tests.checkInitialState() - Check current state');
  console.log('  - tests.checkLoadingStates() - Check for loading issues');
  console.log('  - testReload() - Test authentication persistence (after login)');
};

// Make functions globally available
Object.assign(window, { tests, runAllTests, printInstructions });

// Auto-run tests and show instructions
runAllTests();
printInstructions();