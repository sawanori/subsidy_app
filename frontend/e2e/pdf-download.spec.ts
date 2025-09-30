import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs/promises';

/**
 * PDF Download E2E Tests
 *
 * Phase 6 Day 3: PDFダウンロード機能テスト
 * - 完全版PDF/サマリーPDF/図表ZIP
 * - ダウンロード動作確認
 * - ファイル形式・サイズ検証
 */

test.describe('PDF Download Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // 検証済みDraft（PDF生成可能な状態）に遷移
    await page.goto('/applications/test-project-id/pdf');
  });

  test('should download full application PDF', async ({ page }) => {
    // 完全版PDFダウンロード
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 60000 }),
      page.click('button[data-testid="download-full-pdf"]')
    ]);

    // ダウンロードファイル名確認
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/application_.*\.pdf$/);

    // ファイルパス取得
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();

    // ファイルサイズ確認（最低100KB以上）
    const stats = await fs.stat(downloadPath!);
    expect(stats.size).toBeGreaterThan(100 * 1024);
  });

  test('should download summary PDF', async ({ page }) => {
    // サマリーPDFダウンロード
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30000 }),
      page.click('button[data-testid="download-summary-pdf"]')
    ]);

    const filename = download.suggestedFilename();
    expect(filename).toMatch(/summary_.*\.pdf$/);

    // サマリーPDFは完全版より小さいはず
    const downloadPath = await download.path();
    const stats = await fs.stat(downloadPath!);
    expect(stats.size).toBeGreaterThan(10 * 1024); // 最低10KB
    expect(stats.size).toBeLessThan(1024 * 1024); // 最大1MB
  });

  test('should download charts as ZIP', async ({ page }) => {
    // 図表ZIPダウンロード
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30000 }),
      page.click('button[data-testid="download-charts-zip"]')
    ]);

    const filename = download.suggestedFilename();
    expect(filename).toMatch(/charts_.*\.zip$/);

    const downloadPath = await download.path();
    const stats = await fs.stat(downloadPath!);
    expect(stats.size).toBeGreaterThan(1024); // 最低1KB
  });

  test('should show download progress indicator', async ({ page }) => {
    // ダウンロード開始
    const downloadPromise = page.waitForEvent('download');
    await page.click('button[data-testid="download-full-pdf"]');

    // プログレスインジケーター表示確認
    const progressIndicator = page.locator('[data-testid="download-progress"]');
    await expect(progressIndicator).toBeVisible({ timeout: 2000 });

    // ダウンロード完了を待つ
    await downloadPromise;

    // プログレスインジケーター非表示確認
    await expect(progressIndicator).toBeHidden({ timeout: 5000 });
  });

  test('should handle download errors gracefully', async ({ page }) => {
    // 無効なDraftでPDFダウンロードを試みる
    await page.goto('/applications/invalid-draft-id/pdf');

    await page.click('button[data-testid="download-full-pdf"]');

    // エラートースト表示確認
    await page.waitForSelector('[role="alert"]', { timeout: 5000 });

    const errorMessage = await page.locator('[role="alert"]').textContent();
    expect(errorMessage).toContain('ダウンロードに失敗');
  });
});

