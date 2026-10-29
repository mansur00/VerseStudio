import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import baseManifest from './src/manifest.json';
import path from 'path';

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';
  const apiBaseUrl = process.env.VITE_API_BASE_URL || process.env.API_BASE_URL || '';
  const webBaseUrl = process.env.VITE_WEB_BASE_URL || process.env.WEB_BASE_URL || '';

  // Requirement 1 & 2: In production builds, mobile getUserMedia strictly requires HTTPS.
  // Fail build if localhost or non-https is configured during strict production checks.
  if (isProd && process.env.STRICT_PROD_CHECK === 'true') {
    if (!webBaseUrl) {
      throw new Error(
        '[Production Build Error] WEB_BASE_URL (or VITE_WEB_BASE_URL) must be set for production builds.'
      );
    }
    if (webBaseUrl.includes('localhost') || webBaseUrl.includes('127.0.0.1') || !webBaseUrl.startsWith('https://')) {
      throw new Error(
        `[Production Build Error] Mobile getUserMedia requires a secure HTTPS origin. Provided URL '${webBaseUrl}' is invalid for production.`
      );
    }
  }

  // Clone manifest and inject dynamic host_permissions
  const manifest = { ...baseManifest };
  const hostPermissions = [
    'https://www.googleapis.com/*',
    'https://accounts.google.com/*',
  ];
  if (apiBaseUrl && apiBaseUrl.startsWith('http')) {
    try {
      const apiOrigin = new URL(apiBaseUrl).origin + '/*';
      hostPermissions.push(apiOrigin);
    } catch {
      // Keep base host_permissions
    }
  } else {
    hostPermissions.push('https://*.versestudio.app/*');
  }
  manifest.host_permissions = hostPermissions;

  return {
    plugins: [
      react(),
      crx({ manifest }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          studio: path.resolve(__dirname, 'studio.html'),
          offscreen: path.resolve(__dirname, 'src/offscreen/offscreen.html'),
        },
      },
    },
  };
});

