# Audit Report: 04 Design System Fidelity

## 1. Token Comparison: Figma Design vs Codebase

Tokens extracted directly from the Figma document (`PNUNAZJ5hSATGhVrsEQBWr`, node `0:1` *Foundations / Specimen*) compared against `packages/tokens/src/tokens.css` and `packages/tokens/src/tailwind-preset.ts`.

### 1.1 Color Tokens (Dark & Light Modes)

| Token Name | Figma Dark | Code Dark | Match? | Figma Light | Code Light | Match? |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `bg/canvas` | `#1B1C21` | `#1B1C21` | **YES** | `#F5F5F7` | `#F5F5F7` | **YES** |
| `bg/surface` | `#222329` | `#222329` | **YES** | `#FFFFFF` | `#FFFFFF` | **YES** |
| `bg/elevated` | `#292A31` | `#292A31` | **YES** | `#FFFFFF` | `#FFFFFF` | **YES** |
| `bg/hover` | `#2F3037` | `#2F3037` | **YES** | `#E9EAEE` | `#E9EAEE` | **YES** |
| `bg/active` | `#383942` | `#383942` | **YES** | `#D3D4DB` | `#D3D4DB` | **YES** |
| `text/primary` | `#F5F5F7` | `#F5F5F7` | **YES** | `#1B1C21` | `#1B1C21` | **YES** |
| `text/secondary` | `#B9BAC4` | `#B9BAC4` | **YES** | `#4A4B55` | `#4A4B55` | **YES** |
| `text/tertiary` | `#A3A4B0` | `#A3A4B0` | **YES** | `#6E6F7B` | `#6E6F7B` | **YES** |
| `text/disabled` | `#6E6F7B` | `#6E6F7B` | **YES** | `#B9BAC4` | `#B9BAC4` | **YES** |
| `text/on-brand` | `#1B1C21` | `#1B1C21` | **YES** | `#1B1C21` | `#1B1C21` | **YES** |
| `border/subtle` | `#2F3037` | `#2F3037` | **YES** | `#E9EAEE` | `#E9EAEE` | **YES** |
| `border/default` | `#383942` | `#383942` | **YES** | `#D3D4DB` | `#D3D4DB` | **YES** |
| `border/strong` | `#4A4B55` | `#4A4B55` | **YES** | `#B9BAC4` | `#B9BAC4` | **YES** |
| `border/input` | `#6E6F7B` | `#6E6F7B` | **YES** | `#6E6F7B` | `#6E6F7B` | **YES** |
| `border/focus` | `#A3E635` | `#A3E635` | **YES** | `#65A30D` | `#65A30D` | **YES** |
| `brand/default` | `#A3E635` | `#A3E635` | **YES** | `#84CC16` | `#84CC16` | **YES** |
| `brand/hover` | `#BEF264` | `#BEF264` | **YES** | `#A3E635` | `#A3E635` | **YES** |
| `brand/pressed` | `#84CC16` | `#84CC16` | **YES** | `#65A30D` | `#65A30D` | **YES** |
| `brand/subtle` | `#26400A` | `#26400A` | **YES** | `#F7FEE7` | `#F7FEE7` | **YES** |
| `record/default` | `#FF4D4F` | `#FF4D4F` | **YES** | `#E5383B` | `#E5383B` | **YES** |
| `record/subtle` | `#4A1517` | `#450A0A` | **DEVIATES** (`#450A0A` vs `#4A1517`) | `#FEF2F2` | `#FEF2F2` | **YES** |
| `danger/default` | `#CF3235` | `#CF3235` | **YES** | `#CF3235` | `#CF3235` | **YES** |
| `danger/hover` | `#D83538` | `#D83538` | **YES** | `#D83538` | `#D83538` | **YES** |
| `danger/pressed` | `#BA2A2D` | `#BA2A2D` | **YES** | `#BA2A2D` | `#BA2A2D` | **YES** |
| `success/default` | `#22C55E` | `#22C55E` | **YES** | `#16A34A` | `#16A34A` | **YES** |
| `success/subtle` | `#0F3A1F` | `#052E16` | **DEVIATES** (`#052E16` vs `#0F3A1F`) | `#F0FDF4` | `#F0FDF4` | **YES** |
| `warning/default` | `#F59E0B` | `#F59E0B` | **YES** | `#D97706` | `#D97706` | **YES** |
| `warning/subtle` | `#3F2A08` | `#451A03` | **DEVIATES** (`#451A03` vs `#3F2A08`) | `#FFFBEB` | `#FFFBEB` | **YES** |
| `error/default` | `#FF6B6B` | `#FF6B6B` | **YES** | `#E5383B` | `#E5383B` | **YES** |
| `error/subtle` | `#4A1517` | `#450A0A` | **DEVIATES** (`#450A0A` vs `#4A1517`) | `#FEF2F2` | `#FEF2F2` | **YES** |
| `accent/laser` | `#22D3EE` | `#22D3EE` | **YES** | `#06B6D4` | `#06B6D4` | **YES** |

