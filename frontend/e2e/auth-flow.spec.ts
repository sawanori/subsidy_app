import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  const testEmail = `test-${Date.now()}@example.com`
  const testPassword = 'TestPassword123!'
  const testAccountName = 'テスト株式会社'

  test('should complete full authentication flow', async ({ page }) => {
    // 1. Start at home page
    await page.goto('http://localhost:3000/ja')

    // 2. Navigate to signup page
    await page.getByRole('link', { name: '新規登録' }).first().click()
    await expect(page).toHaveURL(/\/ja\/signup/)

    // 3. Fill out signup form
    await page.fill('#accountName', testAccountName)
    await page.fill('#email', testEmail)
    await page.fill('#password', testPassword)
    await page.fill('#confirmPassword', testPassword)

    // 4. Submit signup form
    await page.getByRole('button', { name: 'アカウントを作成' }).click()

    // 5. Wait for redirect to login page with success message
    await page.waitForURL(/\/ja\/login/, { timeout: 10000 })

    // 6. Login with created account
    await page.fill('#email', testEmail)
    await page.fill('#password', testPassword)
    await page.getByRole('button', { name: 'ログイン' }).click()

    // 7. Should redirect to applications page
    await page.waitForURL(/\/ja\/applications/, { timeout: 10000 })

    // 8. Verify user is authenticated
    await expect(page).toHaveURL(/\/ja\/applications/)
  })

  test('should protect application creation route', async ({ page }) => {
    // Try to access protected route without authentication
    await page.goto('http://localhost:3000/ja/application/new')

    // Should redirect to login page
    await expect(page).toHaveURL(/\/ja\/login/)

    // Check for redirect parameter
    const url = new URL(page.url())
    expect(url.searchParams.get('redirectedFrom')).toBe('/ja/application/new')
  })

  test('should prevent authenticated users from accessing auth pages', async ({ page }) => {
    // First, login
    await page.goto('http://localhost:3000/ja/login')
    await page.fill('#email', testEmail)
    await page.fill('#password', testPassword)
    await page.getByRole('button', { name: 'ログイン' }).click()

    // Wait for redirect to applications
    await page.waitForURL(/\/ja\/applications/, { timeout: 10000 })

    // Try to access login page again
    await page.goto('http://localhost:3000/ja/login')

    // Should redirect back to applications
    await expect(page).toHaveURL(/\/ja\/applications/)
  })
})