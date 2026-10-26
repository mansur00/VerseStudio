# VerseStudio: Agent Development Prompt

Paste this whole document into your coding agent (Claude Code or similar) as the first message. Save it in the repo as `AGENTS.md` or `CLAUDE.md` so the agent re-reads it every session.

---

## 1. Your role and goal

You are a senior full-stack engineer. Build **VerseStudio 4K Pro**: a Manifest V3 Chrome extension that works as a 4K 60 FPS screen-recording studio with Bangla-to-English AI voice and subtitles, plus a small web app (shared watch page, auth callbacks, admin dashboard).

The design is finished and lives in Figma. **Figma is the source of truth for UI.** Do not invent screens, colors or copy. If the design and this document disagree, the design wins; tell me about the conflict.

- Figma file: https://www.figma.com/design/PNUNAZJ5hSATGhVrsEQBWr/VerseStudio?node-id=17-2&t=YQum5odqwfxn949Z-1
- Use the Figma MCP server: `get_variable_defs` for tokens, `get_design_context` and `get_screenshot` per screen, `get_metadata` to find node ids.
- Pages in the file: `Foundations`, `Core Components`, `Icons` (Hugeicons Pro, Stroke Rounded), `Studio Components`, `Account & Admin Components`, `Screens` (62 numbered screens in user-journey order), `Admin Dashboard` (15 screens).

### Product in one paragraph

Users record their screen, window or tab in up to 4K 60 FPS with a camera bubble, cinematic auto-zoom, live tools (laser pen, spotlight, keystroke display, privacy blur, teleprompter) and optional live Bangla-to-English subtitles. After recording they trim, pick an audio track (original Bangla, English AI voice, mixed voice), export locally (MP4/WebM, camera track, `.srt`, step-by-step guide `.md`) or **save to their own Google Drive** and get a share link. Free and Pro plans differ by AI minutes and branding, not storage, because files live in the user's Drive.

---

## 2. How you must work

1. **Start by writing `PLAN.md`**: architecture, folder layout, phase checklist, risks. Ask me the open questions in section 11 before Phase 3.
2. Work **phase by phase** (section 6). Finish, test and commit one phase before starting the next. Small commits, conventional messages.
3. Before building any screen, open it in Figma (screenshot + design context) and match spacing, type, color tokens, states and copy exactly.
4. Never hard-code a color, radius, spacing or font size. Use the design tokens (section 4).
5. Every user-facing string goes through i18n from day one (`en` and `bn`). Bangla must render in Hind Siliguri.
6. Accessibility is a requirement, not polish (section 5). Run axe checks in CI.
7. Do not claim something works unless you ran it. For browser features, test in real Chrome (stable) and say exactly what you verified.
8. If a platform limit blocks a feature (see section 8), stop, explain, and propose options. Do not silently fake it.
9. Never put secrets (API keys, OAuth client secrets) in the extension bundle.

---

## 3. Recommended architecture

Confirm or challenge these in `PLAN.md`.

**Monorepo (pnpm workspaces, TypeScript strict):**

- `apps/extension`: Chrome MV3 extension (Vite + WXT or CRXJS, React 18).
- `apps/web`: Next.js app for the shared watch page, auth callbacks, help pages and the admin dashboard (route group `/admin`).
- `packages/tokens`: design tokens (CSS variables + Tailwind preset), generated from Figma variables.
- `packages/ui`: React component library that mirrors the Figma components.
- `packages/shared`: types, zod schemas, i18n strings, API client.

**Extension runtime pieces:**

- **Studio page** (`studio.html`, opened in a full tab): setup, recording controls, post-studio, library, settings, account. This is the main UI.
- **Service worker**: message routing, auth/session, alarms, Drive upload orchestration.
- **Offscreen document**: owns `MediaRecorder`, `getDisplayMedia` streams, audio mixing, canvas compositing (layouts, camera bubble, zoom/pan, wallpaper frame).
- **Content scripts** (injected on demand): overlays for laser pen, spotlight, keystroke HUD, privacy blur, click ripple.
- **Document Picture-in-Picture** window for the always-on-top Mini Controller (fallback: small popup window).
- **IndexedDB / OPFS** for chunked recording storage (6 hour recordings must not live in RAM).

**Suggested libraries:** Zustand (state), Tailwind with the token preset, Radix primitives (accessible behavior) styled to the design, `idb`, `mediabunny` or `webm-muxer` / `mp4-muxer` for muxing, `ffmpeg.wasm` only for trim/convert fallbacks, i18next, zod, Vitest, Playwright, axe-core.