*Key Findings on Color Tokens:*
- **Dark Theme:** Soft dark gray foundation verified. Canvas is `#1B1C21` and Surface is `#222329` (never pure `#000000`).
- **Brand Colors:** Exact Lime `#A3E635` (Dark) and `#84CC16` (Light), with `#1B1C21` text on brand.
- **Danger Contrast:** `#CF3235` with pure white text achieves **4.64:1** contrast ratio (exceeds WCAG 4.5:1 minimum).
- **Controls Contrast:** Form controls use `border/input` `#6E6F7B`, delivering **3.2:1** contrast against surface backgrounds.
- **Subtle Background Deviations:** Dark subtle tokens (`record/subtle`, `success/subtle`, `warning/subtle`, `error/subtle`) in code use Tailwind 950 steps (`#450A0A`, `#052E16`, `#451A03`) rather than the exact Figma swatch hex codes (`#4A1517`, `#0F3A1F`, `#3F2A08`).

---

### 1.2 Spacing, Radius, and Motion

| Dimension | Figma Specification | Code Implementation | Match? |
| :--- | :--- | :--- | :---: |
| **Spacing Grid** | 4px base: 0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64 px | `--space-0` through `--space-16` (0px to 64px) | **YES** |
| **Corner Radius** | none (0), xs (4px), sm (8px), md (12px), lg (16px), xl (24px), 2xl (32px), full (9999px) | `--radius-none` to `--radius-full` in `tokens.css` | **YES** |
| **Focus Ring** | 2px outside ring using `text/primary` (`#F5F5F7` on dark) | `--focus-ring: 0 0 0 2px var(--color-bg-canvas), 0 0 0 4px var(--color-text-primary)` | **YES** |
| **Motion Durations** | 100ms, 150ms, 250ms, 400ms, 500ms (instant, fast, base, slow, layout-morph) | `--duration-instant` (0.10s) through `--duration-morph` (0.50s) | **YES** |
| **Motion Easings** | Standard `cubic-bezier(.2,0,0,1)`, Out `(0,0,.2,1)`, In `(.4,0,1,1)` | `--ease-standard`, `--ease-out`, `--ease-in` | **YES** |
| **Layout Morph Spring** | Stiffness 260, damping 26, mass 1 | Implemented in `VideoCompositor` layout transitions | **YES** |

---

### 1.3 Font Loading Verification (CRITICAL FINDING)
* **Design Requirement:** Inter (UI), Hind Siliguri (Bangla), JetBrains Mono (timer, code).
* **Code Implementation:** `tokens.css` imports fonts via remote Google Fonts URL:
  `@import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:...&family=Inter:...&family=JetBrains+Mono:...');`
