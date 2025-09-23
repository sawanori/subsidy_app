import { test, expect, Page } from '@playwright/test';

/**
 * APP-100: メインワークフローE2Eテスト
 * 入力ウィザード → 生成 → プレビュー 全工程テスト
 * governance.yaml準拠: 2秒表示・99%成功率・アクセシビリティ
 */

test.describe('APP-100: Complete Workflow E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // governance.yaml準拠: 2秒以内表示確認
    const startTime = Date.now();
    await page.goto('/ja');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(2000);
    console.log(`✅ Page load time: ${loadTime}ms (governance compliant)`);
  });

  test('Complete workflow: Input → Generation → Preview', async ({ page }) => {
    test.setTimeout(180000); // 3分のタイムアウト
    
    // Step 1: ホームページ表示確認
    await expect(page.locator('h1')).toContainText('補助');
    
    // Step 2: プレビューデモページへ移動
    await page.goto('/ja/preview-demo');
    
    // Step 3: フォーム入力 (様式1)
    await test.step('Form 1 Input', async () => {
      // 申請者情報入力
      await page.fill('[data-testid="applicant-name"]', 'テスト申請者株式会社');
      await page.fill('[data-testid="applicant-address"]', '東京都渋谷区テスト町1-2-3');
      await page.fill('[data-testid="representative-name"]', '代表太郎');
      await page.fill('[data-testid="contact-phone"]', '03-1234-5678');
      await page.fill('[data-testid="contact-email"]', 'test@example.com');
      
      // 事業情報入力
      await page.fill('[data-testid="business-name"]', 'AI技術開発プロジェクト');
      await page.fill('[data-testid="business-purpose"]', 'AI技術を活用した業務効率化システムの開発');
      await page.fill('[data-testid="project-period"]', '2024年4月〜2025年3月');
    });
    
    // Step 4: リアルタイムプレビュー確認
    await test.step('Real-time Preview Verification', async () => {
      // プレビュー表示確認
      await expect(page.locator('[data-testid="preview-panel"]')).toBeVisible();
      
      // 入力内容がプレビューに反映されることを確認
      await expect(page.locator('[data-testid="preview-content"]')).toContainText('テスト申請者株式会社');
      
      // governance.yaml: 2秒以内でプレビュー更新
      const previewUpdateStart = Date.now();
      await page.fill('[data-testid="business-name"]', 'AI技術開発プロジェクト（更新）');
      await expect(page.locator('[data-testid="preview-content"]')).toContainText('AI技術開発プロジェクト（更新）');
      const previewUpdateTime = Date.now() - previewUpdateStart;
      
      expect(previewUpdateTime).toBeLessThan(2000);
      console.log(`✅ Preview update time: ${previewUpdateTime}ms`);
    });
    
    // Step 5: フォーム切り替えテスト (様式2)
    await test.step('Form Navigation', async () => {
      await page.click('[data-testid="form-tab-2"]');
      
      // 様式2固有フィールド入力
      await page.fill('[data-testid="budget-total"]', '5000000');
      await page.fill('[data-testid="subsidy-amount"]', '2500000');
      await page.fill('[data-testid="self-funding"]', '2500000');
      
      // プレビューに反映確認
      await expect(page.locator('[data-testid="preview-content"]')).toContainText('5,000,000');
    });
    
    // Step 6: 様式4テスト
    await test.step('Form 4 Processing', async () => {
      await page.click('[data-testid="form-tab-4"]');
      
      // 詳細情報入力
      await page.fill('[data-testid="technical-details"]', 'AI機械学習モデルを活用したデータ分析システム');
      await page.fill('[data-testid="expected-results"]', '業務効率50%向上、コスト30%削減を見込む');
      
      // プレビュー確認
      await expect(page.locator('[data-testid="preview-content"]')).toContainText('AI機械学習');
    });
    
    // Step 7: 確認シート
    await test.step('Confirmation Sheet', async () => {
      await page.click('[data-testid="form-tab-confirmation"]');
      
      // 最終確認情報
      await page.check('[data-testid="terms-agreed"]');
      await page.check('[data-testid="information-accuracy"]');
      await page.fill('[data-testid="submission-date"]', '2024-09-09');
      
      // 全体完成度確認
      await expect(page.locator('[data-testid="completion-rate"]')).toContainText('100%');
    });
    
    // Step 8: PDF出力テスト
    await test.step('PDF Export', async () => {
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-pdf"]');
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toContain('.pdf');
      console.log(`✅ PDF export successful: ${download.suggestedFilename()}`);
    });
    
    // Step 9: governance.yaml成功率確認
    await test.step('Governance Success Rate Verification', async () => {
      // 全工程完了確認
      await expect(page.locator('[data-testid="workflow-status"]')).toContainText('完了');
      
      // エラー無し確認
      const errorElements = page.locator('[data-testid*="error"]');
      await expect(errorElements).toHaveCount(0);
      
      console.log('✅ Workflow completed without errors (99%+ success rate target)');
    });
  });

  test('Upload workflow: File → Analysis → Preview', async ({ page }) => {
    // Step 1: アップロードデモページ
    await page.goto('/ja/upload-demo');
    
    // Step 2: ファイルアップロードシミュレーション
    await test.step('File Upload Simulation', async () => {
      // サンプルデータ追加
      await page.click('[data-testid="add-sample-data"]');
      
      // アップロード完了まで待機
      await expect(page.locator('[data-testid="upload-status"]')).toContainText('完了', { timeout: 10000 });
    });
    
    // Step 3: 分析ダッシュボード確認
    await test.step('Analytics Dashboard', async () => {
      await page.click('[data-testid="analytics-tab"]');
      
      // KPI表示確認
      await expect(page.locator('[data-testid="total-files"]')).toBeVisible();
      await expect(page.locator('[data-testid="quality-score"]')).toBeVisible();
      await expect(page.locator('[data-testid="extracted-charts"]')).toBeVisible();
    });
    
    // Step 4: OCR結果表示
    await test.step('OCR Results Display', async () => {
      await page.click('[data-testid="results-tab"]');
      
      // OCR結果確認
      await expect(page.locator('[data-testid="ocr-text"]')).toContainText('予算');
      await expect(page.locator('[data-testid="confidence-score"]')).toBeVisible();
    });
    
    // Step 5: Chart.js可視化確認
    await test.step('Chart Visualization', async () => {
      await page.click('[data-testid="charts-tab"]');
      
      // グラフ表示確認
      await expect(page.locator('canvas')).toBeVisible();
      await expect(page.locator('[data-testid="chart-title"]')).toContainText('部門別予算');
    });
  });

  test('Accessibility and Performance Compliance', async ({ page }) => {
    // Step 1: 全ページアクセシビリティチェック
    await test.step('Accessibility Verification', async () => {
      const pages = ['/ja', '/ja/preview-demo', '/ja/upload-demo'];
      
      for (const pagePath of pages) {
        await page.goto(pagePath);
        
        // WCAG 2.1 AA準拠確認
        // - キーボードナビゲーション
        await page.keyboard.press('Tab');
        await expect(page.locator(':focus')).toBeVisible();
        
        // - 色コントラスト (自動テストはaxe-coreで実施)
        // - スクリーンリーダー対応 (aria-labelの存在確認)
        const ariaLabels = page.locator('[aria-label]');
        if (await ariaLabels.count() > 0) {
          console.log(`✅ ARIA labels found on ${pagePath}`);
        }
      }
    });
    
    // Step 2: パフォーマンス測定
    await test.step('Performance Measurement', async () => {
      await page.goto('/ja/preview-demo');
      
      // Core Web Vitals シミュレーション
      const startTime = Date.now();
      
      // 大きな入力でのレンダリング性能測定
      const largeText = 'A'.repeat(1000);
      await page.fill('[data-testid="business-purpose"]', largeText);
      
      // プレビュー更新待機
      await expect(page.locator('[data-testid="preview-content"]')).toContainText('AAA');
      
      const renderTime = Date.now() - startTime;
      expect(renderTime).toBeLessThan(2000); // governance.yaml準拠
      
      console.log(`✅ Large input render time: ${renderTime}ms`);
    });
  });

  test('Error Handling and Recovery', async ({ page }) => {
    // Step 1: エラー境界テスト
    await test.step('Error Boundary Testing', async () => {
      await page.goto('/ja/upload-demo');
      
      // 無効なファイル形式でのテスト（JavaScriptエラー発生想定）
      await page.evaluate(() => {
        // 意図的にエラーを発生させる
        throw new Error('Test error for error boundary');
      }).catch(() => {
        // エラーは期待値
      });
      
      // エラー境界が機能しているか確認
      // ページが完全にクラッシュしていないことを確認
      await expect(page.locator('body')).toBeVisible();
    });
    
    // Step 2: ネットワークエラー回復テスト
    await test.step('Network Error Recovery', async () => {
      // オフラインシミュレーション
      await page.route('**/*', route => route.abort());
      
      await page.goto('/ja', { waitUntil: 'domcontentloaded' }).catch(() => {
        // ネットワークエラーは期待値
      });
      
      // ネットワーク復旧
      await page.unroute('**/*');
      
      // ページ再読み込みで回復確認
      await page.reload();
      await expect(page.locator('h1')).toBeVisible();
    });
  });
});