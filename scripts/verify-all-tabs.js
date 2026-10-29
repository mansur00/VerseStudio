const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

async function testAllTabs() {
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

  // 1. Capture Tab (already verified)
  
  // 2. Click Camera Tab
  console.log('Testing Camera Tab...');
  await page.getByRole('button', { name: 'Camera', exact: true }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(evidenceDir, 'studio-figma-camera-tab.png'), fullPage: true });

  // 3. Click Look Tab
  console.log('Testing Look Tab...');
  await page.getByRole('button', { name: 'Look', exact: true }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(evidenceDir, 'studio-figma-look-tab.png'), fullPage: true });

  // 4. Test Layout Switcher clicks
  console.log('Testing Layout Switcher...');
  await page.getByRole('radio', { name: 'Split 50/50' }).click();
  await page.waitForTimeout(500);
  await page.getByRole('radio', { name: 'Screen Only' }).click();
  await page.waitForTimeout(500);
  await page.getByRole('radio', { name: 'Screen + Camera Bubble' }).click();
  await page.waitForTimeout(500);

  console.log('Console Errors across all interactions:', consoleErrors.length);
  await context.close();
  if (fs.existsSync(userDataDir)) {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  if (consoleErrors.length > 0) {
    console.error('Errors:', consoleErrors);
    process.exit(1);
  } else {
    console.log('All tabs and controls verified with ZERO errors!');
  }
}

testAllTabs().catch((err) => {
  console.error(err);
  process.exit(1);
});

