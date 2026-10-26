/**
 * VerseStudio 4K Pro — Content Script Overlay Manager
 * Controls in-tab overlays: Laser pen, Cursor spotlight, Keystroke HUD, Privacy blur.
 */

console.log('[VerseStudio] Content script ready for live recording overlays.');

window.addEventListener('keydown', (e) => {
  // Global shortcut Alt+S for Spotlight
  if (e.altKey && e.key.toLowerCase() === 's') {
    chrome.runtime.sendMessage({ type: 'TOGGLE_SPOTLIGHT' });
  }
});
