# VerseStudio 4K Pro — Copy & i18n Audit
**Date:** 2026-10-29  
**Auditor:** Independent Audit (Antigravity Senior Full-Stack Lead)  
**Target Languages:** English (`en`), Bengali (`bn`)  

---

## 1. Executive Summary

VerseStudio incorporates a bilingual translation architecture in `packages/shared/src/i18n/`, featuring strong dictionary parity between `en.ts` and `bn.ts` across common studio operations, recording controls, settings, and auth dialogs. However:
1. **The Admin Dashboard (`apps/web/src/app/admin/*`) is 100% hardcoded in English** with zero internationalization support.
2. **Numerous UI strings in `apps/extension` bypass the i18n system**, using hardcoded English strings directly in JSX.
3. **Bengali script lacks proper vertical line-height accommodation** in several components, risking typographical clipping of vowel diacritics (matras) and conjunct consonants.

---

## 2. Dictionary Parity Analysis

| Dictionary File | Total Translation Keys | Missing Keys Compared to Peer | Key Parity % |
| :--- | :--- | :--- | :--- |
| `packages/shared/src/i18n/en.ts` | 242 | 0 | **100%** |
| `packages/shared/src/i18n/bn.ts` | 243 | 0 | **100%** |

### 2.1 Dictionary Structure Coverage
The i18n dictionaries cover the following domains:
- `common`: App title, actions (Save, Cancel, Delete, Confirm, Copy, Close), status labels.
- `setup`: Source selection, layout options, camera & mic configuration.
- `recording`: Recording state, paused, stopped, time elapsed, subtitles toggle.
- `postStudio`: Trimmer labels, export buttons, Google Drive upload, AI dubbing triggers.
- `library`: Search placeholder, empty state, filter options, card actions.
- `settings`: Tab headings, resolution options, shortcut names, API key fields.
- `auth`: Sign up, sign in, verification code, onboarding step titles.

---

## 3. Hardcoded Strings Bypassing i18n

The following user-facing strings are hardcoded in English and do not reference the translation dictionaries (`t`):

### 3.1 Chrome Extension (`apps/extension/src/`)
| File & Line | Hardcoded String | Recommended i18n Key |
| :--- | :--- | :--- |
| `apps/extension/src/studio/StudioApp.tsx` L673 | `"Advisory: Recording duration has reached 30+ minutes. All chunks are continuously written to IndexedDB disk storage without RAM accumulation."` | `t.recording.longDurationAdvisory` |
| `apps/extension/src/studio/StudioApp.tsx` L704 | `"Studio Ready"` | `t.recording.ready` |
| `apps/extension/src/studio/StudioApp.tsx` L726 | `"Studio"` | `t.common.studio` |
| `apps/extension/src/studio/StudioApp.tsx` L748 | `"Library"` | `t.common.library` |
| `apps/extension/src/studio/StudioApp.tsx` L959 | `"Phone 1080p"` / `"Phone"` | `t.setup.phoneCameraBadge` |
| `apps/extension/src/studio/StudioApp.tsx` L1219 | `"Muted"` / `"Audio"` | `t.postStudio.audioState` |
| `apps/extension/src/studio/StudioApp.tsx` L1232 | `"CC On"` / `"CC Off"` | `t.postStudio.ccState` |
| `apps/extension/src/studio/StudioApp.tsx` L1316 | `"Trim:"` | `t.postStudio.trimLabel` |
| `apps/extension/src/recording/miniController.ts` L175–177 | `"🎙️ Mic"`, `"❚❚ Pause"`, `"■ Stop"` | Injected HTML strings bypass React i18n |

### 3.2 Web App & Admin Dashboard (`apps/web/src/`)
| Component / Route | Scope of Hardcoded English | Description |
| :--- | :--- | :--- |
| `apps/web/src/app/admin/layout.tsx` | All navigation items & headers | `"Overview"`, `"Users"`, `"Recordings"`, `"Moderation"`, `"Plans & Billing"`, `"AI Usage & Costs"`, `"Drive & Limits"`, `"Audit Log"`, `"Admin Settings"`, `"2FA Protected"` |
| `apps/web/src/app/admin/page.tsx` | KPI cards, charts, activity feed | All dashboard metrics, tooltips, chart legends, and recent activity logs |
| `apps/web/src/app/admin/users/page.tsx` | User management table | Table column headers, status badges, action menus, suspend confirmation dialogs |
| `apps/web/src/app/watch/[id]/page.tsx` | Watch page UI | Secondary buttons, view counter text (`"views"`), guide drawer tabs |

---

## 4. Bengali Typography & Script Rendering (Hind Siliguri)

The design specification mandates Hind Siliguri for all Bengali copy with explicit taller line heights to prevent glyph clipping:
- **Heading:** 24px font / 36px line height (`leading-9`)
- **Subtitle:** 20px font / 32px line height (`leading-8`)
- **Body:** 16px font / 26px line height (`leading-normal` or `leading-relaxed`)
- **Caption:** 14px font / 22px line height

### 4.1 Typographic Audit Findings
1. **Font Family Application:** In `packages/tokens/tokens.css` and `tailwind.preset.js`, `font-bangla` is properly mapped to `'Hind Siliguri', sans-serif`.
2. **Missing Height on Tight Utility Classes:** In `apps/extension/src/studio/StudioApp.tsx` (L693, L774) and `AuthModal.tsx`, several elements apply `leading-none` or `leading-tight` alongside `font-bangla`. 
   - *Impact:* In complex Bengali conjuncts (e.g., `স্বাগতম`, `রেকর্ডিং`, `স্টুডিও`), the upper matras (reph, ikar) and lower subjoined consonants (u-kar, ref) become visually truncated at the top or bottom boundaries of the container.
   - *Fix:* Ensure Bengali text containers never inherit `leading-none` or `leading-tight`; always enforce `leading-normal` or taller.

---

## 5. Parameter Interpolation & Pluralization

- In `packages/shared/src/i18n/index.ts`, string interpolation is implemented via basic string substitution or function calls (e.g., `formatTime(elapsedMs)`).
- For plan usage strings (e.g., `"14 of 300 minutes used"`), strings are formatted using template literals rather than an ICU-compliant pluralization library (such as `i18next` with `intl`). While functional for English, Bengali numerals and noun-classifier agreements (e.g., `১৪ মিনিট ব্যবহৃত`) should ideally use localized numerals (`১, ২, ৩...`).

