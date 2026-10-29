const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

async function testRecordingFlow() {
  const extPath = path.resolve(__dirname, '../apps/extension/dist');
  const userDataDir = path.resolve(__dirname, '../.tmp-test-profile');
  
  if (fs.existsSync(userDataDir)) {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: true,
    args: [
      `--disable-extensions-except=${extPath}`,
      `--load-extension=${extPath}`,
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--auto-select-desktop-capture-source=Entire screen',
    ],
  });

  let [backgroundPage] = context.serviceWorkers();
  if (!backgroundPage) {
    backgroundPage = await context.waitForEvent('serviceworker');
  }

  const extensionId = backgroundPage.url().split('/')[2];
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  const studioUrl = `chrome-extension://${extensionId}/studio.html`;
  await page.goto(studioUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const evidenceDir = path.resolve(__dirname, '../audit/evidence');

  console.log('1. Clicking Start Recording...');
  await page.getByRole('button', { name: 'Start Recording' }).click();

  // Wait for 3-second countdown
  console.log('Waiting for Countdown (3s)...');
  await page.waitForTimeout(3800);

  // Now in recording state (Screen 20)
  console.log('Verifying active recording state...');
  await page.waitForTimeout(1500);

  const recScreenshotPath = path.join(evidenceDir, 'studio-figma-recording-active.png');
  await page.screenshot({ path: recScreenshotPath, fullPage: true });
  console.log('Recording active screenshot saved:', recScreenshotPath);

  // Click Stop recording on the main record button
  console.log('2. Clicking Stop Recording...');
  await page.locator('aside').getByRole('button', { name: 'Stop Recording' }).click();
  await page.waitForTimeout(2000);

  // Should transition to Post-Studio
  const postStudioScreenshotPath = path.join(evidenceDir, 'studio-figma-post-studio.png');
  await page.screenshot({ path: postStudioScreenshotPath, fullPage: true });
  console.log('Post-Studio screenshot saved:', postStudioScreenshotPath);

  console.log('Console Errors across recording flow:', consoleErrors.length);
  await context.close();
  if (fs.existsSync(userDataDir)) {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  if (consoleErrors.length > 0) {
    console.error('Errors:', consoleErrors);
    process.exit(1);
  } else {
    console.log('Recording flow verified with ZERO errors!');
  }
}

testRecordingFlow().catch((err) => {
  console.error(err);
  process.exit(1);
});
