import { test, expect } from '@playwright/test'

test.describe('シンプルな認証テスト', () => {
  const testEmail = `test-${Date.now()}@example.com`
  const testPassword = 'TestPassword123!'
  const testAccountName = 'テスト株式会社'

  test('アカウント作成・ログイン・ログアウトの基本フロー', async ({ page }) => {
    console.log('テスト用メール:', testEmail)

    // ========== 1. ホームページ確認 ==========
    await page.goto('http://localhost:3000/ja')
    await page.waitForLoadState('domcontentloaded')

    // 新規登録ボタンの存在確認
    const signupButton = page.getByRole('link', { name: '新規登録' })
    await expect(signupButton).toBeVisible()

    // ========== 2. サインアップページへ移動 ==========
    await signupButton.click()
    await page.waitForURL(/\/ja\/signup/)

    // タイトル確認（実際の表示に合わせる）
    await expect(page.getByText('アカウント作成')).toBeVisible()

    // ========== 3. アカウント作成 ==========
    // フォーム入力
    await page.fill('#accountName', testAccountName)
    await page.fill('#email', testEmail)
    await page.fill('#password', testPassword)
    await page.fill('#confirmPassword', testPassword)

    // 送信
    await page.getByRole('button', { name: 'アカウントを作成' }).click()

    // リダイレクト待機（ログインページへ）
    await page.waitForURL(/\/ja\/login/, { timeout: 10000 })
    console.log('アカウント作成完了、ログインページへリダイレクト')

    // ========== 4. ログイン ==========
    await page.fill('#email', testEmail)
    await page.fill('#password', testPassword)
    await page.getByRole('button', { name: 'ログイン' }).click()

    // アプリケーションページへのリダイレクト待機
    await page.waitForURL(/\/ja\/applications/, { timeout: 10000 })
    console.log('ログイン成功')

    // ログアウトボタンの存在確認
    const logoutButton = page.getByRole('button', { name: 'ログアウト' })
    await expect(logoutButton).toBeVisible()

    // ========== 5. ログアウト ==========
    await logoutButton.click()

    // ログインページへのリダイレクト待機
    await page.waitForURL(/\/ja\/login/, { timeout: 10000 })
    console.log('ログアウト完了')

    // ログインフォームの存在確認
    await expect(page.getByText('ログイン')).toBeVisible()
  })

  test('パスワード不一致のエラー処理', async ({ page }) => {
    await page.goto('http://localhost:3000/ja/signup')
    await page.waitForLoadState('domcontentloaded')

    // 不一致パスワードで入力
    await page.fill('#accountName', 'エラーテスト')
    await page.fill('#email', `error-${Date.now()}@example.com`)
    await page.fill('#password', 'Password123!')
    await page.fill('#confirmPassword', 'Different123!')

    // 送信
    await page.getByRole('button', { name: 'アカウントを作成' }).click()

    // エラーメッセージ確認
    await expect(page.locator('.alert').filter({ hasText: 'パスワードが一致しません' })).toBeVisible()
  })

  test('無効な認証情報でのログインエラー', async ({ page }) => {
    await page.goto('http://localhost:3000/ja/login')
    await page.waitForLoadState('domcontentloaded')

    // 無効な認証情報で入力
    await page.fill('#email', 'invalid@example.com')
    await page.fill('#password', 'WrongPassword123!')

    // 送信
    await page.getByRole('button', { name: 'ログイン' }).click()

    // エラーメッセージ確認（いずれかのメッセージ）
    await expect(page.locator('.alert')).toBeVisible()
  })

  test('認証が必要なページへのアクセス制限', async ({ page }) => {
    // 未認証で保護されたページへアクセス
    await page.goto('http://localhost:3000/ja/application/new')

    // ログインページへリダイレクトされることを確認
    await expect(page).toHaveURL(/\/ja\/login/)

    // リダイレクト元の確認
    const url = new URL(page.url())
    expect(url.searchParams.get('redirectedFrom')).toBe('/ja/application/new')
  })
})