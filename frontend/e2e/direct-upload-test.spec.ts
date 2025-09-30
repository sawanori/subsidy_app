import { test, Page } from '@playwright/test';
import * as path from 'path';

test.describe('Direct File Upload Test', () => {
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

    // ネットワークリクエストを監視
    page.on('request', request => {
      if (request.url().includes('upload')) {
        console.log('Upload request:', request.method(), request.url());
      }
    });

    page.on('response', response => {
      if (response.url().includes('upload')) {
        console.log('Upload response:', response.status(), response.url());
      }
    });

    // ネットワークエラーを監視
    page.on('requestfailed', request => {
      console.log('Request failed:', request.url(), request.failure()?.errorText);
    });
  });

  test('should directly test file upload via API', async () => {
    // 1. 直接申請作成ページへ遷移（ログインをスキップしてテスト）
    console.log('Navigating to application new page...');
    await page.goto('http://localhost:3000/ja/applications/new');
    await page.waitForLoadState('networkidle');

    // ページのHTMLを確認
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);

    // ページコンテンツを確認して、どのようなUIが表示されているか確認
    const content = await page.content();

    // ファイルアップロードのボタンやフォームを探す
    const hasUploadButton = content.includes('確定申告書') || content.includes('アップロード') || content.includes('ファイル');
    console.log('Has upload-related content:', hasUploadButton);

    if (!hasUploadButton) {
      // 現在のページの状態を確認
      console.log('Current URL:', page.url());

      // ログインが必要な場合はログイン画面が表示される
      if (page.url().includes('/login')) {
        console.log('Redirected to login page. Need to login first.');

        // 既存のテストユーザーでログイン
        await page.fill('input[placeholder*="example@company.com"]', 'test@example.com');
        await page.fill('input[type="password"]', 'Test1234!');
        await page.click('button:has-text("ログイン")');

        // ログイン処理を待つ
        await page.waitForTimeout(2000);

        // 再度申請作成ページへ
        await page.goto('http://localhost:3000/ja/applications/new');
        await page.waitForLoadState('networkidle');
      }
    }

    // スクリーンショットを保存して現在の状態を確認
    await page.screenshot({ path: 'direct-upload-test-current.png', fullPage: true });

    // 2. APIを直接テストする
    console.log('\nTesting API directly...');
    const filePath = path.resolve('/Users/noritakasawada/AI_P/subsidyApp/R5.pdf');

    // FormDataを作成
    const formData = new FormData();
    const fileBuffer = await page.evaluateHandle(() => {
      return fetch('/Users/noritakasawada/AI_P/subsidyApp/R5.pdf')
        .then(res => res.blob())
        .catch(() => null);
    });

    // curlコマンドで直接APIをテスト
    const curlResponse = await page.evaluate(async () => {
      try {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);

        // ファイルを設定してAPIに送信
        const response = await fetch('/api/intake/upload', {
          method: 'POST',
          body: new FormData(),
        });

        return {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          url: response.url
        };
      } catch (error) {
        return { error: error.message };
      }
    });

    console.log('Direct API test result:', curlResponse);
  });

  test('should test upload via UI if available', async () => {
    // アプリケーションのトップページから開始
    await page.goto('http://localhost:3000/ja');
    await page.waitForLoadState('networkidle');

    // スクリーンショットで現在の状態を記録
    await page.screenshot({ path: 'ui-test-home.png', fullPage: true });

    // ボタンやリンクを探す
    const buttons = await page.locator('button').allTextContents();
    const links = await page.locator('a').allTextContents();

    console.log('Available buttons:', buttons);
    console.log('Available links:', links);

    // 申請関連のリンクを探してクリック
    const applicationLink = page.locator('a:has-text("申請"), a:has-text("新規"), a:has-text("作成")').first();
    if (await applicationLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await applicationLink.click();
      await page.waitForLoadState('networkidle');

      // 新しいページの状態を記録
      await page.screenshot({ path: 'ui-test-after-click.png', fullPage: true });
    }
  });
});