**Backend (recommend Supabase; confirm with me):** Postgres with row level security, email/password + Google sign-in, email verification and password reset, tables for profiles, plans, usage (AI minutes), share pages (metadata only), moderation reports, audit log, admin roles. Serverless functions for Gemini/ElevenLabs calls (so keys stay server-side) and billing webhooks.

---

## 4. Design system implementation

Export tokens from Figma variables (collections: `Primitives`, `Color` with modes Dark and Light, `Spacing`, `Radius`, `Typography`, `Motion`). Generate `tokens.css` with CSS variables named from the Figma code syntax, e.g. `--color-bg-canvas`. **Dark is the default theme.** Dark uses soft dark gray, never pure black.

### Core color tokens (Dark / Light)

| Token | Dark | Light |
| --- | --- | --- |
| bg/canvas | #1B1C21 | #F5F5F7 |
| bg/surface | #222329 | #FFFFFF |
| bg/elevated | #292A31 | #FFFFFF |
| bg/hover | #2F3037 | #E9EAEE |
| bg/active | #383942 | #D3D4DB |
| text/primary | #F5F5F7 | #1B1C21 |
| text/secondary | #B9BAC4 | #4A4B55 |
| text/tertiary | #A3A4B0 | #6E6F7B |
| text/disabled | #6E6F7B | #B9BAC4 |
| text/on-brand | #1B1C21 | #1B1C21 |
| border/subtle | #2F3037 | #E9EAEE |
| border/default | #383942 | #D3D4DB |
| border/strong | #4A4B55 | #B9BAC4 |
| border/input (controls, 3:1) | #6E6F7B | #6E6F7B |
| border/focus | #A3E635 | #65A30D |
| brand/default (lime) | #A3E635 | #84CC16 |
| brand/hover | #BEF264 | #A3E635 |
| brand/pressed | #84CC16 | #65A30D |
| brand/subtle | #26400A | #F7FEE7 |
| record/default (recording red) | #FF4D4F | #E5383B |
| danger/default (button, white text) | #CF3235 | #CF3235 |
| danger/hover | #D83538 | #D83538 |
| danger/pressed | #BA2A2D | #BA2A2D |
| success/default | #22C55E | #16A34A |
| warning/default | #F59E0B | #D97706 |
| error/default | #FF6B6B | #E5383B |
| accent/laser | #22D3EE | #06B6D4 |

Subtle backgrounds (`record/subtle`, `success/subtle`, `warning/subtle`, `error/subtle`) are the 900 step in Dark and the 50 step in Light. Read the full list with `get_variable_defs`; do not rely on this table alone.

### Other tokens

- **Spacing (4 px grid):** 0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.
- **Radius:** none 0, xs 4, sm 8, md 12, lg 16, xl 24, 2xl 32, full 9999.
- **Fonts:** Inter (UI), Hind Siliguri (Bangla), JetBrains Mono (timer, code).
- **Type scale (Inter):** Display 48/56 Bold; H1 36/44 Bold; H2 30/38 SemiBold; H3 24/32; H4 20/28; Body L 18/28; Body M 16/24; Body S 14/20; Caption 12/16; Label M 14/20 Medium; Label S 12/16 Medium. Mono: Timer 32/40, Code 14/20. Bangla: Heading 24/36, Subtitle 20/32, Body 16/26, Caption 14/22 (taller line height on purpose).
- **Motion:** durations 0.10 / 0.15 / 0.25 / 0.40 / 0.50 s (instant, fast, base, slow, layout-morph); easings standard `cubic-bezier(.2,0,0,1)`, out `(0,0,.2,1)`, in `(.4,0,1,1)`; layout morph spring: stiffness 260, damping 26, mass 1.
- **Elevation:** shadow sm/md/lg/xl (black, 40 to 60 percent), glow brand (lime, 40 percent, 24 px blur), glow record (red, 50 percent, 24 px blur).
- **Focus ring:** 2 px outside ring using `text/primary`, on every interactive component.

### Components to build in `packages/ui` (match Figma variants and states)

