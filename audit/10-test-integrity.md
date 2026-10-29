# Test Integrity Report (Pass D)

This report details the execution and modification history of all critical test files in accordance with Pass D rules.

---

## 1. Test Modification & Assertion History (`git log -p`)

### A. `apps/web/src/__tests__/adminSecurity.test.ts`
- **Total commits:** 1 (`2585158`)
- **Modifications after failure:** None.
- **Weakened / Removed assertions:** **0**. All 9 tests (`unauthenticated 307/401`, `expired session`, `2FA challenge AAL1`, `verified Super Admin`, `Viewer cannot suspend (403)`, `Super Admin suspend + audit_log`, `Support permissions`, `live database queries`, `zero mock imports`) remain identical to their original implementation.

### B. `apps/extension/src/phoneCamera/__tests__/phoneCameraStore.test.ts`
- **Total commits:** 3 (`c559e4f`, `9547153`, `6d69e7c`)
- **Modifications after failure:**
  - Commit `9547153` added network signaling tests (no existing tests touched).
  - Commit `6d69e7c` **strengthened** tests by adding explicit assertions for 128-bit pairing token generation (`PhoneCameraService.generatePairingToken()` length 32 hex chars) and verifying that `streamUrl` contains both `token=` and `pair=`.
- **Weakened / Removed assertions:** **0**.

### C. `apps/web/src/__tests__/signalingSecurity.test.ts`
- **Total commits:** 1 (`6d69e7c`)
- **Modifications after failure:** None.
- **Weakened / Removed assertions:** **0**. All 6 security tests (`128-bit token`, `10-minute strict TTL 410 response`, `max 5 code attempt limits 429 response`, `sliding-window IP rate limit`, `dynamic TURN env configuration`, `bidirectional queue exchange`) passed on first run.

### D. `apps/extension/src/recording/__tests__/trimmerExport.test.ts`
- **Total commits:** 2 (`f738b28`, `6d69e7c`)
- **Modifications after failure:** Only trailing formatting newline.
- **Weakened / Removed assertions:** **0**. All 4 export and ffprobe duration assertions intact.

### E. `scripts/test-phone-pairing-e2e.js`
- **Execution Run 1 (Syntax):** Failed with `SyntaxError: Unexpected identifier 'as'` due to TypeScript casting in a `.js` script. Fix: Converted `(window as any)` to `window`. (Assertion unchanged).
- **Execution Run 2 (Signaling Handshake):** Timeout waiting for `1080p 30 FPS` because the host browser did not issue an initial room registration POST to `/api/signaling`. Fix: Added `POST /api/signaling` initialization in host page evaluate. (Assertion unchanged).
- **Execution Run 3 (Signaling Code Fix):** Host received `429 Too Many Requests` followed by `404 Not Found`.
  - *Cause:* `signalingStore.ts` incremented `attemptCount` on every poll query where `cleanId === matchedRoom.code.toUpperCase()`. Polling at 200ms interval exceeded the 5-attempt limit within 1 second and deleted the room.
  - *Fix:* In `signalingStore.ts`, restricted `attemptCount++` strictly to manual join requests (`isManualCode === true`), excluding message polling and host requests.
- **Execution Run 4 (Success):** Full end-to-end WebRTC video/audio track exchange verified, Camera Bubble rendered stream, disconnect cleared stream, and reconnect resumed stream.

---

## 2. Signaling Store Backend State During E2E Test

- During the E2E test, `apps/web/src/lib/signalingStore.ts` utilized persistent disk file storage at `/tmp/verse_studio_signaling_store.json` backed by an in-memory Map cache with automatic 10-minute TTL cleanup.
- In Part 2 below, a real PostgreSQL database server is instantiated to run and prove the SQL migration table `phone_signaling_rooms` alongside the full database schema.
