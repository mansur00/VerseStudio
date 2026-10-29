# VerseStudio 4K Pro — Human Testing & Live Credentials Guide

This guide outlines the exact manual procedures and environment variables needed by human reviewers and developers to test integrations that require real external third-party credentials.

---

## 1. Automated Integration Verification Harness

You can test all real external services in a single automated command:
```bash
GOOGLE_OAUTH_TOKEN="ya29..." \
GEMINI_API_KEY="AIzaSy..." \
ELEVENLABS_API_KEY="sk_..." \
STRIPE_SECRET_KEY="sk_test_..." \
node scripts/verify-real-integrations.js
```

---

## 2. Service Verification Details

### A. Google Drive Cloud Storage (`GOOGLE_OAUTH_TOKEN`)
1. **OAuth Scope Required**: Strictly `https://www.googleapis.com/auth/drive.file`.
2. **How to obtain token**:
   - Use Google OAuth 2.0 Playground (`developers.google.com/oauthplayground`) or the extension's interactive sign-in flow.
   - Authorize `https://www.googleapis.com/auth/drive.file`.
3. **What is verified**:
   - `about.get`: Fetches user's actual Drive storage limit and usage.
   - `resumable upload`: Creates an 8 MB multi-chunk upload session in the `VerseStudio` folder.
   - `safe trashing`: Soft-deletes the file using `trashed: true` rather than permanent deletion.

### B. Google Gemini 1.5 Flash AI (`GEMINI_API_KEY`)
1. **API Key Location**: Google AI Studio (`aistudio.google.com`).
2. **What is verified**:
   - Audio transcription of spoken Bengali.
   - Bilingual subtitle cue generation (`.srt` and `.vtt`).
   - Markdown step-by-step tutorial generation with click coordinates.

### C. ElevenLabs Neural Voice TTS (`ELEVENLABS_API_KEY`)
1. **API Key Location**: ElevenLabs dashboard (`elevenlabs.io`).
2. **What is verified**:
   - Multilingual neural voice synthesis (`eleven_multilingual_v2`).
   - Audio stream retrieval and 20% ducked audio mixing under original Bengali audio.

### D. Billing Gateway (`STRIPE_SECRET_KEY` or `LEMONSQUEEZY_API_KEY`)
1. **Stripe Test Key**: `sk_test_...` from Stripe Dashboard.
2. **Lemon Squeezy API Key**: From Lemon Squeezy API settings.
3. **What is verified**:
   - Checkout session generation for Pro plan ($19/mo or $190/yr).
   - Webhook processing verifying `checkout.session.completed`.

---

## 3. Human E2E Testing with Physical Devices

### A. Testing Physical iPhone / Android Phone Camera
1. Ensure your machine and phone are on the same Wi-Fi network.
2. Start an HTTPS tunnel (e.g. `cloudflared tunnel --url http://localhost:3000`).
3. Set `VITE_WEB_BASE_URL` to the HTTPS tunnel URL and load the extension.
4. In Studio, click the **Phone** tab -> **Connect Phone Camera**.
5. Scan the QR code or enter the short code on your phone browser.
6. Tap **Start Streaming (1080p)** on your phone.
7. Confirm that the phone's camera feed immediately appears in the Studio Camera Bubble.

