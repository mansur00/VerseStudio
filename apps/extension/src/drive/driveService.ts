/**
 * VerseStudio Google Drive API Client & Resumable Upload Engine
 * Strictly uses scope: https://www.googleapis.com/auth/drive.file
 * Conforms to Google Drive v3 Resumable Upload Specification with Range query resume.
 */

export interface DriveQuota {
  limitBytes: number;
  usageBytes: number;
  availableBytes: number;
}

export interface DriveUploadOptions {
  name: string;
  blob: Blob;
  folderId?: string;
  onProgress?: (progress: number, uploadedBytes: number, totalBytes: number) => void;
  signal?: AbortSignal;
}

export interface DriveUploadResult {
  fileId: string;
  name: string;
  webViewLink?: string;
  webContentLink?: string;
  shareUrl: string;
}

const CHUNK_SIZE = 8 * 1024 * 1024; // 8 MB standard Google Drive chunk size
const DRIVE_TOKEN_KEY = 'verse_studio_drive_token_v1';
const DRIVE_CLIENT_ID_KEY = 'verse_studio_google_client_id';
const FOLDER_NAME = 'VerseStudio';

export class DriveService {
  private static cachedToken: string | null = null;
  private static cachedFolderId: string | null = null;
  private static apiBase = 'https://www.googleapis.com';

  /**
   * Override API Base URL (for testing against fake Drive server)
   */
  public static setApiBase(url: string) {
    this.apiBase = url.replace(/\/+$/, '');
  }

  public static getApiBase() {
    return this.apiBase;
  }