test.describe('PDF Preview Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/applications/test-project-id/pdf');
  });

  test('should display PDF preview', async ({ page }) => {
    // プレビューボタンクリック
    await page.click('button[data-testid="preview-pdf"]');

    // PDFプレビュー表示確認
    await page.waitForSelector('[data-testid="pdf-preview-viewer"]', { timeout: 10000 });

    const previewViewer = page.locator('[data-testid="pdf-preview-viewer"]');
    await expect(previewViewer).toBeVisible();

    // PDFキャンバス表示確認
    const pdfCanvas = page.locator('canvas[data-pdf-canvas]');
    await expect(pdfCanvas).toBeVisible();
  });

  test('should navigate between PDF pages', async ({ page }) => {
    await page.click('button[data-testid="preview-pdf"]');
    await page.waitForSelector('[data-testid="pdf-preview-viewer"]', { timeout: 10000 });

    // ページ情報確認
    const pageInfo = page.locator('[data-testid="pdf-page-info"]');
    await expect(pageInfo).toContainText(/1\s*\/\s*\d+/);

    // 次のページボタン
    const nextButton = page.locator('button[data-testid="pdf-next-page"]');
    if (await nextButton.isEnabled()) {
      await nextButton.click();

      // ページ番号が2に変わったか確認
      await expect(pageInfo).toContainText(/2\s*\/\s*\d+/);

      // 前のページボタン
      const prevButton = page.locator('button[data-testid="pdf-prev-page"]');
      await prevButton.click();

      // ページ番号が1に戻ったか確認
      await expect(pageInfo).toContainText(/1\s*\/\s*\d+/);
    }
  });

  test('should zoom in and out PDF preview', async ({ page }) => {
    await page.click('button[data-testid="preview-pdf"]');
    await page.waitForSelector('[data-testid="pdf-preview-viewer"]', { timeout: 10000 });

    // ズームイン
    const zoomInButton = page.locator('button[data-testid="pdf-zoom-in"]');
    await zoomInButton.click();

    // ズームレベル確認
    const zoomLevel = page.locator('[data-testid="pdf-zoom-level"]');
    const zoomText = await zoomLevel.textContent();
    expect(zoomText).toMatch(/\d+%/);

    // ズームアウト
    const zoomOutButton = page.locator('button[data-testid="pdf-zoom-out"]');
    await zoomOutButton.click();
  });

  test('should close PDF preview', async ({ page }) => {
    await page.click('button[data-testid="preview-pdf"]');
    await page.waitForSelector('[data-testid="pdf-preview-viewer"]', { timeout: 10000 });

    // 閉じるボタン
    await page.click('button[data-testid="close-preview"]');

    // プレビューが非表示になったか確認
    const previewViewer = page.locator('[data-testid="pdf-preview-viewer"]');
    await expect(previewViewer).toBeHidden();
  });
});

test.describe('PDF Download Panel UI', () => {
  test('should display all download options', async ({ page }) => {
    await page.goto('/applications/test-project-id/pdf');

    // 全ダウンロードオプション表示確認
    await expect(page.locator('button[data-testid="download-full-pdf"]')).toBeVisible();
    await expect(page.locator('button[data-testid="download-summary-pdf"]')).toBeVisible();
    await expect(page.locator('button[data-testid="download-charts-zip"]')).toBeVisible();
    await expect(page.locator('button[data-testid="preview-pdf"]')).toBeVisible();
  });

  test('should show file size estimations', async ({ page }) => {
    await page.goto('/applications/test-project-id/pdf');

    // ファイルサイズ表示確認
    const fullPdfSize = page.locator('[data-testid="full-pdf-size"]');
    await expect(fullPdfSize).toBeVisible();
    await expect(fullPdfSize).toContainText(/MB|KB/);

    const summaryPdfSize = page.locator('[data-testid="summary-pdf-size"]');
    await expect(summaryPdfSize).toBeVisible();
    await expect(summaryPdfSize).toContainText(/MB|KB/);
  });

  test('should show generation timestamp', async ({ page }) => {
    await page.goto('/applications/test-project-id/pdf');

    // 生成日時表示確認
    const timestamp = page.locator('[data-testid="pdf-generation-time"]');
    await expect(timestamp).toBeVisible();

    const timestampText = await timestamp.textContent();
    expect(timestampText).toMatch(/\d{4}[-/]\d{2}[-/]\d{2}/); // 日付形式
  });

  test('should disable download buttons during generation', async ({ page }) => {
    await page.goto('/applications/test-project-id/pdf');

    // ダウンロード開始
    const downloadButton = page.locator('button[data-testid="download-full-pdf"]');
    await downloadButton.click();

    // ボタンが一時的に無効化されるか確認
    await expect(downloadButton).toBeDisabled({ timeout: 2000 });

    // ダウンロード完了後に再度有効化
    await page.waitForEvent('download', { timeout: 60000 });
    await expect(downloadButton).toBeEnabled({ timeout: 5000 });
  });
});

