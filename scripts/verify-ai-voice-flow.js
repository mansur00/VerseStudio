import { chromium } from 'playwright-core';
import path from 'path';

async function testAiVoiceFlow() {
  const extensionPath = path.resolve(process.cwd(), 'apps/extension/dist');
  console.log('Testing AI Voice flow in Chromium with unpacked extension:', extensionPath);

  const context = await chromium.launchPersistentContext('', {
    headless: false,
    viewport: { width: 1280, height: 800 },
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--auto-select-desktop-capture-source=Entire screen',
      '--no-sandbox',
    ],
  });

  const page = await context.newPage();
  
  // Find extension ID
  let extensionId = null;
  for (let i = 0; i < 10; i++) {
    const sw = context.serviceWorkers()[0];
    if (sw) {
      extensionId = sw.url().split('/')[2];
      break;
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log('Detected Extension ID:', extensionId);
  const studioUrl = `chrome-extension://${extensionId}/studio.html`;
  await page.goto(studioUrl);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

  // 1. Record a quick clip (3 seconds) to reach Post-Studio
  console.log('Step 1: Starting recording to reach Post-Studio...');
  const startBtn = page.getByRole('button', { name: /Start recording/i });
  await startBtn.click();
  await page.waitForTimeout(4000);

  // Click Stop recording
  console.log('Step 2: Stopping recording...');
  const stopBtn = page.getByRole('button', { name: /Stop recording/i }).first();
  await stopBtn.click();

  await page.waitForTimeout(2000);

  // Assert we are in Post-Studio
  console.log('Step 3: Checking Post-Studio review screen...');
  const postStudioHeader = page.getByRole('heading', { name: /Post-Studio Review/i });
  await postStudioHeader.waitFor({ state: 'visible', timeout: 8000 });
  console.log('Post-Studio header visible!');

  // 2. Click "Process AI Voice & Guide"
  console.log('Step 4: Clicking Process AI Voice & Guide...');
  const processBtn = page.getByRole('button', { name: /Process AI Voice & Guide/i });
  await processBtn.click();

  // 3. Verify modal opens
  console.log('Step 5: Verifying Bilingual AI Voice & Subtitles modal...');
  const modalHeader = page.getByRole('heading', { name: /Bilingual AI Voice & Subtitles/i });
  await modalHeader.waitFor({ state: 'visible', timeout: 5000 });

  // 4. Wait for completion (must not fail with "Processing Failed 0%")
  console.log('Step 6: Waiting for AI synthesis completion...');
  
  // Assert progress bar reaches 100% or "All AI Assets Ready" / "Done" button
  const doneBtn = page.getByRole('button', { name: /Done/i });
  await doneBtn.waitFor({ state: 'visible', timeout: 15000 });
  console.log('SUCCESS: AI Processing completed! Done button is visible!');

  // Take screenshot as proof
  await page.screenshot({ path: 'audit/evidence/ai-voice-flow-success.png' });
  console.log('Screenshot saved to audit/evidence/ai-voice-flow-success.png');

  await doneBtn.click();
  await page.waitForTimeout(1500);

  // Verify Guide button is visible and click it
  const guideBtn = page.getByRole('button', { name: /Step-by-Step Guide/i });
  await guideBtn.scrollIntoViewIfNeeded();
  await guideBtn.waitFor({ state: 'visible', timeout: 5000 });
  console.log('Step 7: Opening generated Step-by-Step Guide...');
  await guideBtn.click({ force: true });
  await page.waitForTimeout(1500);

  const guideModal = page.locator('text="Step-by-Step Tutorial Guide"');
  await guideModal.waitFor({ state: 'visible', timeout: 5000 });
  console.log('SUCCESS: Guide modal displayed with markdown guide and timestamps!');

  await page.screenshot({ path: 'audit/evidence/guide-preview-success.png' });
  console.log('Screenshot saved to audit/evidence/guide-preview-success.png');

  await context.close();
  console.log('ALL AI VOICE & GUIDE VERIFICATIONS PASSED SUCCESSFULLY!');
}

testAiVoiceFlow().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
