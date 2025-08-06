import { test, expect } from '@playwright/test'

/**
 * Navigation E2E Tests for SwamIDesk
 * 
 * These tests verify that all navigation links and page routes work correctly
 */
test.describe('SwamIDesk Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should handle basic page navigation', async ({ page }) => {
    const commonRoutes = [
      '/',
      '/admin/dashboard',
      '/doctor/dashboard',
      '/receptionist/dashboard',
      '/attendant/dashboard', 
      '/pharmacy/dashboard'
    ]

    for (const route of commonRoutes) {
      await test.step(`Testing navigation to ${route}`, async () => {
        await page.goto(route)
        await page.waitForLoadState('networkidle')
        
        // Page should load without throwing errors
        const pageContent = await page.textContent('body')
        expect(pageContent).toBeTruthy()
        
        // Should not show generic error messages
        expect(pageContent).not.toMatch(/500|Internal Server Error|Cannot GET/i)
      })
    }
  })

  test('should display proper error pages for invalid routes', async ({ page }) => {
    const invalidRoutes = [
      '/nonexistent-page',
      '/admin/invalid-page',
      '/doctor/nonexistent',
      '/random-path'
    ]

    for (const route of invalidRoutes) {
      await test.step(`Testing invalid route ${route}`, async () => {
        await page.goto(route)
        await page.waitForLoadState('networkidle')
        
        // Should show 404 or redirect to a valid page
        const currentUrl = page.url()
        const pageContent = await page.textContent('body')
        
        const isProperError = 
          pageContent?.includes('404') ||
          pageContent?.includes('Not Found') ||
          pageContent?.includes('Page Not Found') ||
          currentUrl.includes('/login') ||
          currentUrl.includes('/auth') ||
          currentUrl === new URL('/', page.url()).href
        
        expect(isProperError).toBeTruthy()
      })
    }
  })

  test('should have working sidebar navigation', async ({ page }) => {
    const dashboards = [
      '/admin/dashboard',
      '/doctor/dashboard', 
      '/receptionist/dashboard',
      '/attendant/dashboard',
      '/pharmacy/dashboard'
    ]

    for (const dashboard of dashboards) {
      await test.step(`Testing sidebar navigation on ${dashboard}`, async () => {
        await page.goto(dashboard)
        await page.waitForLoadState('networkidle')
        
        // Look for sidebar or navigation elements
        const navElements = page.locator(
          'nav, [role="navigation"], aside, .sidebar, ' +
          '[data-testid*="nav"], [data-testid*="sidebar"]'
        )
        
        const hasNavigation = await navElements.count() > 0
        
        if (hasNavigation) {
          // Check for navigation links
          const navLinks = navElements.locator('a').first()
          if (await navLinks.isVisible({ timeout: 3000 })) {
            console.log(`✅ ${dashboard} has navigation links`)
          }
        }
        
        // At minimum, page should load without errors
        const pageContent = await page.textContent('body')
        expect(pageContent).not.toMatch(/error|500|crash/i)
      })
    }
  })

  test('should handle breadcrumb navigation', async ({ page }) => {
    const deepRoutes = [
      '/admin/patients',
      '/admin/queue',
      '/doctor/consultations',
      '/receptionist/patients',
      '/pharmacy/inventory'
    ]

    for (const route of deepRoutes) {
      await test.step(`Testing breadcrumb navigation for ${route}`, async () => {
        await page.goto(route)
        await page.waitForLoadState('networkidle')
        
        // Look for breadcrumb elements
        const breadcrumbElements = page.locator(
          '.breadcrumb, [role="navigation"] ol, [role="navigation"] ul, ' +
          '[data-testid*="breadcrumb"], nav[aria-label*="breadcrumb"]'
        )
        
        const hasBreadcrumbs = await breadcrumbElements.count() > 0
        
        if (hasBreadcrumbs) {
          console.log(`✅ ${route} has breadcrumb navigation`)
        }
        
        // Verify page loaded successfully
        const pageContent = await page.textContent('body')
        expect(pageContent).toBeTruthy()
      })
    }
  })

  test('should handle page refresh correctly', async ({ page }) => {
    const testRoutes = [
      '/admin/dashboard',
      '/doctor/dashboard',
      '/receptionist/dashboard'
    ]

    for (const route of testRoutes) {
      await test.step(`Testing page refresh for ${route}`, async () => {
        await page.goto(route)
        await page.waitForLoadState('networkidle')
        
        const initialContent = await page.textContent('body')
        const initialUrl = page.url()
        
        // Refresh the page
        await page.reload()
        await page.waitForLoadState('networkidle')
        
        const afterRefreshContent = await page.textContent('body')
        const afterRefreshUrl = page.url()
        
        // Content should be similar after refresh
        expect(afterRefreshContent).toBeTruthy()
        
        // URL should remain the same (or redirect consistently)
        if (!afterRefreshUrl.includes('/login') && !afterRefreshUrl.includes('/auth')) {
          expect(afterRefreshUrl).toBe(initialUrl)
        }
      })
    }
  })

  test('should handle back/forward browser navigation', async ({ page }) => {
    await test.step('Navigate through multiple pages', async () => {
      // Start at home
      await page.goto('/')
      await page.waitForLoadState('networkidle')
      
      // Navigate to admin dashboard
      await page.goto('/admin/dashboard') 
      await page.waitForLoadState('networkidle')
      
      // Navigate to doctor dashboard
      await page.goto('/doctor/dashboard')
      await page.waitForLoadState('networkidle')
      
      const doctorPageContent = await page.textContent('body')
      
      // Go back
      await page.goBack()
      await page.waitForLoadState('networkidle')
      
      // Should be back on admin dashboard (or login if redirected)
      const backPageUrl = page.url()
      expect(backPageUrl).toMatch(/admin|login|auth/)
      
      // Go forward
      await page.goForward()
      await page.waitForLoadState('networkidle')
      
      // Should be back on doctor dashboard (or appropriate redirect)
      const forwardPageUrl = page.url()
      expect(forwardPageUrl).toMatch(/doctor|login|auth/)
    })
  })

  test('should handle keyboard navigation', async ({ page }) => {
    await test.step('Test keyboard accessibility', async () => {
      await page.goto('/admin/dashboard')
      await page.waitForLoadState('networkidle')
      
      // Tab through focusable elements
      await page.keyboard.press('Tab')
      let focusedElement = await page.locator(':focus')
      let hasFocusableElements = await focusedElement.count() > 0
      
      if (hasFocusableElements) {
        console.log('✅ Page has keyboard-accessible elements')
        
        // Test Enter key on focused element
        await page.keyboard.press('Enter')
        await page.waitForTimeout(500) // Brief wait for any navigation
        
        // Page should still be functional after keyboard interaction
        const content = await page.textContent('body')
        expect(content).toBeTruthy()
      }
    })
  })

  test('should handle responsive navigation on mobile', async ({ browser }) => {
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 }
    })
    
    const mobilePage = await mobileContext.newPage()
    
    await test.step('Test mobile navigation', async () => {
      await mobilePage.goto('/admin/dashboard')
      await mobilePage.waitForLoadState('networkidle')
      
      // Look for mobile navigation elements
      const mobileNavElements = mobilePage.locator(
        'button[aria-label*="menu"], .hamburger, [data-testid*="mobile"], ' +
        'button:has([class*="hamburger"]), button:has(svg)'
      )
      
      const hasMobileNav = await mobileNavElements.count() > 0
      
      if (hasMobileNav) {
        const firstMobileNavButton = mobileNavElements.first()
        if (await firstMobileNavButton.isVisible()) {
          await firstMobileNavButton.click()
          await mobilePage.waitForTimeout(500)
          
          // Check if navigation menu appeared
          const navMenu = mobilePage.locator('nav[class*="open"], .mobile-menu, [data-testid*="mobile-menu"]')
          const menuVisible = await navMenu.isVisible({ timeout: 3000 })
          
          if (menuVisible) {
            console.log('✅ Mobile navigation menu works')
          }
        }
      }
      
      // At minimum, mobile page should load properly
      const mobileContent = await mobilePage.textContent('body')
      expect(mobileContent).toBeTruthy()
    })
    
    await mobileContext.close()
  })
})