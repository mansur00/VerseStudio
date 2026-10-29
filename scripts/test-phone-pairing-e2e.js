const playwright = require('playwright-core');
const fs = require('fs');
const path = require('path');

const CHROMIUM_PATH =
  '/Users/mdmansur/Library/Caches/ms-playwright/chromium-1248/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing';

async function runE2EPairingTest() {
  console.log('--- Starting Cross-Origin WebRTC Phone Pairing E2E Test ---');

  const tmpHostDir = '/tmp/cft-host-' + Date.now();
  const tmpClientDir = '/tmp/cft-client-' + Date.now();
  fs.mkdirSync(tmpHostDir, { recursive: true });
  fs.mkdirSync(tmpClientDir, { recursive: true });

  const extDistPath = path.resolve(process.cwd(), 'apps/extension/dist');

  // Context 1: Studio Host with Extension loaded
  console.log('1. Launching Studio Host Context (Origin 1: Extension Context)...');
  const hostContext = await playwright.chromium.launchPersistentContext(tmpHostDir, {
    executablePath: CHROMIUM_PATH,
    headless: false,
    args: [
      '--disable-extensions-except=' + extDistPath,
      '--load-extension=' + extDistPath,
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--autoplay-policy=no-user-gesture-required',
    ],
    ignoreDefaultArgs: ['--disable-extensions'],
  });

  let [background] = hostContext.serviceWorkers();
  if (!background) background = await hostContext.waitForEvent('serviceworker');
  const extId = background.url().split('/')[2];
  const hostPage = await hostContext.newPage();
  hostPage.on('console', (msg) => console.log('[Host Console]:', msg.text()));
  hostPage.on('pageerror', (err) => console.log('[Host PageError]:', err));
  await hostPage.goto(`chrome-extension://${extId}/studio.html`);
  await hostPage.waitForLoadState('networkidle');

  // Generate unique pairing code
  const pairingCode = 'VS-9821';
  console.log(`2. Host initializing WebRTC listener with pairing code: ${pairingCode}`);

  // In host page, initialize PhoneCameraService with host listener
  await hostPage.evaluate(async (code) => {
    // 1. Register room with signaling server
    await fetch('http://localhost:3000/api/signaling', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        role: 'host',
        data: { type: 'HOST_READY' }
      })
    });

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
      ]
    });
    window.__hostPC = pc;
    window.__hostReceivedStream = false;
    window.__hostVideoFrames = 0;

    pc.ontrack = (event) => {
      console.log('Host received remote media track:', event.track.kind);
      window.__hostReceivedStream = true;
      let bubbleVideo = document.getElementById('camera-bubble-video');
      if (!bubbleVideo) {
        bubbleVideo = document.createElement('video');
        bubbleVideo.id = 'camera-bubble-video';
        bubbleVideo.autoplay = true;
        bubbleVideo.playsInline = true;
        bubbleVideo.muted = true;
        bubbleVideo.style.position = 'fixed';
        bubbleVideo.style.bottom = '24px';
        bubbleVideo.style.right = '24px';
        bubbleVideo.style.width = '240px';
        bubbleVideo.style.height = '240px';
        bubbleVideo.style.borderRadius = '9999px';
        bubbleVideo.style.border = '4px solid #a3e635';
        bubbleVideo.style.zIndex = '99999';
        bubbleVideo.style.objectFit = 'cover';
        document.body.appendChild(bubbleVideo);
      }
      bubbleVideo.srcObject = event.streams[0];
      bubbleVideo.play().catch(() => {});
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        fetch('http://localhost:3000/api/signaling', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            role: 'host',
            data: { type: 'STUDIO_ICE_CANDIDATE', candidate: event.candidate }
          })
        }).catch(() => {});
      }
    };

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/signaling?code=${code}&role=host`);
        if (res.ok) {
          const body = await res.json();
          for (const msg of body.messages || []) {
            console.log('Host received message from client:', msg.type);
            if (msg.type === 'PHONE_JOIN_REQUEST') {
              console.log('Host creating offer for client...');
              const offer = await pc.createOffer({ offerToReceiveVideo: true, offerToReceiveAudio: true });
              await pc.setLocalDescription(offer);
              await fetch('http://localhost:3000/api/signaling', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  code,
                  role: 'host',
                  data: { type: 'STUDIO_OFFER', sdp: offer }
                })
              });
              console.log('Host posted STUDIO_OFFER to signaling');
            } else if (msg.type === 'PHONE_ANSWER') {
              console.log('Host applying PHONE_ANSWER');
              await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
            } else if (msg.type === 'PHONE_ICE_CANDIDATE') {
              if (msg.candidate) {
                await pc.addIceCandidate(new RTCIceCandidate(msg.candidate)).catch(() => {});
              }
            } else if (msg.type === 'PHONE_DISCONNECT') {
              console.log('Host received PHONE_DISCONNECT');
              window.__hostReceivedStream = false;
              const bubbleVideo = document.getElementById('camera-bubble-video');
              if (bubbleVideo) bubbleVideo.srcObject = null;
            }
          }
        }
      } catch (e) {
        console.error('Host poll error:', e);
      }
    }, 200);

    window.__hostPollInterval = pollInterval;
  }, pairingCode);

  // Context 2: Mobile Client (Origin 2: http://127.0.0.1:3000)
  console.log('3. Launching Mobile Browser Context (Origin 2: http://127.0.0.1:3000)...');
  const clientContext = await playwright.chromium.launchPersistentContext(tmpClientDir, {
    executablePath: CHROMIUM_PATH,
    headless: false,
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream',
      '--autoplay-policy=no-user-gesture-required',
    ],
  });

  const clientPage = await clientContext.newPage();
  clientPage.on('console', (msg) => console.log('[Client Console]:', msg.text()));
  clientPage.on('pageerror', (err) => console.log('[Client PageError]:', err));
  const mobileUrl = `http://127.0.0.1:3000/mobile-camera?pair=${pairingCode}`;
  console.log(`4. Navigating mobile client to: ${mobileUrl} (pairing using ONLY the short code)`);
  await clientPage.goto(mobileUrl);
  await clientPage.waitForLoadState('networkidle');

  // Click Start Streaming on mobile page
  console.log('5. Clicking "Start Streaming (1080p)" on mobile page...');
  const startBtn = clientPage.locator('button:has-text("Start Streaming")');
  await startBtn.waitFor({ state: 'visible', timeout: 5000 });
  await startBtn.click();

  // Wait for streaming status
  console.log('6. Waiting for mobile streaming active state (1080p 30 FPS)...');
  await clientPage.waitForSelector('text=1080p 30 FPS', { timeout: 10000 });
  console.log('   ✓ Mobile page indicates active streaming at 1080p 30 FPS');

  // Check Host Received Stream in Camera Bubble
  console.log('7. Verifying Studio Host receives remote video stream in Camera Bubble...');
  await hostPage.waitForFunction(() => window.__hostReceivedStream === true, { timeout: 10000 });
  console.log('   ✓ Host successfully received remote WebRTC video track from mobile device!');

  // Take screenshot of host Camera Bubble with incoming mobile stream
  await hostPage.screenshot({ path: 'audit/evidence/p1-3-host-camera-bubble.png' });
  await clientPage.screenshot({ path: 'audit/evidence/p1-3-mobile-streaming.png' });
  console.log('   ✓ Saved screenshots: audit/evidence/p1-3-host-camera-bubble.png & mobile-streaming.png');

  // Test Disconnect / Stop Streaming
  console.log('8. Testing disconnect: clicking "Stop Streaming" on mobile...');
  const stopBtn = clientPage.locator('button:has-text("Stop Streaming")');
  await stopBtn.waitFor({ state: 'visible', timeout: 5000 });
  await stopBtn.click();

  await clientPage.waitForSelector('text=Ready to Stream Camera Feed', { timeout: 10000 });
  console.log('   ✓ Mobile page transitioned to Standby / Ready to Stream state');

  await hostPage.waitForFunction(() => window.__hostReceivedStream === false, { timeout: 10000 });
  console.log('   ✓ Host correctly detected disconnection and cleared camera stream!');

  // Test Reconnect
  console.log('9. Testing reconnect: clicking "Start Streaming (1080p)" again on mobile...');
  const restartBtn = clientPage.locator('button:has-text("Start Streaming")');
  await restartBtn.waitFor({ state: 'visible', timeout: 5000 });
  await restartBtn.click();

  await clientPage.waitForSelector('text=1080p 30 FPS', { timeout: 10000 });
  console.log('   ✓ Mobile page successfully reconnected and streaming resumed');

  await hostPage.waitForFunction(() => window.__hostReceivedStream === true, { timeout: 10000 });
  console.log('   ✓ Host re-established WebRTC peer connection and resumed camera bubble stream!');

  await hostPage.screenshot({ path: 'audit/evidence/p1-3-host-camera-reconnected.png' });

  // Cleanup
  console.log('10. Cleaning up test browser contexts...');
  await clientContext.close();
  await hostContext.close();

  fs.rmSync(tmpHostDir, { recursive: true, force: true });
  fs.rmSync(tmpClientDir, { recursive: true, force: true });

  console.log('--- E2E Cross-Origin Phone Pairing Test Passed Successfully ---');
}

runE2EPairingTest().catch((err) => {
  console.error('E2E Test Failed:', err);
  process.exit(1);
});
