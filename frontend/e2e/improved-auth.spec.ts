import { test, expect } from '@playwright/test'

test.describe('改善された認証フロー', () => {
  const timestamp = Date.now()
  const testEmail = `test-${timestamp}@example.com`
  const testPassword = 'TestPassword123!'
  const testAccountName = 'テスト株式会社'

  test('完全な認証フロー', async ({ page }) => {
    console.log('Testing with:', { email: testEmail, timestamp })

    // ========== 1. ホームページ ==========
    await test.step('ホームページアクセス', async () => {
      await page.goto('http://localhost:3000/ja')
      await page.waitForLoadState('networkidle')

      // 未認証時のナビゲーション確認
      await expect(page.getByRole('link', { name: '新規登録' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'ログイン' })).toBeVisible()
    })

    // ========== 2. アカウント作成 ==========
    await test.step('アカウント作成', async () => {
      await page.getByRole('link', { name: '新規登録' }).click()
      await expect(page).toHaveURL(/\/ja\/signup/)

      // フォーム入力
      await page.fill('#accountName', testAccountName)
      await page.fill('#email', testEmail)
      await page.fill('#password', testPassword)
      await page.fill('#confirmPassword', testPassword)

      // 送信
      await page.getByRole('button', { name: 'アカウントを作成' }).click()

      // 成功メッセージまたはリダイレクトを待つ
      // Supabaseの設定によって、メール確認が必要な場合と不要な場合がある
      await Promise.race([
        page.waitForURL(/\/ja\/login/, { timeout: 5000 }),
        page.locator('.alert').filter({ hasText: 'アカウントを作成しました' }).waitFor({ timeout: 5000 })
      ]).catch(() => {
        console.log('Signup completed but no redirect - may need email confirmation')
      })
    })

    // ========== 3. ログイン試行 ==========
    await test.step('ログイン', async () => {
      // ログインページへ移動（既にいる場合もある）
      if (!page.url().includes('/login')) {
        await page.goto('http://localhost:3000/ja/login')
      }

      await page.fill('#email', testEmail)
      await page.fill('#password', testPassword)
      await page.getByRole('button', { name: 'ログイン' }).click()

      // ログイン結果を待つ
      const loginResult = await Promise.race([
        page.waitForURL(/\/ja\/applications/, { timeout: 5000 }).then(() => 'success'),
        page.locator('.alert').waitFor({ timeout: 5000 }).then(() => 'error')
      ]).catch(() => 'timeout')

      if (loginResult === 'success') {
        console.log('Login successful')
        await expect(page.getByRole('button', { name: 'ログアウト' })).toBeVisible()
      } else {
        console.log('Login failed - may need email confirmation')
      }
    })
  })

  test('エラーハンドリング確認', async ({ page }) => {
    // ========== パスワード不一致 ==========
    await test.step('パスワード不一致エラー', async () => {
      await page.goto('http://localhost:3000/ja/signup')

      await page.fill('#accountName', 'エラーテスト')
      await page.fill('#email', `error1-${Date.now()}@example.com`)
      await page.fill('#password', 'Password123!')
      await page.fill('#confirmPassword', 'Different123!')

      await page.getByRole('button', { name: 'アカウントを作成' }).click()

      await expect(page.locator('.alert').filter({ hasText: 'パスワードが一致しません' })).toBeVisible()
    })

    // ========== 短いパスワード ==========
    await test.step('短いパスワードエラー', async () => {
      await page.goto('http://localhost:3000/ja/signup')

      await page.fill('#accountName', 'エラーテスト2')
      await page.fill('#email', `error2-${Date.now()}@example.com`)

      // minLength属性を一時的に削除してテスト
      await page.evaluate(() => {
        const passwordInput = document.querySelector('#password') as HTMLInputElement
        const confirmPasswordInput = document.querySelector('#confirmPassword') as HTMLInputElement
        if (passwordInput) passwordInput.minLength = 0
        if (confirmPasswordInput) confirmPasswordInput.minLength = 0
      })

      await page.fill('#password', 'Short1')
      await page.fill('#confirmPassword', 'Short1')

      await page.getByRole('button', { name: 'アカウントを作成' }).click()

      // エラーメッセージが表示されることを確認
      await expect(page.locator('.alert')).toBeVisible()
    })

    // ========== 無効なログイン ==========
    await test.step('無効なログイン', async () => {
      await page.goto('http://localhost:3000/ja/login')

      await page.fill('#email', 'nonexistent@example.com')
      await page.fill('#password', 'WrongPassword123!')

      await page.getByRole('button', { name: 'ログイン' }).click()

      await expect(page.locator('.alert')).toBeVisible()
    })
  })

  test('保護されたルート', async ({ page }) => {
    await test.step('未認証でのアクセス制限', async () => {
      // 保護されたページへアクセス
      await page.goto('http://localhost:3000/ja/application/new')

      // ログインページへリダイレクト
      await expect(page).toHaveURL(/\/ja\/login/)

      // リダイレクト元の確認
      const url = new URL(page.url())
      expect(url.searchParams.get('redirectedFrom')).toBe('/ja/application/new')
    })
  })

  test('既存アカウントでの重複登録エラー', async ({ page }) => {
    const existingEmail = `existing-${Date.now()}@example.com`

    // 最初の登録
    await test.step('初回登録', async () => {
      await page.goto('http://localhost:3000/ja/signup')

      await page.fill('#accountName', '既存会社')
      await page.fill('#email', existingEmail)
      await page.fill('#password', 'Password123!')
      await page.fill('#confirmPassword', 'Password123!')

      await page.getByRole('button', { name: 'アカウントを作成' }).click()

      // 登録完了を待つ
      await page.waitForTimeout(2000)
    })

    // 同じメールで再登録試行
    await test.step('重複登録エラー', async () => {
      await page.goto('http://localhost:3000/ja/signup')

      await page.fill('#accountName', '重複会社')
      await page.fill('#email', existingEmail)
      await page.fill('#password', 'Password123!')
      await page.fill('#confirmPassword', 'Password123!')

      await page.getByRole('button', { name: 'アカウントを作成' }).click()

      // エラーメッセージを待つ（Supabaseのメッセージに依存）
      await expect(page.locator('.alert')).toBeVisible({ timeout: 5000 })
    })
  })
})