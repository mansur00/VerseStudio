# VerseStudio 4K Pro — Google OAuth Verification Package

## 1. OAuth Client Details

- **Application Name:** VerseStudio 4K Pro
- **Application Type:** Chrome Extension & Web Application
- **Authorized JavaScript Origins:** `https://versestudio.app`, `chrome-extension://[EXTENSION_ID]`
- **Authorized Redirect URIs:**
  - `https://[EXTENSION_ID].chromiumapp.org/google-auth`
  - `https://versestudio.app/auth/callback`

---

## 2. Requested Scopes & Justification

VerseStudio requests strictly a single Google Drive scope:

### `https://www.googleapis.com/auth/drive.file`
- **Scope Level:** Sensitive (Restricted scope avoided)
- **Scope Description:** View and manage Google Drive files and folders that you have opened or created with this app.
- **Why this scope is essential:**
  1. VerseStudio creates a dedicated `VerseStudio` folder in the user's Google Drive.
  2. VerseStudio performs 8 MB chunked resumable uploads of 4K screen recordings directly into this folder.
  3. VerseStudio updates sharing permissions to "anyone with the link can view" only when the creator explicitly toggles link sharing.
  4. VerseStudio lists, renames, and manages only the files that VerseStudio itself has created.
- **Why broader scopes are NOT used:**
  VerseStudio never requests `drive` (full access) or `drive.readonly` (reading user's unrelated files). We follow strict least-privilege principles.

---

## 3. Data Handling & Privacy Model (BYOS)

- **Storage Location:** All exported video files (WebM/MP4) reside strictly on the user's personal Google Drive storage.
- **Proprietary Storage:** VerseStudio operates zero central video storage databases. No video recordings are duplicated, retained, or hosted on VerseStudio servers.
- **Token Security:**
  - OAuth refresh tokens are encrypted using AES-GCM and stored in `chrome.storage.local`.
  - Tokens are never exposed to content scripts or client web pages.
- **Account Disconnect & Deletion:**
  - Disconnecting Google Drive immediately purges tokens from local storage.
  - Deleting a VerseStudio account removes all platform profile records while leaving all Google Drive video files intact and untouched in the user's Drive.
