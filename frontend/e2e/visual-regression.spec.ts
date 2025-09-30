import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests
 *
 * Phase 6 Day 3: ビジュアルリグレッションテスト
 * - UI コンポーネントのスクリーンショット比較
 * - レイアウト崩れ検出
 * - スタイル変更の検証
 */

test.describe('Visual Regression - Core Components', () => {
  test('should match ApplicationWizard first step', async ({ page }) => {
    await page.goto('/applications/new');
    await page.waitForLoadState('networkidle');

    // スクリーンショット取得・比較
    await expect(page).toHaveScreenshot('application-wizard-step1.png', {
      fullPage: false,
      maxDiffPixels: 100,
    });
  });

  test('should match ValidationResultDisplay component', async ({ page }) => {
    // 検証結果画面に遷移
    await page.goto('/applications/test-project-id/validation');
    await page.waitForSelector('[data-testid="validation-result"]', { timeout: 5000 });

    // コンポーネント単位でスクリーンショット
    const validationResult = page.locator('[data-testid="validation-result"]');
    await expect(validationResult).toHaveScreenshot('validation-result.png', {
      maxDiffPixels: 100,
    });
  });

  test('should match PdfDownloadPanel component', async ({ page }) => {
    await page.goto('/applications/test-project-id/pdf');
    await page.waitForSelector('[data-testid="pdf-download-panel"]', { timeout: 5000 });

    const downloadPanel = page.locator('[data-testid="pdf-download-panel"]');
    await expect(downloadPanel).toHaveScreenshot('pdf-download-panel.png', {
      maxDiffPixels: 100,
    });
  });

  test('should match ChartPreview components', async ({ page }) => {
    await page.goto('/applications/test-project-id/pdf');
    await page.click('button[data-testid="tab-charts"]');

    // Ganttチャート
    const ganttChart = page.locator('[data-testid="gantt-chart"]');
    await expect(ganttChart).toBeVisible();
    await expect(ganttChart).toHaveScreenshot('gantt-chart-preview.png', {
      maxDiffPixels: 200, // チャートは若干のズレを許容
    });

    // KPIチャート
    const kpiChart = page.locator('[data-testid="kpi-chart"]');
    await expect(kpiChart).toBeVisible();
    await expect(kpiChart).toHaveScreenshot('kpi-chart-preview.png', {
      maxDiffPixels: 200,
    });

    // 組織図
    const orgChart = page.locator('[data-testid="org-chart"]');
    await expect(orgChart).toBeVisible();
    await expect(orgChart).toHaveScreenshot('org-chart-preview.png', {
      maxDiffPixels: 200,
    });
  });
});

test.describe('Visual Regression - Error States', () => {
  test('should match validation error display', async ({ page }) => {
    // バリデーションエラーがある状態
    await page.goto('/applications/error-project-id/validation');
    await page.waitForSelector('[data-testid="validation-errors"]', { timeout: 5000 });

    const errorDisplay = page.locator('[data-testid="validation-errors"]');
    await expect(errorDisplay).toHaveScreenshot('validation-errors.png', {
      maxDiffPixels: 100,
    });
  });

  test('should match warning display', async ({ page }) => {
    await page.goto('/applications/warning-project-id/validation');
    await page.waitForSelector('[data-testid="validation-warnings"]', { timeout: 5000 });

    const warningDisplay = page.locator('[data-testid="validation-warnings"]');
    await expect(warningDisplay).toHaveScreenshot('validation-warnings.png', {
      maxDiffPixels: 100,
    });
  });

  test('should match error toast notification', async ({ page }) => {
    await page.goto('/applications/new');

    // エラーを発生させる
    await page.click('button:has-text("次へ")'); // 必須項目未入力

    // エラートースト表示
    const errorToast = page.locator('[role="alert"]');
    await expect(errorToast).toBeVisible();
    await expect(errorToast).toHaveScreenshot('error-toast.png', {
      maxDiffPixels: 50,
    });
  });
});

