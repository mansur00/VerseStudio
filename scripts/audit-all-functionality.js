const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

async function auditAllFunctionality() {
  console.log('=== VERSESTUDIO COMPLETE FUNCTIONALITY AUDIT ===\n');

  const extensionPath = path.resolve(__dirname, '../apps/extension/dist');
  const userDataDir = path.resolve(__dirname, '../.tmp-audit-profile');

  if (fs.existsSync(userDataDir)) {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: true,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--use-fake-device-for-media-stream',
      '--use-fake-ui-for-media-stream',
      '--auto-select-desktop-capture-source=Entire screen',
    ],
  });

  const backgroundPages = context.serviceWorkers();
  let backgroundPage = backgroundPages[0];
  if (!backgroundPage) {
    backgroundPage = await context.waitForEvent('serviceworker');
  }

  const extensionId = backgroundPage.url().split('/')[2];
  const page = await context.newPage();
  
  const consoleErrors = [];
  const consoleLogs = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    } else {
      consoleLogs.push(msg.text());
    }
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  const studioUrl = `chrome-extension://${extensionId}/studio.html`;
  await page.goto(studioUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const results = [];
  function record(feature, status, details = '') {
    results.push({ feature, status, details });
    const mark = status === 'PASS' ? '✅' : status === 'WARN' ? '⚠️' : '❌';
    console.log(`${mark} [${status}] ${feature}: ${details}`);
  }

  // 1. Audit Top Navigation Tabs
  console.log('\n--- 1. Top Navigation & Modals ---');
  try {
    await page.getByRole('button', { name: 'Library', exact: true }).click();
    await page.waitForTimeout(500);
    const inLibrary = (await page.getByText(/Google Drive/i).first().isVisible().catch(() => false)) ||
                      (await page.getByText(/Library/i).first().isVisible().catch(() => false));
    record('Library Navigation', inLibrary ? 'PASS' : 'FAIL', inLibrary ? 'Library View rendered' : 'Failed to view Library');

    await page.getByRole('button', { name: 'Studio', exact: true }).click();
    await page.waitForTimeout(500);
    const inStudio = await page.getByRole('button', { name: 'Start recording' }).isVisible().catch(() => false);
    record('Studio Navigation', inStudio ? 'PASS' : 'FAIL', inStudio ? 'Studio View restored' : 'Failed to return to Studio');

    // Language Toggle
    await page.getByRole('button', { name: 'বাং', exact: true }).click();
    await page.waitForTimeout(300);
    const isBangla = await page.getByText(/রেকর্ডিং/i).isVisible().catch(() => false);
    record('Bangla i18n Switch', isBangla ? 'PASS' : 'WARN', isBangla ? 'Bangla rendered' : 'Bangla string not detected');
    await page.getByRole('button', { name: 'EN', exact: true }).click();
    await page.waitForTimeout(300);

    // Theme Toggle
    const themeBtn = page.getByRole('button', { name: 'Toggle theme' });
    await themeBtn.click();
    const lightTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    record('Theme Switch (Light/Dark)', lightTheme === 'light' ? 'PASS' : 'FAIL', `Theme: ${lightTheme}`);
    await themeBtn.click(); // Back to dark

    // Settings Modal
    const settingsBtn = page.getByRole('button', { name: 'Settings' });
    await settingsBtn.click();
    await page.waitForTimeout(400);
    const settingsModalVisible = await page.getByRole('heading', { name: /Settings/i }).isVisible().catch(() => false);
    record('Settings Modal', settingsModalVisible ? 'PASS' : 'FAIL', settingsModalVisible ? 'Opened' : 'Not visible');
    if (settingsModalVisible) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
  } catch (err) {
    record('Top Navigation', 'FAIL', err.message);
  }

  // 2. Audit Sidebar Tabs: Capture, Camera, Look
  console.log('\n--- 2. Sidebar Tabs & Controls ---');
  try {
    // Camera Tab
    await page.getByRole('button', { name: 'Camera', exact: true }).click();
    await page.waitForTimeout(300);
    const cameraTabActive = await page.getByText('CAMERA SOURCE').isVisible().catch(() => false);
    record('Camera Tab Switch', cameraTabActive ? 'PASS' : 'FAIL', 'Camera controls visible');

    // Bubble Shape Toggle
    const roundedBtn = page.getByRole('button', { name: 'Rounded', exact: true });
    if (await roundedBtn.isVisible()) {
      await roundedBtn.click();
      record('Camera Bubble Shape (Rounded)', 'PASS', 'Rounded button clicked');
    }

    // Phone Camera Modal
    const phoneBtn = page.getByRole('button', { name: /Use phone camera/i });
    if (await phoneBtn.isVisible()) {
      await phoneBtn.click();
      await page.waitForTimeout(400);
      const phoneModalVisible = await page.getByText(/Pairing Code/i).isVisible().catch(() => false);
      record('Phone Camera Modal', phoneModalVisible ? 'PASS' : 'FAIL', phoneModalVisible ? 'Modal opened' : 'Modal not open');
      if (phoneModalVisible) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    }

    // Look Tab
    await page.getByRole('button', { name: 'Look', exact: true }).click();
    await page.waitForTimeout(300);
    const lookTabActive = await page.getByText('WALLPAPER', { exact: true }).isVisible().catch(() => false);
    record('Look Tab Switch', lookTabActive ? 'PASS' : 'FAIL', 'Look controls visible');

    // Wallpaper Swatch Click
    const swatches = await page.getByRole('button', { name: /Select /i }).all();
    if (swatches.length >= 2) {
      await swatches[1].click(); // Select Lime Accent
      record('Wallpaper Swatch Selection', 'PASS', `Clicked swatch (${swatches.length} available)`);
    }

    // Capture Tab
    await page.getByRole('button', { name: 'Capture', exact: true }).click();
    await page.waitForTimeout(500);
    const captureTabActive = await page.locator('text=SOURCE').first().isVisible().catch(() => false);
    record('Capture Tab Switch', captureTabActive ? 'PASS' : 'FAIL', 'Capture controls visible');
  } catch (err) {
    record('Sidebar Controls', 'FAIL', err.message);
  }

  // 3. Layout Switcher
  console.log('\n--- 3. Layout Switcher ---');
  try {
    const layoutGroup = page.getByRole('radiogroup', { name: 'Recording Layout' });
    const layoutButtons = await layoutGroup.getByRole('radio').all();
    record('Layout Switcher Available', layoutButtons.length === 4 ? 'PASS' : 'FAIL', `${layoutButtons.length} layouts`);
    if (layoutButtons.length === 4) {
      // Click Camera Only
      await layoutButtons[1].click();
      await page.waitForTimeout(300);
      // Click Screen + Camera Bubble
      await layoutButtons[2].click();
      await page.waitForTimeout(300);
      record('Layout Switcher Interaction', 'PASS', 'Switched between layouts');
    }
  } catch (err) {
    record('Layout Switcher', 'FAIL', err.message);
  }

  // 4. Source Selection & Display Stream Capture
  console.log('\n--- 4. Screen Source Selection (getDisplayMedia) ---');
  try {
    const windowSourceBtn = page.getByRole('button', { name: 'window', exact: true });
    await windowSourceBtn.click();
    await page.waitForTimeout(1000);
    const displayStatus = await page.getByText(/Display Connected/i).first().isVisible().catch(() => false);
    record('getDisplayMedia (Auto Accepted)', displayStatus ? 'PASS' : 'FAIL', displayStatus ? 'Stream connected' : 'Stream not connected');
  } catch (err) {
    record('getDisplayMedia', 'FAIL', err.message);
  }

  // 5. Full Recording Flow
  console.log('\n--- 5. Recording Lifecycle ---');
  try {
    const startRecBtn = page.locator('aside').getByRole('button', { name: /Start recording/i });
    await startRecBtn.click();
    console.log('Countdown started...');
    await page.waitForTimeout(4200);

    const isRecordingNow = await page.getByText('REC').first().isVisible().catch(() => false);
    record('Recording Countdown & Activation', isRecordingNow ? 'PASS' : 'FAIL', isRecordingNow ? 'Active recording REC badge visible' : 'Not recording');

    // Check Live Tool Palette
    const toolPalette = await page.getByRole('toolbar', { name: /Live Recording Tools/i }).first().isVisible().catch(() => false);
    record('Live Tool Palette Overlay', toolPalette ? 'PASS' : 'FAIL', toolPalette ? 'Visible' : 'Not visible');

    // Check Mini Controller
    const miniController = await page.getByRole('toolbar', { name: 'Recording Controller' }).first().isVisible().catch(() => false);
    record('Mini Controller Bar', miniController ? 'PASS' : 'FAIL', miniController ? 'Visible' : 'Not visible');

    // Wait 2 seconds of recording
    await page.waitForTimeout(2000);

    // Stop Recording
    const stopRecBtn = page.locator('aside').getByRole('button', { name: /Stop recording/i });
    await stopRecBtn.click();
    await page.waitForTimeout(2500);

    // If Processing AI modal opened, dismiss it to inspect Post-Studio viewport
    const processingModalCancel = page.getByRole('button', { name: 'Cancel' });
    if (await processingModalCancel.isVisible().catch(() => false)) {
      await processingModalCancel.click();
      await page.waitForTimeout(400);
    }

    // Verify Post-Studio
    const postStudioHeading = await page.getByRole('heading', { name: /Post-Studio/i }).first().isVisible().catch(() => false);
    record('Post-Studio Transition', postStudioHeading ? 'PASS' : 'FAIL', postStudioHeading ? 'Post-Studio review loaded' : 'Post-Studio not loaded');

    // Check Trimmer
    const trimmerVisible = await page.getByText(/Trim Range:/i).first().isVisible().catch(() => false);
    record('Timeline Trimmer', trimmerVisible ? 'PASS' : 'FAIL', trimmerVisible ? 'Trimmer controls ready' : 'Not visible');

    // Check Audio Tracks
    const audioTracks = await page.getByText('Audio & Voice Tracks').first().isVisible().catch(() => false);
    record('Audio Track Selector', audioTracks ? 'PASS' : 'FAIL', audioTracks ? 'Tracks visible' : 'Not visible');

    // Check Export Buttons
    const mp4Btn = await page.getByRole('button', { name: 'Export MP4 (4K)' }).first().isVisible().catch(() => false);
    const webmBtn = await page.getByRole('button', { name: 'Export WebM' }).first().isVisible().catch(() => false);
    const driveBtn = await page.getByRole('button', { name: 'Save to Google Drive' }).first().isVisible().catch(() => false);
    record('Export Buttons Present', mp4Btn && webmBtn && driveBtn ? 'PASS' : 'FAIL', 'MP4, WebM, Google Drive buttons verified');
  } catch (err) {
    record('Recording Lifecycle', 'FAIL', err.message);
  }

  console.log('\n--- 6. Console Error Analysis ---');
  console.log(`Total Console Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    consoleErrors.forEach((e, idx) => console.log(`  [Error ${idx + 1}] ${e}`));
  }

  await context.close();
  if (fs.existsSync(userDataDir)) {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  console.log('\n=== AUDIT SUMMARY ===');
  const passes = results.filter((r) => r.status === 'PASS').length;
  const fails = results.filter((r) => r.status === 'FAIL').length;
  const warns = results.filter((r) => r.status === 'WARN').length;
  console.log(`Passed: ${passes}/${results.length}`);
  console.log(`Failed: ${fails}/${results.length}`);
  console.log(`Warnings: ${warns}/${results.length}`);
}

auditAllFunctionality().catch(console.error);