Button and Button Small (Primary, Secondary, Ghost, Danger × Default, Hover, Pressed, Focus, Disabled; optional leading icon), Icon Button (Primary, Secondary, Ghost × Md, Sm), Toggle, Slider, Tab and Tab Group, Tooltip (optional shortcut), Toast (Info, Success, Warning, Error), Keyboard Shortcut Pill (sm, lg), Input (Default, Focus, Error, Disabled), Select, Checkbox (incl. indeterminate), Progress Bar, Menu and Menu Item, Modal (Confirm, Danger, Progress, Error), Avatar, Status Chip, KPI Card, Pagination, Admin Nav Item, User Menu, Plan Card, Chart Line and Chart Bars (use a chart lib styled with tokens), and the studio components: Record Button, Layout Switcher, Camera Bubble (incl. Off), Mini Controller (Idle, Recording, Paused), Audio Track Selector, Share Link Card, Timeline Trimmer, Teleprompter, Tool Palette, Live Subtitle, Countdown, Wallpaper Swatch, Mic Level, Recording Card (Shared, Private, Uploading, Failed).

Icons: Hugeicons Pro, Stroke, Rounded, 20 px default. Import the icons used in the design from the `Icons` page.

---

## 5. Accessibility requirements (WCAG 2.2 AA)

The design already passes automated checks for text contrast (4.5:1, 3:1 large), control boundary contrast (3:1), 24 px minimum targets and visible focus. Keep it that way in code:

- Semantic HTML first; use Radix/ARIA only where needed. Every icon-only button has an accessible name (Layout Switcher, Tool Palette, Mini Controller, close buttons).
- Full keyboard operation, logical tab order, focus trap and focus return in modals, `Esc` closes dialogs.
- Error messages tied to inputs (`aria-describedby`), `aria-live` for toasts, upload progress, recording state, mic level.
- Never rely on color alone (status chips and errors already carry text or icons).
- Respect `prefers-reduced-motion` **and** the in-app `Reduce motion` setting (disables spring morphs, auto-zoom animation).
- Set `lang` per element for mixed Bangla/English text. Provide `autocomplete` attributes on auth forms.
- Global shortcuts use `Alt+Letter`; make them remappable and avoid conflicts with browser and OS shortcuts.
- Captions: the watch page and player expose subtitles (`.vtt`/`.srt`) with a CC toggle.
- CI: axe-core on every page and component story. Before release, test with a real screen reader (NVDA and VoiceOver).

---

## 6. Delivery phases

Screen numbers below are the prefixes in the Figma `Screens` page names (for example `19 Recording / Recording`). Each phase ends with a demo script and a passing test run.

### Phase 0: Foundations

Monorepo, lint, format, CI, `tokens` package (generated from Figma), `ui` package with Storybook, Button/Input/Toggle/Modal/Toast first, i18n setup, extension shell that opens `studio.html`. **Done when:** Storybook shows tokens and the first components in Dark and Light with axe passing.

### Phase 1: Core recording (screens 11 to 13, 18 to 23, 30)

- Setup: source (screen, window, tab), layout switcher (4 layouts), camera and mic selection, mic level meter, effects toggles, wallpaper, padding, corner radius, shadow.
- Capture with `getDisplayMedia` at up to 3840×2160 at 60 FPS (negotiate down gracefully), system audio, mic mix.
- Canvas compositor: Screen Only, Camera Only, Screen + Round Camera Bubble (draggable), 50/50 split, with spring morph between layouts.
- Countdown, record, pause, resume, stop. Mini Controller via Document PiP.
- Chunked writes to OPFS/IndexedDB; recover an interrupted recording on next open.
- Post-Studio: preview, trimmer, local export (WebM and MP4), progress modal for the 4K merge.
- **Acceptance:** 30 minute 4K60 test recording on a mid-range laptop with no dropped UI, survives a tab crash, exports a playable file.

### Phase 2: Live tools and cinematic effects (screens 19, 20)

Auto zoom and pan on click (2x, smooth), click ripple, cursor spotlight (`Alt+S`), laser pen with 2 second fade, keystroke HUD, privacy shield blur, Tool Palette, tooltips, teleprompter (speed control, current-line highlight, Bangla support), long-recording warning. **Acceptance:** each tool toggles by shortcut and by UI, and respects Reduce motion.

### Phase 3: Accounts and onboarding (screens 1 to 10, 41 to 52)

Sign up, validation errors, email verification code, onboarding steps, permissions screen, permission denied recovery, sign in, forgot and reset password, show/hide password, profile, security (password, 2FA, sessions), plan and billing, upgrade, delete account, user menu, help and support. **Acceptance:** all error states in the design are reachable and tested; session survives extension restart.

