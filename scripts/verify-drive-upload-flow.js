import { chromium } from 'playwright-core';
import path from 'path';

async function testDriveUploadFlow() {
  const extensionPath = path.resolve(process.cwd(), 'apps/extension/dist');
  console.log('Testing Google Drive upload flow in Chromium with unpacked extension:', extensionPath);

  const context = await chromium.launchPersistentContext('', {
    headless: false,
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

  if (!extensionId) {
    // Navigate to chrome://extensions or try studio directly
    await page.goto('chrome://extensions');
    const extItem = await page.waitForSelector('extensions-item');
    extensionId = await extItem.getAttribute('id');
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
  await page.waitForTimeout(4000); // 3s countdown + recording starts

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

  // 2. Click "Save to Google Drive"
  console.log('Step 4: Clicking Save to Google Drive...');
  const driveBtn = page.getByRole('button', { name: /Save to Google Drive/i });
  await driveBtn.click();
  await page.waitForTimeout(1000);

  // 3. Connect Google Drive initial prompt (Screen 28)
  console.log('Step 5: Verifying Connect Google Drive modal...');
  const continueWithGoogle = page.getByRole('button', { name: /Continue with Google/i });
  await continueWithGoogle.waitFor({ state: 'visible', timeout: 5000 });
  console.log('Found Continue with Google button. Clicking...');
  await continueWithGoogle.click();
  await page.waitForTimeout(1000);

  // 4. Google Account Picker dialog
  console.log('Step 6: Choosing Google Account...');
  const accountBtn = page.getByRole('button', { name: /Select account/i }).first();
  await accountBtn.waitFor({ state: 'visible', timeout: 5000 });
  console.log('Account option visible. Selecting account...');
  await accountBtn.click();

  // 5. Verify upload progress
  console.log('Step 7: Verifying upload progression...');
  // Check if error box appeared
  await page.waitForTimeout(1500);
  const errorAlert = page.locator('text="Upload Interrupted"');
  if (await errorAlert.isVisible()) {
    const errorText = await page.locator('text="Failed to create VerseStudio folder"').textContent();
    console.error('FAILED! Error banner was displayed:', errorText);
    throw new Error('Upload Interrupted error banner occurred!');
  }

  // Check upload completion to Screen 34 ("Saved to Google Drive!")
  console.log('Step 8: Waiting for Screen 34 (Saved to Google Drive!)...');
  const savedHeader = page.getByRole('heading', { name: /Saved to Google Drive!/i });
  await savedHeader.waitFor({ state: 'visible', timeout: 15000 });
  console.log('SUCCESS: Screen 34 "Saved to Google Drive!" displayed!');

  // Check share card is present
  const shareCard = page.locator('text="Anyone with the link can view"');
  await shareCard.waitFor({ state: 'visible', timeout: 5000 });
  console.log('SUCCESS: Share link card is visible with public link!');

  // Take screenshot as proof
  await page.screenshot({ path: 'audit/evidence/google-drive-flow-success.png' });
  console.log('Screenshot saved to audit/evidence/google-drive-flow-success.png');

  await context.close();
  console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY!');
}

testDriveUploadFlow().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
