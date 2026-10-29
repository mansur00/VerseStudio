/**
 * VerseStudio Extension — Environment Configuration
 * Values are injected at build time by Vite.
 */

export const getApiBaseUrl = (): string => {
  const envUrl =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_WEB_BASE_URL) ||
    (typeof process !== 'undefined' && process.env && (process.env.VITE_API_BASE_URL || process.env.API_BASE_URL)) ||
    '';
  return envUrl.trim().replace(/\/+$/, '');
};

export const getWebBaseUrl = (): string => {
  const envUrl =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_WEB_BASE_URL) ||
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
    (typeof process !== 'undefined' && process.env && (process.env.VITE_WEB_BASE_URL || process.env.WEB_BASE_URL)) ||
    '';
  return envUrl.trim().replace(/\/+$/, '');
};

export const getMobileStreamBaseUrl = (): string => {
  const base = getWebBaseUrl();
  return base ? `${base}/mobile-camera` : '';
};

export const getWatchBaseUrl = (): string => {
  const base = getWebBaseUrl();
  return base ? `${base}/watch` : '';
};

