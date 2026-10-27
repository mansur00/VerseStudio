# VerseStudio 4K Pro — Master Implementation Plan

> **Figma Source of Truth:** [VerseStudio Figma Design](https://www.figma.com/design/PNUNAZJ5hSATGhVrsEQBWr/VerseStudio?node-id=17-2)  
> **Status:** Active / In Progress  
> **Current Phase:** Phase 2: Live Tools and Cinematic Effects (Completed) -> Starting Phase 3: Accounts and Onboarding

---

## 1. Executive Summary & Architecture Overview

**VerseStudio 4K Pro** is a high-performance Manifest V3 Chrome Extension and accompanying Next.js Web App providing:
1. Studio-grade screen recording up to 4K 60FPS with dynamic layouts, camera bubble, cinematic auto-zoom, live tools (spotlight, laser pen, keystrokes HUD, privacy shield, teleprompter).
2. Live Bangla-to-English AI subtitles and post-recording AI voice dubbing/mixing.
3. Resumable Google Drive cloud sync (saving directly to user's Google Drive via `drive.file` scope) and instantaneous share links.
4. Companion Next.js Web App featuring a shared watch page, recipient player with captions, and role-gated Admin Dashboard.

### Monorepo Layout (pnpm workspaces + TypeScript Strict)

```
verse-studio/
├── apps/
│   ├── extension/              # Chrome MV3 Extension (Vite + CRXJS/WXT, React 18)
│   │   ├── src/
│   │   │   ├── background/     # Service Worker (auth, alarms, Drive upload orchestration)
│   │   │   ├── offscreen/      # Offscreen Document (MediaRecorder, Web Audio mixer, Canvas compositor)
│   │   │   ├── content/        # Content script overlays (laser, spotlight, keystroke HUD, privacy blur)
│   │   │   ├── studio/         # studio.html full tab UI (Setup, Recording, Post-Studio, Library, Settings)
│   │   │   └── pip/            # Document Picture-in-Picture Mini Controller UI
│   │   └── manifest.json
│   └── web/                    # Next.js 14+ App Router Web Application
│       ├── app/
│       │   ├── (public)/       # Landing, Shared Watch Page (/watch/[id]), Help
│       │   ├── (auth)/         # Auth callbacks
│       │   └── (admin)/        # Route group /admin (A01 - A15 Dashboard screens)
│       └── ...
├── packages/
│   ├── tokens/                 # CSS Variables, Tailwind preset, typography & color scales from Figma
│   ├── ui/                     # Accessible React components mirroring Figma components + Storybook + axe
│   └── shared/                 # Common TypeScript types, zod schemas, i18n dictionaries (en/bn), API client
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .gitignore
├── AGENTS.md
└── PLAN.md
```

---

## 2. Technical Stack & Decision Records

| Layer | Selection | Rationale |
|---|---|---|
| **Monorepo Manager** | `pnpm` (workspaces) | Fast, disk-efficient, strict dependency isolation |
| **Extension Build** | Vite + CRXJS / React 18 | HMR support in MV3, modern ES module bundling |
| **Web App** | Next.js 14+ (App Router) | SSR/SSG for watch page SEO and secure API routes for admin & AI proxy |
| **UI System** | Radix UI Primitives + Tailwind CSS + Custom Tokens | WCAG 2.2 AA accessibility, exact Figma token alignment |
| **Icons** | Hugeicons Pro (Stroke Rounded, 20px) / Tabler fallback | Matches Figma design language |
| **Typography** | Inter (UI), Hind Siliguri (Bangla), JetBrains Mono (Code/Timer) | Native script legibility and precise numeric layout |
| **Storage / Sync** | IndexedDB / OPFS (Local recording buffer) + Google Drive API v3 | Safe 6+ hr recordings without RAM exhaustion |
| **Video Compositing** | Offscreen HTML5 Canvas Compositor + WebCodecs / WebM/MP4 Muxer | 60FPS fluid compositing with spring morphing |
| **Audio Mixing** | Web Audio API graph (`AudioContext`, gain nodes, analyzer) | Smooth mix of mic + tab/system audio + mic level meter |
| **Internationalization** | `i18next` + React-i18next (`en`, `bn`) | Full localization across all dialogs, tooltips, and alerts |
| **Testing** | Vitest (unit), Playwright (E2E), Axe-core (a11y) | Automated verification for WCAG and core browser interactions |

---

## 3. Design System & Token Architecture

The design tokens reside in `packages/tokens` and strictly reflect the Figma variables:
- **Default Theme:** Dark mode (soft dark gray `#1B1C21`, `#222329`, `#292A31`, never pure black `#000000`).
- **Brand Accent:** Lime `#A3E635` (hover: `#BEF264`, pressed: `#84CC16`, subtle: `#26400A`).
- **Recording Accent:** Red `#FF4D4F` with dynamic pulse animation.
- **Color Modes:** Full Dark & Light palettes with guaranteed 4.5:1 text contrast and 3:1 control boundaries.
- **Grid & Radius:** 4px spacing scale (0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64), radius tokens (`xs: 4px` to `2xl: 32px`, `full: 9999px`).
- **Motion Spec:** Spring physics (stiffness 260, damping 26, mass 1), standard cubic-bezier transitions, respecting `prefers-reduced-motion` and user setting.

---

## 4. Phase Delivery Checklist

### Phase 0: Foundations (Completed)
- [x] Initialize pnpm workspace configuration (`pnpm-workspace.yaml`, root `package.json`, `.npmrc`)
- [x] Configure TypeScript configs (`tsconfig.base.json`)
- [x] Setup `packages/tokens` with Dark/Light CSS variables, Tailwind preset, and font declarations
- [x] Setup `packages/shared` with core types, zod schemas, and i18n resources (`en`, `bn`)
- [x] Setup `packages/ui` with Radix primitives, Tailwind, Storybook stories, and WCAG AA accessible components
- [x] Implement initial foundational UI components: `Button`, `IconButton`, `Input`, `Toggle`, `Modal`, `Toast`, `StatusChip`, `RecordButton`
- [x] Setup `apps/extension` skeleton with Vite, CRXJS manifest V3, service worker, offscreen document, content script, and `studio.html` entry point
- [x] Setup `apps/web` skeleton with Next.js 14 App Router, Tailwind preset, and responsive landing
- [x] Verify full monorepo build, Dark/Light theme switching, and type checks passing cleanly (0 errors)

### Phase 1: Core Recording (Completed)
- [x] Setup page UI: Source selection (screen, window, tab), 4 layouts (Screen Only, Camera Only, Screen + Bubble, 50/50 Split)
- [x] Camera and mic device enumeration and live selection
- [x] Web Audio mixing graph with real-time mic level meter (`AudioMixer`)
- [x] Canvas compositor inside offscreen document / studio with spring morphing between layout transitions (`VideoCompositor`)
- [x] Video capture pipeline: `getDisplayMedia` up to 3840×2160 @ 60 FPS
- [x] Countdown timer (3-2-1), recording state machine (Idle, Recording, Paused, Stopped)
- [x] Document Picture-in-Picture Mini Controller with recording controls & mic mute toggle (`MiniController`)
- [x] Chunked recording write pipeline to IndexedDB for crash resiliency (`RecordingStorage`)
- [x] Post-Studio editor: Preview player, timeline trimmer (`TimelineTrimmer`), local export (instant WebM & 4K `mp4-muxer`), progress modal
- [x] Verified crash-recovery prompt, chunk-ordering tests, and 4K compositor math passing cleanly

### Phase 2: Live Tools and Cinematic Effects (Completed)
- [x] Content script overlay manager for target tabs (`InTabOverlayManager`)
- [x] Auto-zoom and pan on click (smooth 2x spring focus, respects reduced motion)
- [x] Click ripple visual feedback effect (brand lime expanding pulse)
- [x] Cursor spotlight (`Alt+S`) with dim background and radial gradient mask
- [x] Laser pen tool (`Alt+L`) with 2-second decay trail on Canvas 2D
- [x] Keystroke HUD (`Alt+K`) displaying modifier and key combinations
- [x] Privacy shield blur (`Alt+P`) draggable frosted glass region
- [x] Floating Tool Palette (`ToolPalette`) & Teleprompter (`Teleprompter`) with autoscroll, speed slider, and Bengali script support in Hind Siliguri
- [x] Screen 22: Long recording advisory warning for recordings exceeding 30 minutes
- [x] Unit tests passing with happy-dom (13/13 tests green)

### Phase 3: Accounts and Onboarding (Next Phase)
- [ ] Authentication flows: Sign Up, form validation, email verification code
- [ ] Onboarding wizard (Step 1 Setup -> Step 2 Google Drive -> Step 3 Permissions)
- [ ] Permission request UI with denial recovery guidance
- [ ] Sign In, Forgot Password, Reset Password with show/hide password
- [ ] User Profile, Security (Password, 2FA, Active Sessions), Plan & Billing cards, Delete Account confirm modal
- [ ] Session persistence across extension restarts and browser restarts

### Phase 4: Google Drive Storage & Sharing (Screens 5, 24–45)
- [ ] Google OAuth 2.0 via `chrome.identity.launchWebAuthFlow` (`drive.file` scope)
- [ ] Auto-creation of `VerseStudio` dedicated root folder in Drive
- [ ] 8MB chunked resumable upload engine with exponential backoff retry and cancel
- [ ] Quota detection (`about.get`) with "Google Drive Full" error handling
- [ ] Instant link sharing ("anyone with link can view"), QR code generation, clipboard copy
- [ ] Library UI: Search, filter, Card States (Shared, Private, Uploading, Failed), Rename, Move to Trash with undo toast
- [ ] Network interruption recovery test (2GB upload resume)

### Phase 5: Bilingual AI Studio (Screens 19, 22–24)
- [ ] Real-time audio streaming to speech-to-text service
- [ ] Live Bengali speech to English subtitle overlay (bilingual and English-only modes)
- [ ] Post-recording AI English neural voice dubbing and mixed audio (20% Bangla / 80% English)
- [ ] Multi-audio track selector in Post-Studio
- [ ] `.srt` / `.vtt` subtitle export
- [ ] One-click Markdown step-by-step tutorial generator from click events + transcript
- [ ] AI quota tracker and plan-tier enforcement (Free 30m / Pro 300m)

### Phase 6: Phone Camera Integration (Screens 14–16)
- [ ] WebRTC peer connection pipeline
- [ ] Studio QR code pairing generator and signaling handshake
- [ ] Mobile companion web page (`/mobile-camera`) with start/stop stream controls
- [ ] Real-time ingestion into Camera Bubble at 1080p 30FPS with auto-reconnect

### Phase 7: App & Studio Settings (Screens 42–49)
- [ ] General: Language toggle (EN / BN), Theme (Dark / Light), Reduced Motion toggle
- [ ] Recording: Resolution (4K, 1440p, 1080p), FPS (60, 30), Video format, audio bitrate, safe chunking
- [ ] Effects & Shortcuts: Remappable global hotkeys with collision detection
- [ ] Voice & AI: Subtitle language preferences, voice persona selection
- [ ] Google Drive settings: Account status, storage usage bar, disconnect modal

### Phase 8: Web Application & Admin Dashboard (Screens 40, 41, A01–A15)
- [ ] Shared watch page (`/watch/[id]`): Google Drive stream integration, caption player, "Hosted on Google Drive" badge
- [ ] Link Unavailable / Protected state handling
- [ ] Admin Dashboard (`/admin`):
  - [ ] A01: Overview metrics & KPI cards
  - [ ] A02–A06: User management, bulk actions, user details, suspend modal
  - [ ] A07–A09: Recordings directory, moderation controls, share-page block
  - [ ] A10–A11: Plans & billing overview, AI usage & cost calculator
  - [ ] A12–A15: Drive limits, audit logs, admin roles & invites (2FA enforced)

### Phase 9: Hardening, Polish & Chrome Web Store Release
- [ ] Performance audit: 60 FPS compositor loop memory profiling (zero leaks)
- [ ] Security audit: Strict CSP, sanitized content script communications, zero exposed secrets
- [ ] WCAG 2.2 AA audit with NVDA / VoiceOver screen readers
- [ ] Manifest V3 store package preparation, icons, permission justifications, privacy policy

---

## 5. Known Platform Risks & Mitigation Strategies

1. **Entire Screen Capture vs Floating Overlays:**
   - *Risk:* Document PiP or desktop overlay windows may be captured if recording full desktop.
   - *Mitigation:* Explicitly query display surface (`displaySurface === 'monitor'`), warn user, and provide recommended Window/Tab capture modes where overlays can be isolated or excluded.
2. **Audio Track Switching on Shared Google Drive Page:**
   - *Risk:* A single MP4 in Google Drive has one active audio track in default web players.
   - *Mitigation:* Post-studio produces a primary mixed master for Drive. In Post-Studio and Web App, if multi-track is selected, companion tracks/SRTs are saved to Drive file properties or sidecar files.
3. **4K 60FPS Performance on Moderate GPUs:**
   - *Risk:* Canvas 2D / WebGL compositor dropping frames under high system load.
   - *Mitigation:* Real-time FPS monitoring; gracefully prompt to switch to 1440p or 30FPS if frame drop exceeds 5% threshold.
4. **Google Drive API v3 Token Lifecycle:**
   - *Risk:* Token expiry during long uploads.
   - *Mitigation:* Background token renewal worker proactively refreshes auth credentials before resumable chunk uploads.

---

## 6. Open Architecture Questions (To Align Prior to Phase 3)

1. **Backend Choice:** Supabase (Postgres + Auth + RLS + Edge Functions) is recommended for fast development and secure row-level security.
2. **AI Provider & Key Management:** Hybrid architecture: Server-side managed keys with quota tracking (Free 30m / Pro 300m) with an option for users to supply their own Gemini / ElevenLabs keys in Settings.
3. **Billing Gateway:** Merchant of Record solution (Lemon Squeezy / Paddle) to support global payment processing seamlessly.
4. **Share Domain:** Default placeholder `versestudio.app` mapped to Next.js watch route.
5. **Google Cloud Project & Verification:** Scopes restricted strictly to `drive.file` to simplify verification and guarantee user data privacy.
