# VerseStudio 4K Pro — Security & Privacy Audit
**Date:** 2026-10-29  
**Auditor:** Independent Audit (Antigravity Senior Full-Stack Lead)  
**Scope:** Chrome Manifest V3 Extension, Next.js Web App, Google OAuth, Local Storage  

---

## 1. Executive Security Summary

The codebase demonstrates commendable discipline regarding API credentials: **zero hardcoded secrets or API keys exist in client bundles or git history**, and Google Drive access adheres strictly to the least-privilege OAuth scope (`https://www.googleapis.com/auth/drive.file`).

However, the audit identifies **three critical vulnerabilities**:
1. **Unprotected Admin Routes (CRITICAL):** The Next.js Admin Dashboard (`/admin/*`) contains no server-side authentication, middleware, or session verification. Any unauthenticated web user can access internal dashboards and review administrative screens.
2. **Overly Broad `<all_urls>` Declarative Content Script Injection (HIGH):** The extension injects `content_scripts` unconditionally into every visited website at `document_idle`. This violates Chrome Web Store minimum-privilege guidelines and poses security/compliance review risks.
3. **Exposing Extension Pages in `web_accessible_resources` (MEDIUM):** `studio.html` and `offscreen.html` are declared accessible to `<all_urls>`, exposing them to clickjacking and cross-origin iframe embedding by arbitrary websites.

---

## 2. Manifest V3 Permissions Review (`apps/extension/src/manifest.json`)

| Permission | Declared In | Purpose / Justification | Risk Level | Assessment & Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| `storage` | `permissions` | Saves user settings, layout preferences, and OAuth tokens. | Low | Justified and required. |
| `unlimitedStorage` | `permissions` | Permits IndexedDB chunk streaming for 6+ hour 4K recordings. | Low | Justified to prevent browser quota eviction mid-recording. |
| `offscreen` | `permissions` | Required in MV3 for persistent audio mixing and compositor canvas. | Medium | Justified. |
| `identity` | `permissions` | Launches `chrome.identity.launchWebAuthFlow` for Google OAuth. | Medium | Justified. |
| `activeTab` | `permissions` | Temporary access to current tab during recording interactions. | Low | Justified and recommended by Chrome team. |
| `scripting` | `permissions` | Injects overlay tools and event trackers. | Medium | Justified, but see section 2.1 below. |
| `alarms` | `permissions` | Background keep-alive and periodic quota sync. | Low | Justified. |
| `tabCapture` | `permissions` | Audio and tab capture streaming. | Medium | Justified. |
| `desktopCapture` | `optional_permissions` | Prompts user for screen / window capture stream. | Medium | Best practice to list as optional. |

### 2.1 Content Script Injection Risk
In `apps/extension/src/manifest.json`:
```json
"content_scripts": [
  {
    "matches": ["<all_urls>"],
    "js": ["src/content/index.ts"],
    "run_at": "document_idle"
  }
]
```
- **Violation:** `AGENTS.md` explicitly required: *"Content scripts (injected on demand): overlays for laser pen, spotlight, keystroke HUD, privacy blur, click ripple."*
- **Security Impact:** Unconditionally executing code in all browser frames (`<all_urls>`) subjects sensitive websites (banking, health records, enterprise intranets) to DOM listeners on every page load.
- **Chrome Web Store Impact:** Google Web Store automated review will flag `<all_urls>` content script injection and require intensive manual review or reject the submission under Single Purpose and User Data policies.
- **Remediation:** Remove `content_scripts` from `manifest.json`. Inject `overlayManager.ts` dynamically via `chrome.scripting.executeScript({ target: { tabId }, ... })` only when the user starts a recording session or toggles a live tool.

### 2.2 `web_accessible_resources` Exposure
In `apps/extension/src/manifest.json`:
```json
"web_accessible_resources": [
  {
    "resources": [
      "studio.html",
      "src/offscreen/offscreen.html"
    ],
    "matches": ["<all_urls>"]
  }
]
```
- **Security Impact:** Declaring `studio.html` and `offscreen.html` accessible to `<all_urls>` allows any malicious website on the internet to embed VerseStudio in an `<iframe>` or probe for its extension ID (`chrome-extension://<id>/studio.html`).
- **Remediation:** Restrict `matches` to the production domain (`https://versestudio.app/*`), or remove `studio.html` from `web_accessible_resources` entirely (extension tabs do not need to be web-accessible to open via `chrome.tabs.create`).

---

## 3. Content Security Policy (CSP)

- `manifest.json` does not declare a custom `content_security_policy` block. It relies on the default MV3 policy:
  ```text
  script-src 'self'; object-src 'self';
  ```
- **Remote Script Execution:** No remote script tags (`eval()`, inline scripts, or remote CDN `.js`) exist in the extension, satisfying MV3 store guidelines.
- **Remote Stylesheet Exception:** In `apps/extension/src/studio/index.html`, Google Fonts stylesheets are loaded from `https://fonts.googleapis.com`. This violates strict offline CSP principles and should be replaced with local bundled font assets.

---

## 4. Google OAuth 2.0 & Token Handling

1. **OAuth Scope:**
   - In `apps/extension/src/drive/driveService.ts` L141:
     `scope=https://www.googleapis.com/auth/drive.file`
   - **Compliant:** Uses `drive.file` instead of full `drive` scope. VerseStudio only has access to files it creates, and cannot read or delete existing user files.
2. **Token Storage:**
   - Tokens are stored in `chrome.storage.local` unencrypted (`verse_studio_drive_token_v1`).
   - While `chrome.storage.local` is isolated per-extension by Chrome sandbox boundaries, devices with malware or shared OS profiles could inspect local SQLite storage files. Best practice is to set short expiration windows (1 hour) and rely on refresh token exchanges.
3. **Client Secret Privacy:**
   - Client secrets are not bundled in the extension. The OAuth implementation uses the standard implicit/PKCE flow (`response_type=token`).

---

## 5. Web App & Admin Dashboard Security (`apps/web`)

1. **Unprotected Admin Routes:**
   - `apps/web/src/app/admin/*` contains 15 screens with sensitive operational views: user management, moderation blocks, plan upgrades, billing logs, and system audit trails.
   - **Finding:** There is **no Next.js middleware** (`middleware.ts`), no session cookie check, and no API authentication layer.
   - Any web visitor who navigates to `https://<domain>/admin` or `https://<domain>/admin/users` has immediate full access to all admin views.
   - In `apps/web/src/app/admin/layout.tsx` L32:
     ```tsx
     const [is2FaVerified, setIs2FaVerified] = useState(true);
     ```
     The 2FA protection is a client-side mock flag defaulting to `true`.
2. **Cross-Origin & CORS Policies:**
   - The web app currently operates in client-rendered mock mode (`'use client'`). When real backend APIs (Supabase or serverless functions) are integrated, strict CORS headers must restrict API access to the extension ID and official web domain.

