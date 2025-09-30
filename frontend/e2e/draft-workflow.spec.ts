import { test, expect } from '@playwright/test';

/**
 * Draft Workflow E2E Tests
 *
 * Phase 6 Day 3: フロントエンド統合テスト
 * - Draft作成 → 検証 → PDF生成の完全フロー
 * - ApplicationWizardの全ステップ検証
 * - バリデーションフィードバック確認
 */

test.describe('Draft to PDF Complete Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // テスト環境の初期化
    await page.goto('/');
  });

  test('should complete full draft creation and PDF generation flow', async ({ page }) => {
    // Step 1: アプリケーション作成ページへ遷移
    await page.goto('/applications/new');
    await expect(page).toHaveTitle(/補助金申請/);

    // Step 2: 基本情報入力
    await page.fill('[name="title"]', 'E2Eテストプロジェクト');
    await page.fill('[name="goal"]', 'テスト目的の達成');
    await page.click('button:has-text("次へ")');

    // Step 3: 補助金制度選択
    await page.waitForSelector('text=補助金制度を選択');

    // 制度選択（最初の制度を選択）
    const firstScheme = page.locator('[data-testid="scheme-card"]').first();
    await firstScheme.click();
    await page.click('button:has-text("次へ")');

    // Step 4: 制約条件入力
    await page.waitForSelector('text=制約条件');
    await page.fill('[name="budget"]', '5000000');
    await page.fill('[name="duration"]', '12');
    await page.click('button:has-text("次へ")');

    // Step 5: 市場調査（オプショナル）
    await page.waitForSelector('text=市場調査');
    await page.click('button:has-text("スキップ")');

    // Step 6: 既存資産（オプショナル）
    await page.waitForSelector('text=既存資産');
    await page.click('button:has-text("完了")');

    // Step 7: プロジェクト作成確認
    await page.waitForSelector('text=プロジェクトが作成されました', { timeout: 10000 });

    // 作成されたプロジェクトIDを取得
    const url = page.url();
    const projectId = url.split('/').pop();
    expect(projectId).toBeTruthy();

    // Step 8: Draft生成開始
    await page.click('button:has-text("草案生成")');
    await page.waitForSelector('text=生成中', { timeout: 5000 });

    // 生成完了を待機（最大60秒）
    await page.waitForSelector('text=生成完了', { timeout: 60000 });

    // Step 9: Draft内容確認
    await page.waitForSelector('[data-testid="draft-content"]', { timeout: 5000 });

    const draftContent = await page.textContent('[data-testid="draft-content"]');
    expect(draftContent).toBeTruthy();
    expect(draftContent!.length).toBeGreaterThan(100);

    // Step 10: 検証実行
    await page.click('button:has-text("検証実行")');
    await page.waitForSelector('text=検証中', { timeout: 5000 });

    // 検証完了を待機（最大30秒）
    await page.waitForSelector('[data-testid="validation-result"]', { timeout: 30000 });

    // 検証結果確認
    const validationStatus = await page.locator('[data-testid="validation-status"]').textContent();
    expect(validationStatus).toContain('検証');

    // Step 11: PDF生成・ダウンロード
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 60000 }),
      page.click('button:has-text("完全版PDF")')
    ]);

    // ダウンロードファイル確認
    expect(download.suggestedFilename()).toMatch(/application.*\.pdf/);

    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
  });

  test('should handle validation errors correctly', async ({ page }) => {
    // Step 1: 不完全なプロジェクト作成
    await page.goto('/applications/new');

    await page.fill('[name="title"]', 'バリデーションエラーテスト');
    // goalを空にしてエラーを発生させる
    await page.click('button:has-text("次へ")');

    // Step 2: エラーメッセージ確認
    await page.waitForSelector('text=必須項目です', { timeout: 5000 });

    const errorMessage = await page.locator('[role="alert"]').textContent();
    expect(errorMessage).toContain('必須');
  });

  test('should allow draft editing and re-validation', async ({ page }) => {
    // 既存のプロジェクトに遷移（仮のIDを使用）
    // 実際の実装では、事前にテストデータを準備する
    await page.goto('/applications/test-project-id/draft');

    // Draft編集
    await page.click('button:has-text("編集")');

    const editor = page.locator('[data-testid="draft-editor"]');
    await editor.click();
    await editor.fill('編集されたコンテンツ');

    // 保存
    await page.click('button:has-text("保存")');
    await page.waitForSelector('text=保存しました', { timeout: 5000 });

    // 再検証
    await page.click('button:has-text("再検証")');
    await page.waitForSelector('[data-testid="validation-result"]', { timeout: 30000 });

    const result = await page.locator('[data-testid="validation-status"]').textContent();
    expect(result).toBeTruthy();
  });
});