* **Audit Finding:** **NO local font files (`.woff2`, `.ttf`) are bundled within the Chrome extension (`apps/extension`).**
  - In offline environments or under strict Manifest V3 Content Security Policies blocking remote font stylesheets, the extension will **silently fall back to system fonts** (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`).
  - Bengali text falls back to generic system sans-serif which may cause rendering and conjunct clipping issues.

---

## 2. Hardcoded Values Outside Token Files

### 2.1 Raw Hex Colors
1. `apps/extension/src/recording/compositor.ts`: Lines 190, 204, 218, 244, 276, 313, 342 hardcode `#1B1C21`, `#151619`, `#121316`, `#222329`. (Canvas 2D contexts cannot parse raw CSS `var(--...)` without conversion).
2. `apps/extension/src/studio/StudioApp.tsx`: Lines 426–465 hardcode `#222329`, `#1B1C21`, `#383942`, `#A3E635`, `#F5F5F7`, `#B9BAC4`, `#292A31` in canvas fallback drawings.
3. `packages/ui/src/components/WallpaperSwatch/WallpaperSwatch.tsx`: Lines 19–44 hardcode hex values (`#A3E635`, `#22D3EE`, `#F59E0B`, `#A855F7`, `#222329`) inside radial gradient CSS strings.

### 2.2 Raw Font Sizes
* `RecordingCard.tsx`: Lines 108 & 114 use `text-[10px]` and `text-[11px]` instead of tokenized `font-caption` (12px).
* `Chart.tsx`: Lines 124, 174, 183 use `text-[10px]`.
* `ShareLinkCard.tsx`: Line 186 uses `text-[11px]`.
* `SettingsModal.tsx`: Lines 255, 602, 606, 636, 666 use `text-[10px]` and `text-[11px]`.
* `StudioApp.tsx`: Lines 971, 1049, 1064, 1086, 1315 use `text-[11px]`.
* `OnboardingModal.tsx`: Lines 256, 332, 354, 376, 427 use `text-[11px]`.

### 2.3 Raw Radii & Spacing in Injected Overlays
* `apps/extension/src/recording/miniController.ts`: Lines 93–141 inject raw inline CSS (`padding: 8px 12px; border-radius: 4px; gap: 8px; border-radius: 6px;`).
* `apps/extension/src/content/overlayManager.ts`: Lines 212–266 inject raw inline CSS (`border-radius: 12px; padding: 8px 16px;`).

---

## 3. Component Hierarchy and Reusability

| Component | Status | Location / Implementation |
| :--- | :---: | :--- |
| **Button & Button Small** | Reusable | `packages/ui/src/components/Button/Button.tsx` (all variants: primary, secondary, ghost, danger) |
| **IconButton** | Reusable | `packages/ui/src/components/IconButton/IconButton.tsx` (enforces `aria-label`) |
| **Toggle** | Reusable | `packages/ui/src/components/Toggle/Toggle.tsx` (Radix Switch primitive) |
| **Slider** | Reusable | `packages/ui/src/components/Slider/Slider.tsx` (Radix Slider primitive) |
| **Tabs & Tab Group** | Reusable | `packages/ui/src/components/Tabs/Tabs.tsx` (Radix Tabs primitive) |
| **Tooltip** | Reusable | `packages/ui/src/components/Tooltip/Tooltip.tsx` (Radix Tooltip primitive) |
| **Toast** | Reusable | `packages/ui/src/components/Toast/Toast.tsx` |
| **Input** | Reusable | `packages/ui/src/components/Input/Input.tsx` (with `aria-describedby` and error text) |
| **Select** | Reusable | `packages/ui/src/components/Select/Select.tsx` |
| **Checkbox** | Reusable | `packages/ui/src/components/Checkbox/Checkbox.tsx` (supports indeterminate) |
| **Modal** | Reusable | `packages/ui/src/components/Modal/Modal.tsx` (Confirm, Danger, Progress, Error) |
| **Layout Switcher** | **Deviates** | Not an isolated component in `packages/ui`; implemented inline in `StudioApp.tsx` (lines 848–877) |
| **Camera Bubble** | **Deviates** | Rendered directly onto the 2D Canvas compositor in `compositor.ts`, no standalone React component |
| **Mini Controller** | **Deviates** | Rendered as raw HTML string template in `miniController.ts` for Document PiP, not a reusable React component |

---

## 4. Iconography Audit
* **Figma Specification:** Hugeicons Pro (Stroke Rounded, 20px default).
* **Code Implementation:** `@hugeicons/core-free-icons` and `@hugeicons/react` via `HugeIcon.tsx`.
* **Discrepancy:** The build uses the **Free** icon set (`@hugeicons/core-free-icons`) rather than Hugeicons **Pro**. While icon geometry and visual stroke rounded styling generally match, some specialized Pro glyphs fall back to approximate free icons.