test.describe('Visual Regression - Responsive Design', () => {
  test('should match mobile view of ApplicationWizard', async ({ page }) => {
    // モバイルビューポート設定
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/applications/new');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('application-wizard-mobile.png', {
      fullPage: false,
      maxDiffPixels: 150,
    });
  });

  test('should match tablet view of PDF download panel', async ({ page }) => {
    // タブレットビューポート設定
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/applications/test-project-id/pdf');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('pdf-download-panel-tablet.png', {
      fullPage: false,
      maxDiffPixels: 150,
    });
  });

  test('should match mobile navigation menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    // モバイルメニュー開く
    await page.click('[data-testid="mobile-menu-button"]');
    await page.waitForSelector('[data-testid="mobile-menu"]', { timeout: 2000 });

    const mobileMenu = page.locator('[data-testid="mobile-menu"]');
    await expect(mobileMenu).toHaveScreenshot('mobile-menu.png', {
      maxDiffPixels: 100,
    });
  });
});

test.describe('Visual Regression - Interactive States', () => {
  test('should match button hover state', async ({ page }) => {
    await page.goto('/applications/new');

    const nextButton = page.locator('button:has-text("次へ")');

    // ホバー状態
    await nextButton.hover();
    await expect(nextButton).toHaveScreenshot('button-hover-state.png', {
      maxDiffPixels: 50,
    });
  });

  test('should match input focus state', async ({ page }) => {
    await page.goto('/applications/new');

    const titleInput = page.locator('[name="title"]');

    // フォーカス状態
    await titleInput.focus();
    await expect(titleInput).toHaveScreenshot('input-focus-state.png', {
      maxDiffPixels: 50,
    });
  });

  test('should match disabled button state', async ({ page }) => {
    await page.goto('/applications/new');

    // 次へボタン（必須項目未入力で無効化されているはず）
    const nextButton = page.locator('button:has-text("次へ")');

    if (await nextButton.isDisabled()) {
      await expect(nextButton).toHaveScreenshot('button-disabled-state.png', {
        maxDiffPixels: 50,
      });
    }
  });

  test('should match loading spinner', async ({ page }) => {
    await page.goto('/applications/test-project-id/draft');

    // Draft生成開始
    await page.click('button:has-text("草案生成")');

    // ローディングスピナー表示
    const spinner = page.locator('[data-testid="loading-spinner"]');
    await expect(spinner).toBeVisible({ timeout: 2000 });

    await expect(spinner).toHaveScreenshot('loading-spinner.png', {
      maxDiffPixels: 100,
    });
  });
});

test.describe('Visual Regression - Dark Mode', () => {
  test('should match dark mode ApplicationWizard', async ({ page }) => {
    // ダークモード設定
    await page.emulateMedia({ colorScheme: 'dark' });

    await page.goto('/applications/new');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('application-wizard-dark.png', {
      fullPage: false,
      maxDiffPixels: 150,
    });
  });

  test('should match dark mode validation results', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });

    await page.goto('/applications/test-project-id/validation');
    await page.waitForSelector('[data-testid="validation-result"]', { timeout: 5000 });

    const validationResult = page.locator('[data-testid="validation-result"]');
    await expect(validationResult).toHaveScreenshot('validation-result-dark.png', {
      maxDiffPixels: 150,
    });
  });
});

test.describe('Visual Regression - Charts', () => {
  test('should match Gantt chart rendering', async ({ page }) => {
    await page.goto('/applications/test-project-id/pdf');
    await page.click('button[data-testid="tab-charts"]');

    const ganttChart = page.locator('[data-testid="gantt-chart"] canvas, [data-testid="gantt-chart"] img');
    await expect(ganttChart).toBeVisible({ timeout: 10000 });

    // チャート画像のスクリーンショット
    await expect(ganttChart).toHaveScreenshot('gantt-chart-render.png', {
      maxDiffPixels: 300, // チャートは動的なため緩めに設定
    });
  });

  test('should match KPI chart with multiple datasets', async ({ page }) => {
    await page.goto('/applications/test-project-id/pdf');
    await page.click('button[data-testid="tab-charts"]');

    const kpiChart = page.locator('[data-testid="kpi-chart"] canvas, [data-testid="kpi-chart"] img');
    await expect(kpiChart).toBeVisible({ timeout: 10000 });

    await expect(kpiChart).toHaveScreenshot('kpi-chart-multi-dataset.png', {
      maxDiffPixels: 300,
    });
  });

  test('should match organization chart layout', async ({ page }) => {
    await page.goto('/applications/test-project-id/pdf');
    await page.click('button[data-testid="tab-charts"]');

    const orgChart = page.locator('[data-testid="org-chart"] canvas, [data-testid="org-chart"] img');
    await expect(orgChart).toBeVisible({ timeout: 10000 });

    await expect(orgChart).toHaveScreenshot('org-chart-layout.png', {
      maxDiffPixels: 300,
    });
  });
});

