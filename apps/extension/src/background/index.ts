/**
 * VerseStudio 4K Pro — Manifest V3 Background Service Worker
 * Handles extension launch, offscreen document lifecycle, and message routing.
 */

// Open studio.html in a full tab on action click
chrome.action.onClicked.addListener(async () => {
  const studioUrl = chrome.runtime.getURL('studio.html');
  const existingTabs = await chrome.tabs.query({ url: studioUrl });

  if (existingTabs.length > 0 && existingTabs[0].id) {
    await chrome.tabs.update(existingTabs[0].id, { active: true });
  } else {
    await chrome.tabs.create({ url: studioUrl });
  }
});

// Setup or ensure offscreen document exists
export async function setupOffscreenDocument(path: string = 'src/offscreen/offscreen.html') {
  const offscreenUrl = chrome.runtime.getURL(path);
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: [chrome.runtime.ContextType.OFFSCREEN_DOCUMENT],
    documentUrls: [offscreenUrl],
  });

  if (existingContexts.length > 0) {
    return;
  }

  await chrome.offscreen.createDocument({
    url: path,
    reasons: [chrome.offscreen.Reason.USER_MEDIA, chrome.offscreen.Reason.AUDIO_PLAYBACK],
    justification: 'Offscreen document needed for canvas compositing and MediaRecorder streams.',
  });
}

// Background message routing
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'ENSURE_OFFSCREEN') {
    setupOffscreenDocument()
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Keep channel open for async response
  }
});