  /**
   * Get configured Google Client ID from settings or storage
   */
  public static async getClientId(): Promise<string | null> {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const res = await new Promise<{ [key: string]: any }>((resolve) => {
        chrome.storage.local.get([DRIVE_CLIENT_ID_KEY], resolve);
      });
      if (res && res[DRIVE_CLIENT_ID_KEY]) return res[DRIVE_CLIENT_ID_KEY];
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(DRIVE_CLIENT_ID_KEY);
    }
    return null;
  }

  /**
   * Save configured Google Client ID
   */
  public static async setClientId(clientId: string): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await new Promise<void>((resolve) => {
        chrome.storage.local.set({ [DRIVE_CLIENT_ID_KEY]: clientId }, () => resolve());
      });
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(DRIVE_CLIENT_ID_KEY, clientId);
    }
  }

  /**
   * Helper to persist access token session across extension and browser storage
   */
  public static async persistSession(token: string, expiresInSeconds = 86400): Promise<void> {
    const session = {
      token,
      expiresAt: Date.now() + expiresInSeconds * 1000,
    };
    this.cachedToken = token;

    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await new Promise<void>((resolve) => {
        chrome.storage.local.set({ [DRIVE_TOKEN_KEY]: session }, () => resolve());
      });
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(DRIVE_TOKEN_KEY, JSON.stringify(session));
    }
  }

  /**
   * Acquire or restore Google OAuth 2.0 Access Token
   * Scope: Strictly https://www.googleapis.com/auth/drive.file
   */
  public static async getAccessToken(interactive = false): Promise<string> {
    if (this.cachedToken) return this.cachedToken;

    // 1. Check Chrome local storage
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const stored = await new Promise<{ token?: string; expiresAt?: number }>((resolve) => {
        chrome.storage.local.get([DRIVE_TOKEN_KEY], (res) => resolve(res[DRIVE_TOKEN_KEY] || {}));
      });

      if (stored.token && stored.expiresAt && stored.expiresAt > Date.now()) {
        this.cachedToken = stored.token;
        return stored.token;
      }
    }

    // 2. Check browser localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const storedStr = window.localStorage.getItem(DRIVE_TOKEN_KEY);
        if (storedStr) {
          const stored = JSON.parse(storedStr);
          if (stored.token && stored.expiresAt && stored.expiresAt > Date.now()) {
            this.cachedToken = stored.token;
            return stored.token;
          }
        }
      } catch {
        // Ignore parse error
      }
    }

    // 3. Interactive OAuth Flow
    if (interactive) {
      const configuredClientId = await this.getClientId();
      if (!configuredClientId || configuredClientId.includes('YOUR_GOOGLE_CLIENT_ID')) {
        throw new Error('Google Drive Client ID is not configured. Please set your Google Client ID in Settings.');
      }

      if (typeof chrome !== 'undefined' && chrome.identity && chrome.identity.launchWebAuthFlow) {
        const redirectUri = chrome.identity.getRedirectURL();
        const authUrl =
          `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${encodeURIComponent(configuredClientId)}&` +
          `response_type=token&` +
          `redirect_uri=${encodeURIComponent(redirectUri)}&` +
          `scope=${encodeURIComponent('https://www.googleapis.com/auth/drive.file')}&` +
          `prompt=consent`;

        const responseUrl = await new Promise<string>((resolve, reject) => {
          chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, (url) => {
            if (chrome.runtime.lastError || !url) {
              reject(new Error(chrome.runtime.lastError?.message || 'Google OAuth connection cancelled by user'));
            } else {
              resolve(url);
            }
          });
        });

        const params = new URLSearchParams(new URL(responseUrl).hash.substring(1));
        const token = params.get('access_token');
        const expiresIn = parseInt(params.get('expires_in') || '3600', 10);

        if (!token) {
          throw new Error('No access token returned from Google OAuth authorization');
        }

        await this.persistSession(token, expiresIn);
        return token;
      }

      throw new Error('Chrome identity API not available for Google OAuth.');
    }

    // Not interactive and no token stored: throw clear unconfigured error
    throw new Error('Google Drive is not connected. Please connect Google Drive in Settings.');
  }

  /**
   * Clear cached OAuth token on disconnect
   */
  public static async disconnect(): Promise<void> {
    this.cachedToken = null;
    this.cachedFolderId = null;
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await new Promise<void>((resolve) => {
        chrome.storage.local.remove([DRIVE_TOKEN_KEY], () => resolve());
      });
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(DRIVE_TOKEN_KEY);
    }
  }

  /**
   * Fetch user storage quota (about.get)
   */
  public static async getStorageQuota(): Promise<DriveQuota> {
    const token = await this.getAccessToken(false);

    const res = await fetch(`${this.apiBase}/drive/v3/about?fields=storageQuota`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch Google Drive storage quota: HTTP ${res.status}`);
    }

    const data = await res.json();
    const quota = data.storageQuota;

    const limitBytes = parseInt(quota.limit || '16106127360', 10); // 15 GB default
    const usageBytes = parseInt(quota.usage || '0', 10);
    const availableBytes = Math.max(0, limitBytes - usageBytes);

    return {
      limitBytes,
      usageBytes,
      availableBytes,
    };
  }

  /**
   * Find or create the dedicated 'VerseStudio' folder in Google Drive
   */
  public static async getOrCreateAppFolder(): Promise<string> {
    if (this.cachedFolderId) return this.cachedFolderId;

    const token = await this.getAccessToken(false);

    // Search for existing folder created by VerseStudio
    const query = encodeURIComponent(
      `name = '${FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
    );
    const searchRes = await fetch(
      `${this.apiBase}/drive/v3/files?q=${query}&fields=files(id,name)`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        this.cachedFolderId = data.files[0].id;
        return this.cachedFolderId!;
      }
    }

    // Create folder if not found
    const createRes = await fetch(`${this.apiBase}/drive/v3/files`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
      }),
    });

    if (!createRes.ok) {
      throw new Error(`Failed to create ${FOLDER_NAME} folder in Google Drive`);
    }

    const newFolder = await createRes.json();
    this.cachedFolderId = newFolder.id;
    return newFolder.id;
  }

  public static async uploadVideoResumable(options: DriveUploadOptions): Promise<DriveUploadResult> {
    return this.uploadFileResumable(options);
  }

  /**
   * Resumable chunked upload engine (8 MB chunks)
   * Recovers from network interruptions by querying byte status and resuming.
   */
  public static async uploadFileResumable(options: DriveUploadOptions): Promise<DriveUploadResult> {
    const { name, blob, onProgress, signal } = options;
    const token = await this.getAccessToken(false);
    const totalBytes = blob.size;

    const folderId = options.folderId || (await this.getOrCreateAppFolder());

    // Step 1: Initiate Resumable Upload Session
    const metadata = {
      name,
      mimeType: blob.type || 'video/mp4',
      parents: [folderId],
    };

    const initRes = await fetch(
      `${this.apiBase}/upload/drive/v3/files?uploadType=resumable`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Type': blob.type || 'video/mp4',
          'X-Upload-Content-Length': totalBytes.toString(),
        },
        body: JSON.stringify(metadata),
        signal,
      }
    );

    if (!initRes.ok) {
      throw new Error(`Failed to initiate Google Drive upload session: HTTP ${initRes.status}`);
    }

    const sessionUri = initRes.headers.get('Location');
    if (!sessionUri) {
      throw new Error('Google Drive upload session URI missing from response');
    }

    // Step 2: Upload Chunks with Resumption & Retry
    let uploadedBytes = 0;

    while (uploadedBytes < totalBytes) {
      if (signal?.aborted) {
        throw new Error('Upload cancelled');
      }

      const chunkEnd = Math.min(uploadedBytes + CHUNK_SIZE, totalBytes);
      const chunkBlob = blob.slice(uploadedBytes, chunkEnd);
      const contentRange = `bytes ${uploadedBytes}-${chunkEnd - 1}/${totalBytes}`;

      try {
        const chunkRes = await fetch(sessionUri, {
          method: 'PUT',
          headers: {
            'Content-Range': contentRange,
          },
          body: chunkBlob,
          signal,
        });

        if (chunkRes.status === 308) {
          // Chunk accepted, resume incomplete
          const rangeHeader = chunkRes.headers.get('Range');
          if (rangeHeader) {
            const match = rangeHeader.match(/bytes=0-(\d+)/);
            if (match) {
              uploadedBytes = parseInt(match[1], 10) + 1;
            } else {
              uploadedBytes = chunkEnd;
            }
          } else {
            uploadedBytes = chunkEnd;
          }
          const percent = Math.round((uploadedBytes / totalBytes) * 100);
          onProgress?.(percent, uploadedBytes, totalBytes);
        } else if (chunkRes.ok) {
          // Upload complete!
          const fileData = await chunkRes.json();
          onProgress?.(100, totalBytes, totalBytes);

          return {
            fileId: fileData.id,
            name: fileData.name,
            webViewLink: fileData.webViewLink || `https://drive.google.com/file/d/${fileData.id}/view`,
            shareUrl: `https://versestudio.app/watch/${fileData.id}`,
          };
        } else {
          throw new Error(`Chunk upload failed with HTTP ${chunkRes.status}`);
        }
      } catch (chunkErr: any) {
        if (signal?.aborted) throw chunkErr;

        // Query status to determine what Google Drive actually received
        try {
          const statusRes = await fetch(sessionUri, {
            method: 'PUT',
            headers: {
              'Content-Range': `bytes */${totalBytes}`,
            },
          });

          if (statusRes.status === 308) {
            const rangeHeader = statusRes.headers.get('Range');
            if (rangeHeader) {
              const match = rangeHeader.match(/bytes=0-(\d+)/);
              if (match) {
                uploadedBytes = parseInt(match[1], 10) + 1;
                continue; // Resume from last byte received by Drive
              }
            }
          } else if (statusRes.ok) {
            const fileData = await statusRes.json();
            return {
              fileId: fileData.id,
              name: fileData.name,
              webViewLink: fileData.webViewLink,
              shareUrl: `https://versestudio.app/watch/${fileData.id}`,
            };
          }
        } catch {
          // Status query also failed, rethrow original error
        }

        throw chunkErr;
      }
    }

    throw new Error('Upload reached end of stream without server completion confirmation');
  }

  /**
   * Set Google Drive file permission to "anyone with link can view"
   */
  public static async setFilePublic(fileId: string): Promise<string> {
    return this.shareFilePublicly(fileId);
  }

  public static async shareFilePublicly(fileId: string): Promise<string> {
    const token = await this.getAccessToken(false);

    const res = await fetch(`${this.apiBase}/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });

    if (!res.ok) {
      throw new Error(`Failed to set public sharing permission: HTTP ${res.status}`);
    }

    return `https://versestudio.app/watch/${fileId}`;
  }

  /**
   * Revoke public share link (make private)
   */
  public static async setFilePrivate(fileId: string, permissionId = 'anyoneWithLink'): Promise<void> {
    return this.makeFilePrivate(fileId, permissionId);
  }

  public static async makeFilePrivate(fileId: string, permissionId = 'anyoneWithLink'): Promise<void> {
    const token = await this.getAccessToken(false);

    const res = await fetch(
      `${this.apiBase}/drive/v3/files/${fileId}/permissions/${permissionId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!res.ok && res.status !== 404) {
      throw new Error(`Failed to revoke permissions: HTTP ${res.status}`);
    }
  }

  /**
   * Rename a recording in Google Drive
   */
  public static async renameFile(fileId: string, newName: string): Promise<void> {
    const token = await this.getAccessToken(false);

    const res = await fetch(`${this.apiBase}/drive/v3/files/${fileId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: newName }),
    });

    if (!res.ok) {
      throw new Error(`Failed to rename file in Google Drive: HTTP ${res.status}`);
    }
  }

  /**
   * Move file to Trash in Google Drive (Never permanently deletes from user storage)
   */
  public static async moveToTrash(fileId: string): Promise<void> {
    return this.trashFile(fileId);
  }

  public static async trashFile(fileId: string): Promise<void> {
    const token = await this.getAccessToken(false);

    const res = await fetch(`${this.apiBase}/drive/v3/files/${fileId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trashed: true }),
    });

    if (!res.ok) {
      throw new Error(`Failed to trash file in Google Drive: HTTP ${res.status}`);
    }
  }

  /**
   * Restore file from Trash in Google Drive
   */
  public static async restoreFromTrash(fileId: string): Promise<void> {
    const token = await this.getAccessToken(false);

    const res = await fetch(`${this.apiBase}/drive/v3/files/${fileId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trashed: false }),
    });

    if (!res.ok) {
      throw new Error(`Failed to restore file from trash: HTTP ${res.status}`);
    }
  }
}