test.describe('Visual Regression - Validation Statistics', () => {
  test('should match validation stats panel', async ({ page }) => {
    await page.goto('/applications/test-project-id/validation');
    await page.waitForSelector('[data-testid="validation-stats"]', { timeout: 5000 });

    const statsPanel = page.locator('[data-testid="validation-stats"]');
    await expect(statsPanel).toHaveScreenshot('validation-stats-panel.png', {
      maxDiffPixels: 100,
    });
  });

  test('should match character count display', async ({ page }) => {
    await page.goto('/applications/test-project-id/validation');

    const charCount = page.locator('[data-testid="char-count"]');
    await expect(charCount).toBeVisible();
    await expect(charCount).toHaveScreenshot('char-count-display.png', {
      maxDiffPixels: 50,
    });
  });

  test('should match section progress indicators', async ({ page }) => {
    await page.goto('/applications/test-project-id/validation');

    const sectionProgress = page.locator('[data-testid="section-progress"]');
    await expect(sectionProgress).toBeVisible();
    await expect(sectionProgress).toHaveScreenshot('section-progress-indicators.png', {
      maxDiffPixels: 100,
    });
  });
});

test.describe('Visual Regression - Progress Bars', () => {
  test('should match wizard progress bar at 25%', async ({ page }) => {
    await page.goto('/applications/new');

    // Step 1/4
    const progressBar = page.locator('[role="progressbar"]');
    await expect(progressBar).toBeVisible();
    await expect(progressBar).toHaveScreenshot('progress-bar-25.png', {
      maxDiffPixels: 50,
    });
  });

  test('should match wizard progress bar at 75%', async ({ page }) => {
    await page.goto('/applications/new');

    // Step 3まで進める
    await page.fill('[name="title"]', 'Progress Test');
    await page.fill('[name="goal"]', 'Test Goal');
    await page.click('button:has-text("次へ")');

    await page.click('[data-testid="scheme-card"]');
    await page.click('button:has-text("次へ")');

    await page.fill('[name="budget"]', '5000000');
    await page.click('button:has-text("次へ")');

    // Step 3/4
    const progressBar = page.locator('[role="progressbar"]');
    await expect(progressBar).toHaveScreenshot('progress-bar-75.png', {
      maxDiffPixels: 50,
    });
  });
});

test.describe('Visual Regression - Form Validation States', () => {
  test('should match form with valid input', async ({ page }) => {
    await page.goto('/applications/new');

    await page.fill('[name="title"]', '有効なタイトル');
    await page.fill('[name="goal"]', '有効な目標');

    // 有効状態の確認
    const form = page.locator('form');
    await expect(form).toHaveScreenshot('form-valid-state.png', {
      maxDiffPixels: 100,
    });
  });

  test('should match form with validation errors', async ({ page }) => {
    await page.goto('/applications/new');

    // バリデーションエラーをトリガー
    await page.fill('[name="title"]', 'a'); // 短すぎるタイトル
    await page.blur('[name="title"]');

    // エラー表示を待つ
    await page.waitForSelector('[role="alert"]', { timeout: 2000 });

    const form = page.locator('form');
    await expect(form).toHaveScreenshot('form-error-state.png', {
      maxDiffPixels: 100,
    });
  });
});

test.describe('Visual Regression - PDF Preview Modal', () => {
  test('should match PDF preview modal', async ({ page }) => {
    await page.goto('/applications/test-project-id/pdf');

    await page.click('button[data-testid="preview-pdf"]');
    await page.waitForSelector('[data-testid="pdf-preview-modal"]', { timeout: 10000 });

    const modal = page.locator('[data-testid="pdf-preview-modal"]');
    await expect(modal).toHaveScreenshot('pdf-preview-modal.png', {
      fullPage: false,
      maxDiffPixels: 200,
    });
  });

  test('should match PDF preview controls', async ({ page }) => {
    await page.goto('/applications/test-project-id/pdf');

    await page.click('button[data-testid="preview-pdf"]');
    await page.waitForSelector('[data-testid="pdf-preview-controls"]', { timeout: 10000 });

    const controls = page.locator('[data-testid="pdf-preview-controls"]');
    await expect(controls).toHaveScreenshot('pdf-preview-controls.png', {
      maxDiffPixels: 50,
    });
  });
});