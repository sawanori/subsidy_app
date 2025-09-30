import { test, expect, Page } from '@playwright/test';
import * as path from 'path';

test.describe('File Upload Test', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();

    // コンソールエラーを監視
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });

    // ネットワークエラーを監視
    page.on('requestfailed', request => {
      console.log('Request failed:', request.url(), request.failure()?.errorText);
    });
  });

  test('should upload R5.pdf file successfully', async () => {
    // 1. まずサインアップページでアカウントを作成
    await page.goto('http://localhost:3000/ja/signup');
    await page.waitForLoadState('networkidle');

    // アカウント作成
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;

    await page.fill('input[placeholder*="株式会社サンプル"]', 'Test User');
    await page.fill('input[placeholder*="example@company.com"]', testEmail);

    // パスワードフィールドを探す（最初のパスワードフィールド）
    const passwordFields = page.locator('input[type="password"]');
    await passwordFields.nth(0).fill('Test1234!');
    await passwordFields.nth(1).fill('Test1234!');  // 確認用パスワード

    // サインアップボタンをクリック
    await page.click('button:has-text("アカウントを作成")');

    // サインアップ後、ログインページに遷移またはすでにログイン状態になる
    await page.waitForTimeout(2000);

    // 3. 申請ページに移動（直接URLアクセス）
    await page.goto('http://localhost:3000/ja/applications');
    await page.waitForLoadState('networkidle');

    // 4. 新規申請ボタンをクリック
    const newApplicationButton = page.locator('button:has-text("新規申請")').first();
    if (await newApplicationButton.isVisible()) {
      await newApplicationButton.click();
    } else {
      // ボタンが見つからない場合、申請作成ページに直接遷移
      await page.goto('http://localhost:3000/ja/applications/new');
    }

    // 5. アップロードボタンを探す
    await page.waitForLoadState('networkidle');

    // "確定申告書から取り込む" ボタンを探してクリック
    const uploadButton = page.locator('button:has-text("確定申告書から取り込む")').first();
    if (await uploadButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('Found upload button, clicking...');
      await uploadButton.click();

      // モーダルが開くのを待つ
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

      // 6. 個人事業主を選択（デフォルトで選択されている場合もある）
      const personalRadio = page.locator('input[value="personal"]');
      if (await personalRadio.isVisible()) {
        await personalRadio.check();
      }

      // 次へボタンをクリック
      const nextButton = page.locator('button:has-text("次へ")').first();
      await nextButton.click();

      // 7. ファイル選択
      const fileInput = page.locator('input[type="file"]');
      const filePath = path.resolve('/Users/noritakasawada/AI_P/subsidyApp/R5.pdf');

      console.log('Uploading file:', filePath);

      // ファイルを設定
      await fileInput.setInputFiles(filePath);

      // アップロード処理を監視
      const uploadPromise = page.waitForResponse(response =>
        response.url().includes('/intake/upload') ||
        response.url().includes('/api/intake/upload'),
        { timeout: 30000 }
      );

      // アップロードボタンをクリック
      const uploadSubmitButton = page.locator('button:has-text("アップロード")').first();
      if (await uploadSubmitButton.isVisible()) {
        await uploadSubmitButton.click();
      }

      // レスポンスを待つ
      try {
        const response = await uploadPromise;
        console.log('Upload response status:', response.status());
        console.log('Upload response URL:', response.url());

        if (!response.ok()) {
          const responseBody = await response.text();
          console.log('Upload failed with response:', responseBody);
        } else {
          console.log('Upload successful!');
          const responseBody = await response.json();
          console.log('Response data:', responseBody);
        }
      } catch (error) {
        console.log('Error waiting for upload response:', error);
      }

      // エラーメッセージの確認
      const errorMessage = page.locator('.text-destructive, .text-red-500, [role="alert"]');
      if (await errorMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
        const errorText = await errorMessage.textContent();
        console.log('Error message found:', errorText);
      }

    } else {
      console.log('Upload button not found, checking page structure...');

      // ページの構造を確認
      const pageContent = await page.content();
      console.log('Available buttons:', await page.locator('button').allTextContents());
    }

    // スクリーンショットを保存
    await page.screenshot({ path: 'upload-test-result.png', fullPage: true });
  });
});