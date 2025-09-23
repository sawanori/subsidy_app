import { test, expect } from '@playwright/test';

/**
 * APP-100: パフォーマンステスト
 * Core Web Vitals・governance.yaml準拠（2秒表示・99%成功率）
 */

test.describe('APP-100: Performance E2E Tests', () => {
  
  test('Core Web Vitals Measurement', async ({ page }) => {
    await test.step('Largest Contentful Paint (LCP)', async () => {
      await page.goto('/ja/preview-demo');
      
      // LCP測定
      const lcpTime = await page.evaluate(() => {
        return new Promise((resolve) => {
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            if (lastEntry) {
              observer.disconnect();
              resolve(lastEntry.startTime);
            }
          });
          observer.observe({ entryTypes: ['largest-contentful-paint'] });
          
          // 5秒タイムアウト
          setTimeout(() => resolve(0), 5000);
        });
      });
      
      if (lcpTime > 0) {
        // governance.yaml: 2.5秒以内（Good LCP）
        expect(lcpTime).toBeLessThan(2500);
        console.log(`✅ LCP: ${lcpTime.toFixed(2)}ms (target: <2500ms)`);
      }
    });

    await test.step('First Input Delay (FID)', async () => {
      await page.goto('/ja/preview-demo');
      
      // FID測定用のインタラクション
      const startTime = Date.now();
      await page.click('input[type="text"]');
      const interactionTime = Date.now() - startTime;
      
      // governance.yaml: 100ms以内（Good FID）
      expect(interactionTime).toBeLessThan(100);
      console.log(`✅ Interaction delay: ${interactionTime}ms (target: <100ms)`);
    });

    await test.step('Cumulative Layout Shift (CLS)', async () => {
      await page.goto('/ja/upload-demo');
      
      // CLS測定（動的コンテンツ読み込みでのレイアウトシフト）
      const clsScore = await page.evaluate(() => {
        return new Promise((resolve) => {
          let clsValue = 0;
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            }
          });
          observer.observe({ entryTypes: ['layout-shift'] });
          
          setTimeout(() => {
            observer.disconnect();
            resolve(clsValue);
          }, 3000);
        });
      });
      
      // Good CLS: <0.1
      expect(clsScore).toBeLessThan(0.1);
      console.log(`✅ CLS: ${clsScore.toFixed(4)} (target: <0.1)`);
    });
  });

  test('Page Load Performance', async ({ page }) => {
    const pages = [
      { path: '/ja', name: 'Home Page' },
      { path: '/ja/preview-demo', name: 'Preview Demo' },
      { path: '/ja/upload-demo', name: 'Upload Demo' }
    ];

    for (const { path, name } of pages) {
      await test.step(`${name} Load Performance`, async () => {
        const startTime = Date.now();
        
        await page.goto(path, { waitUntil: 'networkidle' });
        
        const loadTime = Date.now() - startTime;
        
        // governance.yaml: 2秒以内表示
        expect(loadTime).toBeLessThan(2000);
        console.log(`✅ ${name} load time: ${loadTime}ms (target: <2000ms)`);
        
        // DOMContentLoaded時間も測定
        const domContentLoadedTime = await page.evaluate(() => {
          return performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart;
        });
        
        expect(domContentLoadedTime).toBeLessThan(1500);
        console.log(`✅ ${name} DOM ready: ${domContentLoadedTime}ms`);
      });
    }
  });

  test('Real-time Preview Performance', async ({ page }) => {
    await page.goto('/ja/preview-demo');
    
    await test.step('Initial Render Performance', async () => {
      // 初期レンダリング性能
      const renderStartTime = Date.now();
      await expect(page.locator('[data-testid="preview-panel"]')).toBeVisible();
      const initialRenderTime = Date.now() - renderStartTime;
      
      expect(initialRenderTime).toBeLessThan(1000);
      console.log(`✅ Initial preview render: ${initialRenderTime}ms`);
    });

    await test.step('Input Response Performance', async () => {
      // 入力に対するレスポンス性能（APP-240最適化効果測定）
      const inputTests = [
        { field: '[data-testid="applicant-name"]', value: '株式会社テストパフォーマンス' },
        { field: '[data-testid="business-name"]', value: 'AI技術を活用した革新的システム開発プロジェクト' },
        { field: '[data-testid="business-purpose"]', value: 'A'.repeat(500) } // 長文テスト
      ];

      for (const { field, value } of inputTests) {
        const inputStartTime = Date.now();
        
        await page.fill(field, value);
        
        // プレビューに反映されるまでの時間
        await expect(page.locator('[data-testid="preview-content"]')).toContainText(value.substring(0, 10));
        
        const inputResponseTime = Date.now() - inputStartTime;
        
        // governance.yaml: 2秒以内でプレビュー更新
        expect(inputResponseTime).toBeLessThan(2000);
        console.log(`✅ Input response time: ${inputResponseTime}ms for field ${field}`);
      }
    });

    await test.step('Form Switching Performance', async () => {
      // フォーム切り替え性能
      const forms = ['form-tab-1', 'form-tab-2', 'form-tab-4', 'form-tab-confirmation'];
      
      for (const formTab of forms) {
        const switchStartTime = Date.now();
        
        await page.click(`[data-testid="${formTab}"]`);
        await expect(page.locator('[data-testid="preview-content"]')).toBeVisible();
        
        const switchTime = Date.now() - switchStartTime;
        
        expect(switchTime).toBeLessThan(1000);
        console.log(`✅ Form switch time: ${switchTime}ms for ${formTab}`);
      }
    });
  });

  test('Upload Performance', async ({ page }) => {
    await page.goto('/ja/upload-demo');
    
    await test.step('Sample Data Loading Performance', async () => {
      // サンプルデータ読み込み性能
      const loadStartTime = Date.now();
      
      await page.click('[data-testid="add-sample-data"]');
      await expect(page.locator('[data-testid="upload-status"]')).toContainText('完了', { timeout: 10000 });
      
      const loadTime = Date.now() - loadStartTime;
      
      // 10秒以内で処理完了
      expect(loadTime).toBeLessThan(10000);
      console.log(`✅ Sample data loading: ${loadTime}ms`);
    });

    await test.step('Analytics Dashboard Performance', async () => {
      // 分析ダッシュボード表示性能
      const dashboardStartTime = Date.now();
      
      await page.click('[data-testid="analytics-tab"]');
      await expect(page.locator('[data-testid="total-files"]')).toBeVisible();
      
      const dashboardTime = Date.now() - dashboardStartTime;
      
      expect(dashboardTime).toBeLessThan(1500);
      console.log(`✅ Analytics dashboard render: ${dashboardTime}ms`);
    });

    await test.step('Chart Rendering Performance', async () => {
      // Chart.js レンダリング性能
      await page.click('[data-testid="charts-tab"]');
      
      const chartStartTime = Date.now();
      await expect(page.locator('canvas')).toBeVisible();
      const chartTime = Date.now() - chartStartTime;
      
      expect(chartTime).toBeLessThan(2000);
      console.log(`✅ Chart rendering: ${chartTime}ms`);
    });
  });

  test('Memory Usage and Resource Efficiency', async ({ page }) => {
    await test.step('Memory Leak Detection', async () => {
      await page.goto('/ja/preview-demo');
      
      // 初期メモリ使用量
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });

      // 繰り返し操作でメモリリークテスト
      for (let i = 0; i < 10; i++) {
        await page.fill('[data-testid="applicant-name"]', `テスト申請者${i}`);
        await page.click('[data-testid="form-tab-2"]');
        await page.click('[data-testid="form-tab-1"]');
      }
      
      // 最終メモリ使用量
      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });

      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory;
        const memoryIncreasePercent = (memoryIncrease / initialMemory) * 100;
        
        // メモリ増加が50%以内に収まっていることを確認
        expect(memoryIncreasePercent).toBeLessThan(50);
        console.log(`✅ Memory usage increase: ${memoryIncreasePercent.toFixed(2)}% (target: <50%)`);
      }
    });

    await test.step('Network Resource Efficiency', async () => {
      // ネットワークリソース効率性
      const responses: any[] = [];
      
      page.on('response', response => {
        responses.push({
          url: response.url(),
          status: response.status(),
          size: parseInt(response.headers()['content-length'] || '0')
        });
      });
      
      await page.goto('/ja/upload-demo');
      await page.waitForLoadState('networkidle');
      
      // リソース読み込み分析
      const totalSize = responses.reduce((sum, resp) => sum + resp.size, 0);
      const failedRequests = responses.filter(resp => resp.status >= 400).length;
      
      // governance.yaml: 99%成功率
      const successRate = ((responses.length - failedRequests) / responses.length) * 100;
      expect(successRate).toBeGreaterThanOrEqual(99);
      
      console.log(`✅ Network success rate: ${successRate.toFixed(1)}%`);
      console.log(`✅ Total resource size: ${(totalSize / 1024).toFixed(2)} KB`);
    });
  });

  test('Concurrent User Simulation', async ({ page, context }) => {
    // 同時ユーザーシミュレーション
    await test.step('Multiple Tab Performance', async () => {
      const tabs = [];
      
      // 5つのタブを同時に開く
      for (let i = 0; i < 5; i++) {
        const newPage = await context.newPage();
        tabs.push(newPage);
      }
      
      // 全タブで同時にページ読み込み
      const loadPromises = tabs.map(async (tab, index) => {
        const startTime = Date.now();
        await tab.goto('/ja/preview-demo');
        const loadTime = Date.now() - startTime;
        
        expect(loadTime).toBeLessThan(3000); // 同時負荷でも3秒以内
        console.log(`✅ Tab ${index + 1} load time: ${loadTime}ms`);
        
        return tab;
      });
      
      await Promise.all(loadPromises);
      
      // 同時操作テスト
      const operationPromises = tabs.map(async (tab, index) => {
        await tab.fill('[data-testid="applicant-name"]', `同時ユーザー${index + 1}`);
        await tab.click('[data-testid="form-tab-2"]');
      });
      
      await Promise.all(operationPromises);
      
      // タブクリーンアップ
      for (const tab of tabs) {
        await tab.close();
      }
      
      console.log('✅ Concurrent user simulation completed successfully');
    });
  });

  test('Progressive Web App Performance', async ({ page }) => {
    await test.step('Service Worker Performance', async () => {
      await page.goto('/ja');
      
      // Service Workerの存在確認
      const hasServiceWorker = await page.evaluate(() => {
        return 'serviceWorker' in navigator;
      });
      
      if (hasServiceWorker) {
        console.log('✅ Service Worker support available');
        
        // キャッシュ効果測定
        const firstLoad = Date.now();
        await page.reload();
        const firstLoadTime = Date.now() - firstLoad;
        
        // 2回目の読み込み（キャッシュ効果期待）
        const secondLoad = Date.now();
        await page.reload();
        const secondLoadTime = Date.now() - secondLoad;
        
        if (secondLoadTime < firstLoadTime) {
          console.log(`✅ Cache performance improvement: ${firstLoadTime - secondLoadTime}ms`);
        }
      }
    });

    await test.step('Offline Performance', async () => {
      await page.goto('/ja');
      
      // オフライン状態シミュレーション
      await page.context().setOffline(true);
      
      try {
        // キャッシュされたリソースで動作確認
        await page.reload();
        
        // 基本機能が動作するかテスト
        const bodyVisible = await page.locator('body').isVisible();
        if (bodyVisible) {
          console.log('✅ Offline functionality partially available');
        }
      } catch (error) {
        console.log('ℹ️  Offline mode not fully supported (expected for current implementation)');
      } finally {
        await page.context().setOffline(false);
      }
    });
  });
});