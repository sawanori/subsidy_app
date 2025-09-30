import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('PDF Upload to Application Form', () => {
  test('should upload R5.pdf and verify behavior', async ({ page }) => {
    // Navigate to the application page
    await page.goto('http://localhost:3000/ja/application/new');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Take screenshot before upload
    await page.screenshot({ path: 'before-upload.png', fullPage: true });

    // Click the button that opens the tax return modal
    const uploadButton = page.locator('text=/確定申告書から取り込む/');

    if (await uploadButton.isVisible({ timeout: 5000 })) {
      console.log('✓ Found "確定申告書から取り込む" button');
      await uploadButton.click();

      // Wait for modal to open
      await page.waitForTimeout(1000);

      // Now look for file input in the modal
      const fileInput = await page.locator('input[type="file"]').first();

      if (await fileInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log('✓ File input found in modal');

        // Get the absolute path to R5.pdf
        const pdfPath = path.resolve(__dirname, '../../R5.pdf');

        // Upload the PDF file
        await fileInput.setInputFiles(pdfPath);
      } else {
        console.log('✗ No file input found in modal');
        // Check if file input exists but is hidden
        const hiddenFileInput = await page.locator('input[type="file"]');
        if (await hiddenFileInput.count() > 0) {
          console.log('  File input exists but is hidden, attempting direct upload');
          const pdfPath = path.resolve(__dirname, '../../R5.pdf');
          await hiddenFileInput.first().setInputFiles(pdfPath);
        }
      }
    } else {
      console.log('✗ "確定申告書から取り込む" button not found');
      // Try to find any file input directly
      const fileInput = await page.locator('input[type="file"]').first();
      const pdfPath = path.resolve(__dirname, '../../R5.pdf');
      await fileInput.setInputFiles(pdfPath);
    }

    // Wait for any processing
    await page.waitForTimeout(2000);

    // Check for success messages or error messages
    const successMessage = page.locator('text=/アップロード成功|ファイルが正常に|uploaded successfully/i');
    const errorMessage = page.locator('text=/エラー|失敗|error|failed/i');

    // Take screenshot after upload
    await page.screenshot({ path: 'after-upload.png', fullPage: true });

    // Check if file name appears on page
    const fileName = page.locator('text=/R5\\.pdf/i');

    // Log what we find
    if (await successMessage.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('✓ Success message displayed');
      const text = await successMessage.textContent();
      console.log('  Message:', text);
    }

    if (await errorMessage.isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log('✗ Error message displayed');
      const text = await errorMessage.textContent();
      console.log('  Error:', text);
    }

    if (await fileName.isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log('✓ File name "R5.pdf" is displayed');
    }

    // Check for any preview elements
    const preview = page.locator('iframe, embed, object, canvas').first();
    if (await preview.isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log('✓ Preview element found');
      const tagName = await preview.evaluate(el => el.tagName.toLowerCase());
      console.log('  Preview type:', tagName);
    }

    // Check form state changes
    const formFields = await page.locator('input, textarea, select').all();
    console.log(`✓ Found ${formFields.length} form fields`);

    // Check for any loading indicators
    const loadingIndicator = page.locator('[aria-busy="true"], .loading, .spinner, text=/loading|読み込み中/i');
    if (await loadingIndicator.isVisible({ timeout: 500 }).catch(() => false)) {
      console.log('⏳ Loading indicator detected');
      await loadingIndicator.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {
        console.log('  Loading took longer than 10 seconds');
      });
    }

    // Log console messages from the page
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser console error:', msg.text());
      }
    });

    // Log network errors
    page.on('pageerror', error => {
      console.log('Page error:', error.message);
    });

    // Wait a bit more to catch any delayed reactions
    await page.waitForTimeout(3000);

    // Final screenshot
    await page.screenshot({ path: 'final-state.png', fullPage: true });

    console.log('\n📸 Screenshots saved:');
    console.log('  - before-upload.png');
    console.log('  - after-upload.png');
    console.log('  - final-state.png');
  });
});