test.describe('ApplicationWizard Step Navigation', () => {
  test('should navigate forward and backward through steps', async ({ page }) => {
    await page.goto('/applications/new');

    // Step 1: 基本情報
    await page.fill('[name="title"]', 'ステップナビゲーションテスト');
    await page.fill('[name="goal"]', 'ナビゲーションテスト');
    await page.click('button:has-text("次へ")');

    // Step 2: 補助金制度選択
    await page.waitForSelector('text=補助金制度を選択');

    // 戻るボタン
    await page.click('button:has-text("戻る")');
    await page.waitForSelector('[name="title"]');

    // 入力値が保持されているか確認
    const titleValue = await page.inputValue('[name="title"]');
    expect(titleValue).toBe('ステップナビゲーションテスト');

    // 再度次へ
    await page.click('button:has-text("次へ")');
    await page.waitForSelector('text=補助金制度を選択');
  });

  test('should show progress indicator', async ({ page }) => {
    await page.goto('/applications/new');

    // プログレスインジケーター確認
    const progressBar = page.locator('[role="progressbar"]');
    await expect(progressBar).toBeVisible();

    // 初期状態（Step 1）
    const initialProgress = await progressBar.getAttribute('aria-valuenow');
    expect(Number(initialProgress)).toBeGreaterThanOrEqual(0);

    // 次のステップへ
    await page.fill('[name="title"]', 'プログレステスト');
    await page.fill('[name="goal"]', 'プログレス確認');
    await page.click('button:has-text("次へ")');

    // プログレスが増加したか確認
    const nextProgress = await progressBar.getAttribute('aria-valuenow');
    expect(Number(nextProgress)).toBeGreaterThan(Number(initialProgress));
  });
});

test.describe('Draft Content Validation', () => {
  test('should display validation warnings for incomplete sections', async ({ page }) => {
    // 最小限のデータでDraft生成
    await page.goto('/applications/new');

    await page.fill('[name="title"]', '不完全なプロジェクト');
    await page.fill('[name="goal"]', '最小限のデータ');
    await page.click('button:has-text("次へ")');

    // 制度選択（スキップ可能な項目は全てスキップ）
    const firstScheme = page.locator('[data-testid="scheme-card"]').first();
    await firstScheme.click();
    await page.click('button:has-text("次へ")');

    // 全てスキップ
    await page.click('button:has-text("スキップ")');
    await page.click('button:has-text("スキップ")');
    await page.click('button:has-text("完了")');

    // Draft生成
    await page.click('button:has-text("草案生成")');
    await page.waitForSelector('text=生成完了', { timeout: 60000 });

    // 検証実行
    await page.click('button:has-text("検証実行")');
    await page.waitForSelector('[data-testid="validation-result"]', { timeout: 30000 });

    // 警告表示確認
    const warnings = page.locator('[data-testid="validation-warning"]');
    const warningCount = await warnings.count();
    expect(warningCount).toBeGreaterThan(0);

    // 警告メッセージ確認
    const firstWarning = await warnings.first().textContent();
    expect(firstWarning).toBeTruthy();
  });

  test('should show validation statistics', async ({ page }) => {
    // 検証結果画面に遷移（テストデータ使用）
    await page.goto('/applications/test-project-id/validation');

    // 統計情報表示確認
    await page.waitForSelector('[data-testid="validation-stats"]', { timeout: 5000 });

    const stats = page.locator('[data-testid="validation-stats"]');
    await expect(stats).toBeVisible();

    // エラー数、警告数、文字数などの表示確認
    const errorCount = await page.locator('[data-testid="error-count"]').textContent();
    const warningCount = await page.locator('[data-testid="warning-count"]').textContent();

    expect(errorCount).toMatch(/\d+/);
    expect(warningCount).toMatch(/\d+/);
  });
});

test.describe('PDF Generation Options', () => {
  test('should generate summary PDF successfully', async ({ page }) => {
    // 検証完了済みDraftに遷移
    await page.goto('/applications/test-project-id/pdf');

    // サマリーPDF生成
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30000 }),
      page.click('button:has-text("サマリーPDF")')
    ]);

    expect(download.suggestedFilename()).toMatch(/summary.*\.pdf/);
  });

  test('should preview PDF before download', async ({ page }) => {
    await page.goto('/applications/test-project-id/pdf');

    // プレビューボタン
    await page.click('button:has-text("プレビュー")');

    // PDFプレビュー表示確認
    await page.waitForSelector('[data-testid="pdf-preview"]', { timeout: 10000 });

    const preview = page.locator('[data-testid="pdf-preview"]');
    await expect(preview).toBeVisible();

    // ページネーション確認
    const nextPageButton = page.locator('button:has-text("次のページ")');
    await expect(nextPageButton).toBeVisible();
  });

  test('should handle PDF generation errors gracefully', async ({ page }) => {
    // 無効なDraftIDでPDF生成を試みる
    await page.goto('/applications/invalid-id/pdf');

    await page.click('button:has-text("完全版PDF")');

    // エラーメッセージ表示確認
    await page.waitForSelector('[role="alert"]', { timeout: 5000 });

    const errorMessage = await page.locator('[role="alert"]').textContent();
    expect(errorMessage).toContain('エラー');
  });
});

test.describe('Performance Tests', () => {
  test('should load application wizard within 2 seconds', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/applications/new');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // governance.yaml: 2秒以内表示
    expect(loadTime).toBeLessThan(2000);
  });

  test('should generate draft within acceptable time', async ({ page }) => {
    // 最小限のプロジェクト作成後、Draft生成時間を計測
    await page.goto('/applications/test-project-id/draft');

    const startTime = Date.now();

    await page.click('button:has-text("草案生成")');
    await page.waitForSelector('text=生成完了', { timeout: 60000 });

    const generationTime = Date.now() - startTime;

    // 60秒以内にDraft生成完了
    expect(generationTime).toBeLessThan(60000);
  });

  test('should validate draft within 30 seconds', async ({ page }) => {
    await page.goto('/applications/test-project-id/draft');

    const startTime = Date.now();

    await page.click('button:has-text("検証実行")');
    await page.waitForSelector('[data-testid="validation-result"]', { timeout: 30000 });

    const validationTime = Date.now() - startTime;

    // 30秒以内に検証完了
    expect(validationTime).toBeLessThan(30000);
  });
});