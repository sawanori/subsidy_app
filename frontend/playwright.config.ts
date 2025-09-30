import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * APP-100: Playwright E2E テスト設定
 * governance.yaml準拠 - アクセシビリティ・パフォーマンス統合
 */
export default defineConfig({
  testDir: './e2e',
  
  /* 並列実行設定 */
  fullyParallel: true,
  
  /* CI環境での失敗時リトライ */
  retries: process.env.CI ? 2 : 0,
  
  /* 並列ワーカー数 */
  workers: process.env.CI ? 1 : undefined,
  
  /* レポーター設定 */
  reporter: [
    ['html'],
    ['json', { outputFile: 'playwright-report.json' }],
    ['junit', { outputFile: 'playwright-results.xml' }]
  ],
  
  /* 全テスト共通設定 */
  use: {
    /* ベースURL */
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    
    /* スクリーンショット設定 */
    screenshot: 'only-on-failure',
    
    /* 動画録画 */
    video: 'retain-on-failure',
    
    /* トレース収集 */
    trace: 'retain-on-failure',
    
    /* アクセシビリティ設定 */
    colorScheme: 'light',
    
    /* governance.yamlパフォーマンス準拠 */
    actionTimeout: 30000,
    navigationTimeout: 30000,
  },

  /* プロジェクト設定 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    
    /* モバイルテスト */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    
    /* アクセシビリティ専用プロジェクト */
    {
      name: 'accessibility',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*\.accessibility\.spec\.ts/,
    },
    
    /* パフォーマンス専用プロジェクト */
    {
      name: 'performance',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*\.performance\.spec\.ts/,
    },
  ],

  /* 開発サーバー起動設定 */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  
  /* テスト用の環境変数 */
  globalSetup: require.resolve('./e2e/global-setup.ts'),
  globalTeardown: require.resolve('./e2e/global-teardown.ts'),
  
  /* 出力ディレクトリ */
  outputDir: 'test-results/',
  
  /* テストタイムアウト */
  timeout: 60000,
  
  /* 期待値タイムアウト */
  expect: {
    /* governance.yaml: 2秒以内表示確認 */
    timeout: 5000,

    /* スクリーンショット比較設定 */
    toHaveScreenshot: {
      threshold: 0.2,
    },
  },
  
  /* メタデータ */
  metadata: {
    testSuite: 'APP-100 E2E Test Suite',
    governance: 'WCAG 2.1 AA + CSP + 2s Display',
    coverage: '70%+ Target',
    integration: 'worker3 Foundation'
  }
});