### Phase 4: Google Drive storage (screens 5, 24 to 30, 31 to 40, 42 to 44)

- OAuth with scope `https://www.googleapis.com/auth/drive.file` only (per-file access). Use `chrome.identity` (`launchWebAuthFlow`) and refresh tokens through the backend or token endpoint as decided in `PLAN.md`.
- Create a `VerseStudio` folder, resumable upload in 8 MB chunks with retry and resume, progress UI, cancel.
- Share link: set "anyone with the link can view", return the link, QR code, copy.
- Library lists only files the app created; card states Shared, Private, Uploading, Failed; open in Drive, rename, change visibility, move to Trash with a Moved to Trash toast.
- States: not connected, connection failed, reconnect needed (token expired), disconnect confirm, Drive full (`about.get` storage quota), upload failed with retry, loading, empty, no results.
- **Acceptance:** upload a 2 GB file, kill the network mid-upload, resume successfully; disconnect leaves existing Drive files untouched.

### Phase 5: Bilingual AI (screens 19, 22 to 24)

Live Bangla speech to English subtitles (Live Subtitle overlay, bilingual and English-only), after-recording English neural voice, mixed voice (about 20 percent Bangla under 100 percent English), audio track selector, `.srt` export, one-click step-by-step guide (`.md`, plus PDF) built from click events plus transcript, progress and cancel for each job. AI calls go through server functions with per-plan quotas (Free 30 subtitle minutes per month, Pro 300) and usage tracking. **Acceptance:** a 5 minute Bangla recording produces correct subtitles, an English voice track and a guide.

### Phase 6: Phone camera (screens 14 to 16)

WebRTC pairing: QR code and stream URL, waiting and connected states, mobile page for the phone with Connected and Stop streaming, reconnect handling. **Acceptance:** phone camera appears in the Camera Bubble at 1080p 30 FPS on the same Wi-Fi.

### Phase 7: Settings (screens 42 to 49)

General (language, theme, reduce motion), Recording (quality, format, limits, safe saving), Effects and shortcuts (remappable), Voice and AI, Google Drive (four states). Settings persist and sync to the account.

### Phase 8: Web app (screens 40, 41, admin)

- **Shared watch page:** plays the Drive file (Drive preview embed or authorized streaming), shows "Hosted on Google Drive", Open in Drive, captions, link-unavailable state.
- **Admin dashboard (route group `/admin`, role-gated, 2FA required):** Overview, Users (list, bulk selection, no-results, detail, suspend confirm), Recordings, Moderation (block shared page confirm), Plans and billing, AI usage and costs, Drive and limits, Audit log, Admin settings and roles, Invite admin. Admin can block a **share page**; admin cannot delete files from a user's Drive.

### Phase 9: Hardening and release

Performance budget, security review, privacy policy and data-deletion flow, Chrome Web Store listing and permission justifications, Google OAuth verification package, error monitoring, e2e tests, real screen-reader pass, light-mode contrast audit.

---

## 7. Key technical requirements

- **Capture:** request ideal 3840×2160 at 60 FPS, read back the actual settings and show them. Bitrate about 25 to 40 Mbps for 4K60 (VP9 or H.264, AV1 when supported). Handle `ended` events when the user stops sharing from the browser UI.
- **Long recordings:** never buffer whole recordings in memory. Write chunks continuously; local limit is advisory (about 6 hours, depends on disk and memory).
- **Audio:** mix mic and system audio in a Web Audio graph; expose mic level for the Mic Level meter.
- **MV3 limits:** service workers sleep; keep recording state in the offscreen document and persist session state. Plan message passing carefully.
- **Permissions (justify each):** `desktopCapture` or `tabCapture`, `offscreen`, `identity`, `storage`, `unlimitedStorage`, `scripting`, `activeTab`, `alarms`. Use optional permissions where possible.
- **Security:** strict CSP, no remote code, tokens in `chrome.storage` with the smallest scope, input validation with zod, rate limits on server functions, audit log for every admin action.
- **Privacy:** only touch files created by VerseStudio; no analytics without consent; delete account removes VerseStudio data but never Drive files.

---

## 8. Known platform risks (verify early, report findings)

