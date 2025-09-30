import { chromium, FullConfig } from '@playwright/test';

/**
 * APP-100: Playwright グローバルセットアップ
 * governance.yaml準拠 - テスト環境初期化
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 APP-100 E2E Test Suite Starting...');
  
  // テスト用ブラウザー起動確認
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // ベースURLアクセス確認
    await page.goto('http://localhost:3000', {
      timeout: 30000
    });
    
    // 基本ページ表示確認
    await page.waitForSelector('body', { timeout: 10000 });
    
    console.log('✅ Development server is ready');
    console.log(`📍 Base URL: http://localhost:3000`);
    
    // governance.yaml準拠チェック
    const startTime = Date.now();
    await page.goto(`http://localhost:3000/ja/preview-demo`);
    const loadTime = Date.now() - startTime;
    
    if (loadTime > 2000) {
      console.warn(`⚠️  Page load time: ${loadTime}ms (governance.yaml requires <2s)`);
    } else {
      console.log(`✅ Page load time: ${loadTime}ms (governance.yaml compliant)`);
    }
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
  
  // テスト実行環境の準備完了
  console.log('🎯 Global setup completed successfully');
  
  // 環境変数設定
  process.env.PLAYWRIGHT_TEST_READY = 'true';
  process.env.PLAYWRIGHT_START_TIME = Date.now().toString();
}

export default globalSetup;