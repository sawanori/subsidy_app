import { test, expect } from '@playwright/test';

test.describe('申請重複チェック', () => {
  test('申請一覧を確認して重複がないか検証', async ({ page }) => {
    // 1. トップページにアクセス
    await page.goto('http://localhost:3000');

    // ページが読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // スクリーンショット取得（初期状態）
    await page.screenshot({ path: 'frontend/screenshots/home-page.png', fullPage: true });

    // 2. 申請一覧ページへ移動を試みる
    // まず「申請一覧」リンクがあるか確認
    const applicationsLink = page.getByRole('link', { name: /申請一覧|Applications|申請管理/i });
    const dashboardLink = page.getByRole('link', { name: /ダッシュボード|Dashboard/i });

    if (await applicationsLink.count() > 0) {
      await applicationsLink.click();
      await page.waitForLoadState('networkidle');
    } else if (await dashboardLink.count() > 0) {
      await dashboardLink.click();
      await page.waitForLoadState('networkidle');
    } else {
      // 直接URLでアクセス
      await page.goto('http://localhost:3000/applications');
      await page.waitForLoadState('networkidle');
    }

    // スクリーンショット取得（申請一覧）
    await page.screenshot({ path: 'frontend/screenshots/applications-list.png', fullPage: true });

    // 3. 申請データの重複チェック
    // テーブルまたはカード形式の申請項目を取得
    const applicationItems = await page.locator('[data-testid="application-item"], .application-card, tr[role="row"]').all();

    if (applicationItems.length > 0) {
      console.log(`Found ${applicationItems.length} applications`);

      const applicationData: { title?: string, status?: string, date?: string }[] = [];

      for (const item of applicationItems) {
        const title = await item.locator('h3, .title, td:nth-child(1)').textContent().catch(() => null);
        const status = await item.locator('.status, .badge, td:nth-child(2)').textContent().catch(() => null);
        const date = await item.locator('.date, time, td:nth-child(3)').textContent().catch(() => null);

        if (title) {
          applicationData.push({ title, status, date });
        }
      }

      // 重複チェック
      const titles = applicationData.map(app => app.title).filter(Boolean);
      const uniqueTitles = [...new Set(titles)];

      console.log('All applications:', applicationData);
      console.log('Unique titles:', uniqueTitles);

      // 重複があるか検証
      expect(titles.length).toBe(uniqueTitles.length);

      if (titles.length !== uniqueTitles.length) {
        console.error('重複が見つかりました！');
        const duplicates = titles.filter((title, index) => titles.indexOf(title) !== index);
        console.error('重複している申請:', duplicates);
      } else {
        console.log('重複は見つかりませんでした');
      }
    } else {
      console.log('申請データが見つかりません（空の状態）');
    }

    // 4. 新規申請ボタンの確認
    const newApplicationButton = page.getByRole('button', { name: /新規申請|New Application|申請作成/i });
    if (await newApplicationButton.count() > 0) {
      await newApplicationButton.click();
      await page.waitForLoadState('networkidle');

      // 新規申請画面のスクリーンショット
      await page.screenshot({ path: 'frontend/screenshots/new-application.png', fullPage: true });

      // フォームの内容を確認
      const formFields = await page.locator('input, textarea, select').all();
      console.log(`Form has ${formFields.length} fields`);
    }

    // 5. データベース直接確認（APIエンドポイント経由）
    try {
      const response = await page.request.get('http://localhost:3002/applications');
      if (response.ok()) {
        const applications = await response.json();
        console.log('API response - Total applications:', applications.length);

        // API経由でも重複チェック
        const apiTitles = applications.map((app: { title: string }) => app.title);
        const uniqueApiTitles = [...new Set(apiTitles)];

        expect(apiTitles.length).toBe(uniqueApiTitles.length);
        console.log('API check - No duplicates found');
      }
    } catch (error) {
      console.log('API endpoint not available or error:', error);
    }
  });

  test('申請の詳細情報を確認', async ({ page }) => {
    await page.goto('http://localhost:3000/applications');
    await page.waitForLoadState('networkidle');

    // 最初の申請項目をクリック（存在する場合）
    const firstApplication = page.locator('[data-testid="application-item"], .application-card, tr[role="row"]').first();

    if (await firstApplication.count() > 0) {
      await firstApplication.click();
      await page.waitForLoadState('networkidle');

      // 詳細画面のスクリーンショット
      await page.screenshot({ path: 'frontend/screenshots/application-detail.png', fullPage: true });

      // 詳細情報の取得
      const detailInfo = {
        title: await page.locator('h1, h2, .title').first().textContent().catch(() => null),
        status: await page.locator('.status, .badge').first().textContent().catch(() => null),
        applicant: await page.locator('.applicant, [data-field="applicant"]').textContent().catch(() => null),
        budget: await page.locator('.budget, [data-field="budget"]').textContent().catch(() => null),
      };

      console.log('Application details:', detailInfo);
    }
  });
});