1. **Teleprompter, Mini Controller and overlays in entire-screen capture:** anything visible on screen can be recorded. Verify what Chrome excludes. If "not recorded" cannot be guaranteed in Entire Screen mode, support it for Tab and Window capture and show a clear warning in the UI.
2. **Audio track switching on the shared page:** a Drive file holds one video with one mixed audio track. The design removes the track selector on the watch page. If we want switching, we must upload separate files; discuss before building.
3. **Drive processing delay:** a freshly uploaded video may not play immediately. Show a "Drive is still processing" state.
4. **`drive.file` limits:** the app can see only files it created. If a user moves or deletes them in Drive, the Library must handle missing files gracefully.
5. **4K60 on weak hardware:** drop to 1440p or 30 FPS with a visible notice instead of failing.
6. **MP4 export in the browser:** ffmpeg.wasm is slow for 4K; prefer WebCodecs/muxing where possible and test.
7. **Shortcut conflicts:** `Alt+R` and similar can clash with OS or browser shortcuts.

---

## 9. Testing and quality gates

- Unit tests (Vitest) for compositor math, upload resume logic, quota rules, token refresh.
- Component tests and Storybook stories for every state, with axe.
- Playwright e2e for web and admin; extension e2e with a Chromium persistent context.
- Visual checks: compare each built screen with its Figma screenshot; list differences in the PR.
- CI fails on lint, type errors, axe violations and missing translations.

### Definition of done (every phase)

Feature works in real Chrome; all states from Figma exist; tokens only; `en` and `bn` strings present; keyboard and screen-reader checked; tests pass; short demo notes added to `PLAN.md`.

---

## 10. Screen index (Figma `Screens` page)

**1 Onboarding:** 01 Sign Up, 02 Sign Up validation error, 03 Verify Email, 04 Onboarding step 1 of 3, 05 Connect Google Drive step 2 of 3, 06 Permissions step 3 of 3. **2 Sign in:** 07 Sign In, 08 Sign In error, 09 Forgot Password, 10 Reset Email Sent, 11 Reset Password. **3 Setup:** 12 Capture, 13 Camera, 14 Look, 15 Phone Pairing waiting, 16 Phone Pairing connected, 17 Phone Camera (mobile), 18 Permission Denied. **4 Recording:** 19 Countdown, 20 Recording, 21 Paused, 22 Long Recording Warning. **5 Post-Studio and save:** 23 Processing AI Voice, 24 Post-Studio, 25 Guide Preview, 26 Exporting 4K, 27 Discard Confirm, 28 Connect Drive Prompt, 29 Drive Connection Failed, 30 Drive Connected, 31 Uploading to Google Drive, 32 Google Drive Full, 33 Upload Failed, 34 Share Link. **6 Library:** 35 Empty, 36 Drive Disconnected, 37 Loading, 38 Library, 39 No Results, 40 Card Menu, 41 Share Settings, 42 QR Code, 43 Rename, 44 Move to Trash Confirm, 45 Moved to Trash. **7 Recipient:** 46 Shared Watch Page, 47 Link Unavailable. **8 Settings:** 48 General, 49 Recording, 50 Effects and Shortcuts, 51 Voice and AI, 52 Google Drive connected, 53 Not Connected, 54 Reconnect Needed, 55 Disconnect Confirm. **9 Account and help:** 56 User Menu, 57 Profile, 58 Security, 59 Plan and Billing, 60 Upgrade Plan, 61 Delete Account Confirm, 62 Help and Support.

**Admin Dashboard page (A01 to A15):** Overview; Users, Bulk Selection, No Results, User Detail, Suspend Confirm; Recordings, Moderation, Block Shared Page Confirm; Plans and Billing, AI Usage and Costs; Drive and Limits, Audit Log, Admin Settings and Roles, Invite Admin.

The exact numbers in Figma are authoritative; read frame names with `get_metadata`. The prototype links in Figma show the intended navigation between screens.

---

## 11. Open questions (ask me before Phase 3)

1. Backend choice: Supabase (recommended), Firebase, or custom?
2. AI keys: bring-your-own keys in Settings, server-side keys with plan quotas, or both? (The design shows key fields and quotas.)
3. Billing provider that works for our business location (Stripe may not be available everywhere; consider Paddle, Lemon Squeezy or a local gateway).
4. Real domain and brand name for share links (the design uses `versestudio.app` as a placeholder).
5. Chrome Web Store developer account and Google Cloud project ownership for OAuth verification.
6. Do we need separate audio files on Drive to allow track switching on the watch page?
7. Minimum supported Chrome version and OS list.

Start now: read the Figma file, write `PLAN.md`, list your assumptions and open questions, then begin Phase 0.
