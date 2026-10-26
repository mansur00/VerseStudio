/**
 * VerseStudio Tailwind CSS Configuration Preset
 * Extracted directly from Figma Tokens
 */

export const verseTokens = {
  colors: {
    bg: {
      canvas: 'var(--color-bg-canvas)',
      surface: 'var(--color-bg-surface)',
      elevated: 'var(--color-bg-elevated)',
      hover: 'var(--color-bg-hover)',
      active: 'var(--color-bg-active)',
    },
    text: {
      primary: 'var(--color-text-primary)',
      secondary: 'var(--color-text-secondary)',
      tertiary: 'var(--color-text-tertiary)',
      disabled: 'var(--color-text-disabled)',
      'on-brand': 'var(--color-text-on-brand)',
    },
    border: {
      subtle: 'var(--color-border-subtle)',
      default: 'var(--color-border-default)',
      strong: 'var(--color-border-strong)',
      input: 'var(--color-border-input)',
      focus: 'var(--color-border-focus)',
    },
    brand: {
      DEFAULT: 'var(--color-brand-default)',
      hover: 'var(--color-brand-hover)',
      pressed: 'var(--color-brand-pressed)',
      subtle: 'var(--color-brand-subtle)',
    },
    record: {
      DEFAULT: 'var(--color-record-default)',
      subtle: 'var(--color-record-subtle)',
    },
    danger: {
      DEFAULT: 'var(--color-danger-default)',
      hover: 'var(--color-danger-hover)',
      pressed: 'var(--color-danger-pressed)',
      subtle: 'var(--color-danger-subtle)',
    },
    success: {
      DEFAULT: 'var(--color-success-default)',
      subtle: 'var(--color-success-subtle)',
    },
    warning: {
      DEFAULT: 'var(--color-warning-default)',
      subtle: 'var(--color-warning-subtle)',
    },
    error: {
      DEFAULT: 'var(--color-error-default)',
      subtle: 'var(--color-error-subtle)',
    },
    accent: {
      laser: 'var(--color-accent-laser)',
    },
  },
  spacing: {
    '0': 'var(--space-0)',
    '1': 'var(--space-1)',
    '2': 'var(--space-2)',
    '3': 'var(--space-3)',
    '4': 'var(--space-4)',
    '5': 'var(--space-5)',
    '6': 'var(--space-6)',
    '8': 'var(--space-8)',
    '10': 'var(--space-10)',
    '12': 'var(--space-12)',
    '16': 'var(--space-16)',
  },
  borderRadius: {
    none: 'var(--radius-none)',
    xs: 'var(--radius-xs)',
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
    xl: 'var(--radius-xl)',
    '2xl': 'var(--radius-2xl)',
    full: 'var(--radius-full)',
  },
  fontFamily: {
    sans: ['var(--font-sans)', 'Inter', 'sans-serif'],
    bangla: ['var(--font-bangla)', 'Hind Siliguri', 'sans-serif'],
    mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
  },
  boxShadow: {
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)',
    xl: 'var(--shadow-xl)',
    'glow-brand': 'var(--glow-brand)',
    'glow-record': 'var(--glow-record)',
  },
  transitionDuration: {
    instant: 'var(--duration-instant)',
    fast: 'var(--duration-fast)',
    base: 'var(--duration-base)',
    slow: 'var(--duration-slow)',
    morph: 'var(--duration-morph)',
  },
  transitionTimingFunction: {
    standard: 'var(--ease-standard)',
    out: 'var(--ease-out)',
    in: 'var(--ease-in)',
  },
};

export const tailwindPreset = {
  theme: {
    extend: verseTokens,
  },
};

export default tailwindPreset;
