import { test, expect } from '@playwright/test'

test.describe('Complete Authentication Flow', () => {
  const testEmail = `test-${Date.now()}@example.com`
  const testPassword = 'TestPassword123!'
  const testAccountName = 'テスト株式会社'

  test('完全な認証フロー: アカウント作成→ログイン→ログアウト', async ({ page }) => {
    console.log('Testing with email:', testEmail)

    // ========== Step 1: ホームページアクセス ==========
    await test.step('ホームページにアクセス', async () => {
      await page.goto('http://localhost:3000/ja')
      await expect(page).toHaveTitle(/補助金/)

      // 未認証時は「新規登録」「ログイン」ボタンが表示される
      await expect(page.getByRole('link', { name: '新規登録' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'ログイン' })).toBeVisible()
    })

    // ========== Step 2: 新規登録 ==========
    await test.step('新規登録', async () => {
      // 新規登録ページへ移動
      await page.getByRole('link', { name: '新規登録' }).click()
      await expect(page).toHaveURL(/\/ja\/signup/)
      await expect(page.getByRole('heading', { name: 'アカウント作成' })).toBeVisible()

      // フォーム入力
      await page.fill('#accountName', testAccountName)
      await page.fill('#email', testEmail)
      await page.fill('#password', testPassword)
      await page.fill('#confirmPassword', testPassword)

      // 登録ボタンをクリック
      await page.getByRole('button', { name: 'アカウントを作成' }).click()

      // ログインページへリダイレクトされる（または成功メッセージ）
      await page.waitForURL(/\/ja\/login/, { timeout: 10000 })

      // 登録成功メッセージの確認
      const successAlert = page.locator('.alert').filter({ hasText: 'アカウントを作成しました' })
      if (await successAlert.count() > 0) {
        await expect(successAlert).toBeVisible()
      }
    })

    // ========== Step 3: ログイン ==========
    await test.step('ログイン', async () => {
      // 既にログインページにいるはず
      await expect(page).toHaveURL(/\/ja\/login/)
      await expect(page.getByRole('heading', { name: 'ログイン' })).toBeVisible()

      // フォーム入力
      await page.fill('#email', testEmail)
      await page.fill('#password', testPassword)

      // ログインボタンをクリック
      await page.getByRole('button', { name: 'ログイン' }).click()

      // アプリケーションページへリダイレクト
      await page.waitForURL(/\/ja\/applications/, { timeout: 10000 })

      // ログイン成功の確認（ログアウトボタンが表示される）
      await expect(page.getByRole('button', { name: 'ログアウト' })).toBeVisible()

      // ユーザーアイコンが表示される
      await expect(page.locator('button[title*="@"]')).toBeVisible()
    })

    // ========== Step 4: 認証済みユーザーのナビゲーション確認 ==========
    await test.step('認証済みユーザーのナビゲーション確認', async () => {
      // ホームに戻る
      await page.getByRole('link', { name: 'ホーム' }).click()
      await expect(page).toHaveURL(/\/ja$/)

      // 認証済みの場合、「新規申請」ボタンが表示される
      await expect(page.getByRole('link', { name: '新規申請' })).toBeVisible()

      // 「新規登録」「ログイン」ボタンは表示されない
      await expect(page.getByRole('link', { name: '新規登録' })).not.toBeVisible()
      await expect(page.getByRole('link', { name: 'ログイン' })).not.toBeVisible()
    })

    // ========== Step 5: 保護されたルートへのアクセス ==========
    await test.step('保護されたルートへのアクセス', async () => {
      // 新規申請ページへアクセス（認証済みなのでアクセス可能）
      await page.goto('http://localhost:3000/ja/application/new')
      await expect(page).toHaveURL(/\/ja\/application\/new/)

      // ApplicationWizardが表示される
      await expect(page.getByText('基本情報')).toBeVisible()
    })

    // ========== Step 6: ログアウト ==========
    await test.step('ログアウト', async () => {
      // ログアウトボタンをクリック
      await page.getByRole('button', { name: 'ログアウト' }).click()

      // ログインページへリダイレクト
      await page.waitForURL(/\/ja\/login/, { timeout: 10000 })

      // ログアウト後は「ログイン」フォームが表示される
      await expect(page.getByRole('heading', { name: 'ログイン' })).toBeVisible()
    })

    // ========== Step 7: ログアウト後の保護されたルートへのアクセス ==========
    await test.step('ログアウト後の保護されたルートへのアクセス', async () => {
      // 保護されたルートへアクセス試行
      await page.goto('http://localhost:3000/ja/application/new')

      // ログインページへリダイレクトされる
      await expect(page).toHaveURL(/\/ja\/login/)

      // リダイレクト元のURLがクエリパラメータに含まれる
      const url = new URL(page.url())
      expect(url.searchParams.get('redirectedFrom')).toBe('/ja/application/new')
    })

    // ========== Step 8: 再ログイン ==========
    await test.step('再ログイン', async () => {
      // 同じアカウントで再ログイン
      await page.fill('#email', testEmail)
      await page.fill('#password', testPassword)
      await page.getByRole('button', { name: 'ログイン' }).click()

      // アプリケーションページへリダイレクト
      await page.waitForURL(/\/ja\/applications/, { timeout: 10000 })

      // ログイン成功
      await expect(page.getByRole('button', { name: 'ログアウト' })).toBeVisible()
    })
  })

  test('パスワード不一致エラー', async ({ page }) => {
    await page.goto('http://localhost:3000/ja/signup')

    // パスワード不一致で登録試行
    await page.fill('#accountName', 'エラーテスト会社')
    await page.fill('#email', `error-${Date.now()}@example.com`)
    await page.fill('#password', 'Password123!')
    await page.fill('#confirmPassword', 'DifferentPassword123!')

    await page.getByRole('button', { name: 'アカウントを作成' }).click()

    // エラーメッセージが表示される
    await expect(page.locator('.alert').filter({ hasText: 'パスワードが一致しません' })).toBeVisible()
  })

  test('無効な認証情報でのログイン', async ({ page }) => {
    await page.goto('http://localhost:3000/ja/login')

    // 存在しないユーザーでログイン試行
    await page.fill('#email', 'nonexistent@example.com')
    await page.fill('#password', 'WrongPassword123!')

    await page.getByRole('button', { name: 'ログイン' }).click()

    // エラーメッセージが表示される
    await expect(page.locator('.alert').filter({ hasText: /メールアドレスまたはパスワードが正しくありません|Invalid login credentials/ })).toBeVisible()
  })
})