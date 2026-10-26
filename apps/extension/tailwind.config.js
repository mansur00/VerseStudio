import tailwindPreset from '@verse-studio/tokens/tailwind';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './studio.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  presets: [tailwindPreset],
  theme: {
    extend: {},
  },
  plugins: [],
};
