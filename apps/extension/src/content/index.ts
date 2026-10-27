/**
 * VerseStudio 4K Pro — Content Script Entry Point
 * Mounts in-tab live tools and communicates with the extension background worker.
 */

import { InTabOverlayManager, LiveToolSettings } from './overlayManager';

const overlayManager = new InTabOverlayManager();

// Listen for messages from Studio or Service Worker to toggle live tools
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'TOGGLE_LIVE_TOOL' && message.tool) {
    overlayManager.toggleTool(message.tool as keyof LiveToolSettings, message.state);
    sendResponse({ success: true, settings: overlayManager.getSettings() });
    return true;
  }

  if (message.type === 'GET_LIVE_TOOLS_STATE') {
    sendResponse({ settings: overlayManager.getSettings() });
    return true;
  }
});
