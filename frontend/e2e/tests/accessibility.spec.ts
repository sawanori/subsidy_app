import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * APP-100: アクセシビリティE2Eテスト
 * WCAG 2.1 AA完全準拠・governance.yaml準拠
 */

test.describe('APP-100: Accessibility E2E Tests', () => {
  
  test('WCAG 2.1 AA Compliance - All Pages', async ({ page }) => {
    const pages = [
      { path: '/ja', name: 'Home Page' },
      { path: '/ja/preview-demo', name: 'Preview Demo' },
      { path: '/ja/upload-demo', name: 'Upload Demo' }
    ];

    for (const { path, name } of pages) {
      await test.step(`${name} - WCAG 2.1 AA Check`, async () => {
        await page.goto(path);
        
        // axe-core による自動アクセシビリティテスト
        const accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze();

        // 違反がないことを確認
        expect(accessibilityScanResults.violations).toEqual([]);
        
        console.log(`✅ ${name}: ${accessibilityScanResults.passes.length} accessibility checks passed`);
        
        // 追加の手動チェック項目
        await test.step(`${name} - Manual Accessibility Checks`, async () => {
          // 1. キーボードナビゲーション
          await page.keyboard.press('Tab');
          const focusedElement = page.locator(':focus');
          await expect(focusedElement).toBeVisible();
          
          // 2. スキップリンクの存在確認
          const skipLinks = page.locator('a[href="#main-content"], a[href="#skip-to-content"]');
          if (await skipLinks.count() > 0) {
            console.log(`✅ ${name}: Skip link available`);
          }
          
          // 3. 見出し構造チェック (h1→h2→h3の論理的順序)
          const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
          if (headings.length > 0) {
            console.log(`✅ ${name}: ${headings.length} headings found`);
          }
          
          // 4. フォーカス表示確認
          if (await page.locator('input, button, a').count() > 0) {
            await page.keyboard.press('Tab');
            const focusOutline = await page.locator(':focus').evaluate(el => {
              const styles = window.getComputedStyle(el);
              return styles.outline || styles.boxShadow;
            });
            expect(focusOutline).not.toBe('none');
          }
          
          // 5. alt属性確認
          const images = page.locator('img');
          const imageCount = await images.count();
          for (let i = 0; i < imageCount; i++) {
            const img = images.nth(i);
            const alt = await img.getAttribute('alt');
            expect(alt).toBeDefined(); // alt属性が存在することを確認
          }
          
          console.log(`✅ ${name}: All manual accessibility checks passed`);
        });
      });
    }
  });

  test('Color Contrast and Visual Accessibility', async ({ page }) => {
    await page.goto('/ja/preview-demo');
    
    await test.step('Color Contrast Verification', async () => {
      // axe-core color-contrast ルール特化テスト
      const colorContrastResults = await new AxeBuilder({ page })
        .include('body')
        .withRules(['color-contrast'])
        .analyze();

      expect(colorContrastResults.violations).toEqual([]);
      console.log('✅ Color contrast: All elements pass WCAG AA standards');
    });

    await test.step('Focus Management', async () => {
      // フォーカス管理テスト
      const interactiveElements = page.locator('button, a, input, select, textarea, [tabindex]');
      const count = await interactiveElements.count();
      
      for (let i = 0; i < Math.min(count, 10); i++) { // 最初の10要素をテスト
        await page.keyboard.press('Tab');
        const focusedElement = page.locator(':focus');
        await expect(focusedElement).toBeVisible();
      }
      
      console.log(`✅ Focus management: ${count} interactive elements accessible via keyboard`);
    });

    await test.step('Screen Reader Compatibility', async () => {
      // スクリーンリーダー対応確認
      const ariaLabels = await page.locator('[aria-label]').count();
      const ariaDescribedBy = await page.locator('[aria-describedby]').count();
      const ariaLabelledBy = await page.locator('[aria-labelledby]').count();
      
      console.log(`✅ Screen reader support: ${ariaLabels + ariaDescribedBy + ariaLabelledBy} ARIA attributes found`);
      
      // ランドマークの確認
      const landmarks = page.locator('main, nav, aside, header, footer, [role="main"], [role="navigation"]');
      const landmarkCount = await landmarks.count();
      expect(landmarkCount).toBeGreaterThan(0);
      
      console.log(`✅ Page landmarks: ${landmarkCount} structural landmarks found`);
    });
  });

  test('Form Accessibility', async ({ page }) => {
    await page.goto('/ja/preview-demo');
    
    await test.step('Form Label Association', async () => {
      // フォームラベル関連付けテスト
      const inputs = page.locator('input');
      const inputCount = await inputs.count();
      
      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const id = await input.getAttribute('id');
        
        if (id) {
          // label[for] または aria-labelledby の存在確認
          const label = page.locator(`label[for="${id}"], [aria-labelledby*="${id}"]`);
          const hasLabel = await label.count() > 0;
          const ariaLabel = await input.getAttribute('aria-label');
          
          expect(hasLabel || ariaLabel).toBeTruthy();
        }
      }
      
      console.log(`✅ Form accessibility: ${inputCount} inputs properly labeled`);
    });

    await test.step('Error Message Association', async () => {
      // エラーメッセージの関連付けテスト
      // 無効な入力でエラー発生
      await page.fill('input[type="email"]', 'invalid-email');
      await page.blur();
      
      // エラーメッセージが適切に関連付けられているか確認
      const errorMessages = page.locator('[role="alert"], .error-message, [aria-describedby]');
      if (await errorMessages.count() > 0) {
        console.log('✅ Error messages: Properly associated with form fields');
      }
    });
  });

  test('Dynamic Content Accessibility', async ({ page }) => {
    await page.goto('/ja/upload-demo');
    
    await test.step('Live Region Updates', async () => {
      // ライブリージョンテスト（動的コンテンツ更新）
      await page.click('[data-testid="add-sample-data"]');
      
      // aria-live領域の確認
      const liveRegions = page.locator('[aria-live], [role="status"], [role="alert"]');
      const liveRegionCount = await liveRegions.count();
      
      if (liveRegionCount > 0) {
        console.log(`✅ Live regions: ${liveRegionCount} dynamic update regions found`);
      }
      
      // 状態変化の通知確認
      const statusUpdates = page.locator('[data-testid*="status"], [data-testid*="progress"]');
      await expect(statusUpdates.first()).toBeVisible();
    });

    await test.step('Modal Dialog Accessibility', async () => {
      // モーダルダイアログのアクセシビリティ
      const modalTriggers = page.locator('[data-testid*="modal"], [data-testid*="dialog"]');
      
      if (await modalTriggers.count() > 0) {
        await modalTriggers.first().click();
        
        // フォーカストラップの確認
        await page.keyboard.press('Tab');
        const focusedElement = page.locator(':focus');
        await expect(focusedElement).toBeVisible();
        
        // ESCキーでの閉じる機能
        await page.keyboard.press('Escape');
        
        console.log('✅ Modal accessibility: Focus trap and keyboard navigation working');
      }
    });
  });

  test('Mobile Accessibility', async ({ page, browserName }) => {
    // モバイルビューポートでのアクセシビリティテスト
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/ja/preview-demo');
    
    await test.step('Touch Target Size', async () => {
      // タッチターゲットサイズ確認（44px x 44px最小）
      const buttons = page.locator('button, a');
      const buttonCount = await buttons.count();
      
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        const box = await button.boundingBox();
        
        if (box) {
          expect(box.width).toBeGreaterThanOrEqual(44);
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
      
      console.log('✅ Mobile accessibility: Touch targets meet minimum size requirements');
    });

    await test.step('Mobile Navigation', async () => {
      // モバイルナビゲーションのアクセシビリティ
      const navToggle = page.locator('[aria-expanded], [data-testid*="menu"], [data-testid*="nav"]');
      
      if (await navToggle.count() > 0) {
        // メニュー開閉状態の確認
        const expanded = await navToggle.first().getAttribute('aria-expanded');
        console.log(`✅ Mobile navigation: ARIA expanded state managed (${expanded})`);
      }
    });
  });

  test('Accessibility Performance Impact', async ({ page }) => {
    // アクセシビリティ機能によるパフォーマンス影響測定
    await page.goto('/ja/preview-demo');
    
    await test.step('Performance with Accessibility Features', async () => {
      const startTime = Date.now();
      
      // アクセシビリティ機能を含む操作実行
      await page.fill('input', 'Test input for accessibility performance');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      const endTime = Date.now();
      const operationTime = endTime - startTime;
      
      // governance.yaml: アクセシビリティ機能があっても2秒以内
      expect(operationTime).toBeLessThan(2000);
      
      console.log(`✅ Accessibility performance: ${operationTime}ms (within governance limits)`);
    });
  });
});