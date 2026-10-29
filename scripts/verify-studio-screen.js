const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

async function testStudio() {
  const extPath = path.resolve(__dirname, '../apps/extension/dist');
  const userDataDir = path.resolve(__dirname, '../.tmp-test-profile');
  
  if (fs.existsSync(userDataDir)) {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  console.log('Launching Chromium with unpacked extension from:', extPath);
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

  // Wait for background worker / extension initialization
  let [backgroundPage] = context.serviceWorkers();
  if (!backgroundPage) {
    backgroundPage = await context.waitForEvent('serviceworker');
  }

  const extensionId = backgroundPage.url().split('/')[2];
  console.log('Extension loaded! Extension ID:', extensionId);

  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });

  const studioUrl = `chrome-extension://${extensionId}/studio.html`;
  console.log('Navigating to Studio URL:', studioUrl);
  await page.goto(studioUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Take screenshot of the rendered Studio
  const evidenceDir = path.resolve(__dirname, '../audit/evidence');
  if (!fs.existsSync(evidenceDir)) {
    fs.mkdirSync(evidenceDir, { recursive: true });
  }
  const screenshotPath = path.join(evidenceDir, 'studio-figma-verified.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('Studio page screenshot saved to:', screenshotPath);

  console.log('Total Console Errors:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.error('Console errors encountered:', consoleErrors);
  }

  await context.close();
  if (fs.existsSync(userDataDir)) {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  if (consoleErrors.length > 0) {
    process.exit(1);
  } else {
    console.log('Verification PASSED with ZERO console errors!');
  }
}

testStudio().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});

