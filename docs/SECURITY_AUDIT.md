# VerseStudio 4K Pro — Security Architecture & Hardening Review

## 1. Threat Model & Security Posture

VerseStudio operates under a zero-trust model designed to protect creator privacy, intellectual property, and system stability during intensive 4K 60FPS video recording.

---

## 2. Manifest V3 & Content Security Policy (CSP)

```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';"
  }
}
```

- **Zero Remote Code Execution:** All application scripts, libraries (React, Zustand, Radix, webm-muxer), and styles are bundled within the extension package. No remote scripts (`cdn.jsdelivr.net`, Google Tag Manager, etc.) are allowed or referenced.
- **WebAssembly Scope:** `'wasm-unsafe-eval'` is permitted strictly for local video demuxing/trimming fallbacks within offscreen documents.
- **Strict Frame Navigation:** Studio tab cannot be embedded inside external iframes (`X-Frame-Options: DENY` equivalent).

---

## 3. Sandboxed Content Scripts & Presentation Overlays

- **Minimal Exposure:** Content scripts (`src/content/index.ts`) only inject Presentation Overlays (Spotlight, Laser Pen, Keystrokes HUD, Privacy Blur) upon explicit user trigger (`Alt+S`, `Alt+L`, `Alt+K`, `Alt+P`) or Tool Palette action.
- **Isolated Shadow DOM:** All overlay components are attached inside a closed/isolated Shadow Root to prevent style leakage and interference with host DOM or host page scripts.
- **Message Sanitization:** Messages passed between content scripts and the service worker/offscreen document use typed schemas validated by Zod. Unknown or malformed payloads are dropped immediately.

---

## 4. Token & Credential Storage

- **Google Drive OAuth Tokens:** Encrypted at rest using browser-level `chrome.storage.local`. Tokens are accessible only to the extension's service worker and offscreen documents; they are never passed to content scripts or third-party web contexts.
- **Zero API Secrets in Client Bundle:** All AI transcription (Whisper) and neural dubbing (ElevenLabs) API keys remain exclusively on serverless endpoints. The client extension passes only session tokens for quota validation.

---

## 5. Crash Resilience & Memory Management

- **Streaming Chunk Buffers:** 4K 60FPS video data is sliced into 5-second chunks and written directly to IndexedDB / OPFS via `idb`. Recordings up to 6 hours never accumulate in heap memory, preventing Out-Of-Memory (OOM) browser tab crashes.
- **Interrupted Session Recovery:** Upon studio tab reload or browser recovery, VerseStudio detects dangling recording blocks and reconstructs the timeline for export.
