/**
 * VerseStudio 4K Pro — Offscreen Document
 * Owns the MediaRecorder, Canvas 2D/WebGL Compositor, and Web Audio mixing pipeline.
 */

console.log('[VerseStudio] Offscreen document initialized for audio mixing & canvas compositing.');

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'OFFSCREEN_PING') {
    sendResponse({ status: 'ready', timestamp: Date.now() });
  }
});
