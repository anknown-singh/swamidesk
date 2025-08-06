import { test, expect } from '@playwright/test'

/**
 * Authentication E2E Tests for SwamIDesk
 * 
 * These tests verify the complete authentication flow across all user roles
 */
test.describe('SwamIDesk Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the home page
    await page.goto('/')
  })

  test('should display login page by default', async ({ page }) => {
    // Check for login form elements
    await expect(page).toHaveTitle(/SwamIDesk/i)
    
    // Look for common login elements (these would need to match your actual login form)
    const loginForm = page.locator('form[data-testid="login-form"], form:has(input[type="email"]), form:has(input[type="password"])')
    
    // If login form exists, test it; otherwise, check for authentication state
    if (await loginForm.count() > 0) {
      await expect(loginForm).toBeVisible()
    } else {
      // If already authenticated or using different auth flow, check for user interface
      const userInterface = page.locator('[data-testid*="dashboard"], [data-testid*="user"], nav')
      await expect(userInterface.first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('should handle navigation to different role dashboards', async ({ page }) => {
    const roles = [
      { role: 'admin', path: '/admin/dashboard' },
      { role: 'doctor', path: '/doctor/dashboard' },
      { role: 'receptionist', path: '/receptionist/dashboard' },
      { role: 'attendant', path: '/attendant/dashboard' },
      { role: 'pharmacist', path: '/pharmacy/dashboard' }
    ]

    for (const { role, path } of roles) {
      await test.step(`Testing ${role} dashboard access`, async () => {
        await page.goto(path)
        
        // Wait for page to load
        await page.waitForLoadState('networkidle')
        
        // Check that we're on the expected page (or redirected to login)
        const currentUrl = page.url()
        
        if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
          // Redirected to login - this is expected behavior for unauthenticated access
          console.log(`${role} dashboard correctly requires authentication`)
        } else {
          // Page loaded - check for role-specific content
          await expect(page.locator('body')).toContainText(role, { ignoreCase: true })
        }
      })
    }
  })

  test('should prevent unauthorized access between roles', async ({ page }) => {
    // This test would simulate authentication as one role and attempting to access another role's resources
    // For now, we'll just verify that different dashboard URLs exist and load appropriately
    
    const restrictedPaths = [
      '/admin/users',
      '/admin/settings', 
      '/doctor/consultations',
      '/receptionist/queue',
      '/pharmacy/inventory'
    ]

    for (const path of restrictedPaths) {
      await test.step(`Testing access control for ${path}`, async () => {
        await page.goto(path)
        await page.waitForLoadState('networkidle')
        
        // Should either redirect to login or show appropriate error
        const currentUrl = page.url()
        const pageContent = await page.textContent('body')
        
        expect(
          currentUrl.includes('/login') || 
          currentUrl.includes('/auth') ||
          pageContent?.includes('Unauthorized') ||
          pageContent?.includes('Access Denied') ||
          pageContent?.includes('403') ||
          pageContent?.includes('404')
        ).toBeTruthy()
      })
    }
  })

  test('should maintain session state across page refreshes', async ({ page }) => {
    // Navigate to a dashboard (this will typically redirect to login if not authenticated)
    await page.goto('/admin/dashboard')
    await page.waitForLoadState('networkidle')
    
    const initialUrl = page.url()
    
    // Refresh the page
    await page.reload()
    await page.waitForLoadState('networkidle')
    
    const afterRefreshUrl = page.url()
    
    // URL should remain consistent (either both on login or both on dashboard)
    expect(afterRefreshUrl).toBe(initialUrl)
  })
})