test.describe('Charts Preview', () => {
  test('should preview Gantt chart', async ({ page }) => {
    await page.goto('/applications/test-project-id/pdf');

    // 図表タブ選択
    await page.click('button[data-testid="tab-charts"]');

    // Ganttチャート表示確認
    const ganttChart = page.locator('[data-testid="gantt-chart"]');
    await expect(ganttChart).toBeVisible({ timeout: 5000 });

    // 画像が読み込まれたか確認
    await expect(ganttChart.locator('img, canvas')).toBeVisible();
  });

  test('should preview KPI chart', async ({ page }) => {
    await page.goto('/applications/test-project-id/pdf');

    await page.click('button[data-testid="tab-charts"]');

    // KPIチャート表示確認
    const kpiChart = page.locator('[data-testid="kpi-chart"]');
    await expect(kpiChart).toBeVisible({ timeout: 5000 });

    await expect(kpiChart.locator('img, canvas')).toBeVisible();
  });

  test('should preview organization chart', async ({ page }) => {
    await page.goto('/applications/test-project-id/pdf');

    await page.click('button[data-testid="tab-charts"]');

    // 組織図表示確認
    const orgChart = page.locator('[data-testid="org-chart"]');
    await expect(orgChart).toBeVisible({ timeout: 5000 });

    await expect(orgChart.locator('img, canvas')).toBeVisible();
  });

  test('should download individual chart as PNG', async ({ page }) => {
    await page.goto('/applications/test-project-id/pdf');

    await page.click('button[data-testid="tab-charts"]');

    // 個別チャートダウンロード
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 10000 }),
      page.click('button[data-testid="download-gantt-chart"]')
    ]);

    const filename = download.suggestedFilename();
    expect(filename).toMatch(/gantt.*\.png$/);
  });
});

test.describe('Batch Download', () => {
  test('should download all PDFs and charts as ZIP', async ({ page }) => {
    await page.goto('/applications/test-project-id/pdf');

    // 一括ダウンロード
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 90000 }),
      page.click('button[data-testid="download-all-zip"]')
    ]);

    const filename = download.suggestedFilename();
    expect(filename).toMatch(/application_package_.*\.zip$/);

    // ZIPサイズ確認（複数ファイル含むため大きいはず）
    const downloadPath = await download.path();
    const stats = await fs.stat(downloadPath!);
    expect(stats.size).toBeGreaterThan(100 * 1024); // 最低100KB
  });

  test('should show batch download progress', async ({ page }) => {
    await page.goto('/applications/test-project-id/pdf');

    // 一括ダウンロード開始
    const downloadPromise = page.waitForEvent('download');
    await page.click('button[data-testid="download-all-zip"]');

    // プログレスバー表示確認
    const progressBar = page.locator('[data-testid="batch-download-progress"]');
    await expect(progressBar).toBeVisible({ timeout: 2000 });

    // 進捗率表示確認
    const progressText = page.locator('[data-testid="batch-progress-text"]');
    await expect(progressText).toContainText(/%/);

    // ダウンロード完了
    await downloadPromise;

    // プログレスバー非表示確認
    await expect(progressBar).toBeHidden({ timeout: 5000 });
  });
});

test.describe('Download History', () => {
  test('should show recent download history', async ({ page }) => {
    await page.goto('/applications/test-project-id/pdf');

    // 履歴タブ選択
    await page.click('button[data-testid="tab-history"]');

    // ダウンロード履歴表示確認
    const historyList = page.locator('[data-testid="download-history-list"]');
    await expect(historyList).toBeVisible();

    // 履歴アイテム確認
    const historyItems = historyList.locator('[data-testid="history-item"]');
    const count = await historyItems.count();

    if (count > 0) {
      const firstItem = historyItems.first();
      await expect(firstItem).toContainText(/PDF|ZIP/);
      await expect(firstItem).toContainText(/\d{4}[-/]\d{2}[-/]\d{2}/);
    }
  });

  test('should allow re-download from history', async ({ page }) => {
    await page.goto('/applications/test-project-id/pdf');

    await page.click('button[data-testid="tab-history"]');

    const historyItems = page.locator('[data-testid="history-item"]');
    const count = await historyItems.count();

    if (count > 0) {
      // 履歴から再ダウンロード
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 60000 }),
        historyItems.first().locator('button[data-testid="redownload"]').click()
      ]);

      expect(download.suggestedFilename()).toMatch(/\.pdf$|\.zip$/);
    }
  });
});