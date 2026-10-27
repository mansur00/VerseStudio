# VerseStudio 4K Pro — Chrome Web Store Listing & Justifications

## 1. Product Metadata

- **Extension Name:** VerseStudio 4K Pro
- **Short Name:** VerseStudio
- **Version:** 1.0.0
- **Category:** Productivity / Video & Audio Recording
- **Primary Language:** English (`en`), Bengali (`bn`)
- **Developer / Support Email:** support@versestudio.app
- **Official Website:** https://versestudio.app

---

## 2. Store Copy

### Short Description (128 / 132 characters)
> Studio-grade 4K 60FPS screen-recording with bilingual AI voice, Bangla-to-English subtitles, and direct Google Drive cloud sync.

### Detailed Description (Markdown)
```markdown
VerseStudio 4K Pro is an ultra high-performance, studio-grade screen recording extension designed for content creators, software engineers, educators, and teams. Record your display, application window, or browser tab in pristine up to 3840×2160 (4K) at 60 FPS with round draggable camera bubbles, real-time live presenter tools, and groundbreaking bilingual AI.

⚡ KEY HIGHLIGHTS:

🎥 4K 60FPS High-Definition Canvas Compositor
• Record in true 4K resolution (3840×2160) at up to 60 FPS.
• Multiple layout modes: Screen Only, Camera Only, Screen + Round Camera Bubble, and 50/50 Split with smooth spring-physics transitions.
• Draggable camera bubble with phone camera WebRTC pairing support.

🧠 Bilingual AI Subtitles & Voice Studio
• Real-time Bangla speech-to-English live subtitles overlay.
• Post-recording AI English neural voice dubbing and 20/80 ducking mixed audio.
• Instant subtitle export (.SRT and .VTT).
• Automatic step-by-step tutorial guide generator (.MD) compiled from click events and speech transcripts.

☁️ Direct Google Drive Cloud Sync (BYOS)
• Bring Your Own Storage (BYOS): Recordings upload straight to your personal Google Drive in your dedicated "VerseStudio" folder.
• Instant share links ("anyone with link can view") and scannable QR codes.
• Zero platform video storage limits or subscription lock-ins.

🛠️ Live Presenter Tools & Hotkeys
• Laser Pen with 2-second auto-fade (`Alt+L`).
• Spotlight cursor focus (`Alt+S`).
• Keystroke HUD (`Alt+K`).
• Privacy Shield blur (`Alt+P`).
• Auto-zoom and pan on click (`Alt+Z`).
• Bilingual teleprompter with speed controls and current-line highlight (`Alt+T`).

🔒 Crash-Resilient Architecture
• Recorded data is chunked and written continuously to IndexedDB / OPFS.
• Survives tab crashes, power outages, and accidental closures with 100% session recovery.
```

---

## 3. Chrome Web Store Permission Justifications

Each requested permission is strictly required for core recording and cloud synchronization functions:

| Permission | Technical Requirement & Justification |
| :--- | :--- |
| `storage` | Stores user studio preferences (layout, resolution, shortcuts), auth state tokens, and local library metadata. |
| `unlimitedStorage` | Enables persistent chunk buffering for up to 6-hour 4K60 video recordings in IndexedDB/OPFS without browser storage quota eviction. |
| `offscreen` | Powers the 4K 60FPS canvas compositor loop, Web Audio mixer graph, and background webm/mp4-muxer operations in an offscreen document while keeping the service worker lean. |
| `identity` | Required for `chrome.identity.launchWebAuthFlow` to authenticate with Google OAuth 2.0 under the minimal `drive.file` scope. |
| `activeTab` | Allows the user to toggle live tools (laser pen, spotlight, privacy blur) on the currently selected presentation tab when activated. |
| `scripting` | Programmatically injects presentation overlay content scripts on demand when the user enables spotlight or laser tools. |
| `alarms` | Triggers background Google Drive chunk upload retry checks, quota status updates, and session heartbeat timers. |
| `tabCapture` | Captures high-definition audio and video streams from active browser tabs. |
| `desktopCapture` *(Optional)* | Prompts user to select an entire screen, application window, or tab for 4K 60FPS capture. |

---

## 4. Single Purpose Declaration & Privacy Compliance

- **Single Purpose:** Screen recording and studio presentation with cloud synchronization to user-owned Google Drive.
- **Remote Code Policy:** VerseStudio bundles 100% of its application logic, scripts, styles, and assets locally. No remote scripts (`eval`, remote script tags, or dynamic code execution) are utilized.
- **Data Minimization:** No video content, keystroke logs, or screen captures are sent to external proprietary servers. Only user-consented AI processing (transcription/dubbing) is processed via secure serverless functions.
