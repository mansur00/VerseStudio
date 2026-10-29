/**
 * VerseStudio 4K Pro — Official Google Drive v3 Specification Mock Server
 * Implements:
 * - Resumable Upload Session Initiation (POST ...?uploadType=resumable)
 * - Chunked Upload with Content-Range (PUT sessionUri)
 * - 308 Resume Incomplete with Range header
 * - Network cut simulation & query upload status (PUT with bytes * / total)
 * - Storage Quota (about.get)
 * - File Trash & Rename (PATCH ... / files / {id})
 * - Permissions (POST ... / permissions)
 */

import http from 'http';

export interface FakeDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  parents?: string[];
  trashed: boolean;
  webViewLink: string;
}

export class FakeDriveServer {
  private server: http.Server | null = null;
  public port = 0;
  public baseUrl = '';

  public quota = {
    limitBytes: 15 * 1024 * 1024 * 1024,
    usageBytes: 5 * 1024 * 1024 * 1024,
  };

  public files: Map<string, FakeDriveFile> = new Map();
  public uploadSessions: Map<
    string,
    {
      id: string;
      name: string;
      totalBytes: number;
      receivedBytes: number;
      buffer: Buffer;
      simulateCutAtByte?: number;
    }
  > = new Map();

  constructor() {
    this.reset();
  }

  public reset() {
    this.files.clear();
    this.uploadSessions.clear();
    // Pre-seed VerseStudio app folder
    this.files.set('folder_versestudio_root', {
      id: 'folder_versestudio_root',
      name: 'VerseStudio',
      mimeType: 'application/vnd.google-apps.folder',
      size: 0,
      trashed: false,
      webViewLink: 'https://drive.google.com/drive/folders/folder_versestudio_root',
    });
  }

  public async start(): Promise<string> {
    return new Promise((resolve) => {
      this.server = http.createServer(async (req, res) => {
        const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
        const pathname = url.pathname;
        const method = req.method || 'GET';

        // 1. Storage Quota: GET /drive/v3/about?fields=storageQuota
        if (pathname === '/drive/v3/about') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              storageQuota: {
                limit: this.quota.limitBytes.toString(),
                usage: this.quota.usageBytes.toString(),
                usageInDrive: this.quota.usageBytes.toString(),
                usageInDriveTrash: '0',
              },
            })
          );
          return;
        }

        // 2. Query Files: GET /drive/v3/files
        if (pathname === '/drive/v3/files' && method === 'GET') {
          const q = url.searchParams.get('q') || '';
          const matchedFiles = Array.from(this.files.values()).filter((f) => {
            if (f.trashed) return false;
            if (q.includes("name = 'VerseStudio'") && f.name !== 'VerseStudio') return false;
            return true;
          });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ files: matchedFiles }));
          return;
        }

        // 3. Create File/Folder: POST /drive/v3/files
        if (pathname === '/drive/v3/files' && method === 'POST') {
          let body = '';
          req.on('data', (c) => (body += c));
          req.on('end', () => {
            const data = JSON.parse(body || '{}');
            const fileId = 'file_' + Math.random().toString(36).substring(2, 9);
            const file: FakeDriveFile = {
              id: fileId,
              name: data.name || 'Untitled',
              mimeType: data.mimeType || 'application/octet-stream',
              size: 0,
              parents: data.parents,
              trashed: false,
              webViewLink: `https://drive.google.com/file/d/${fileId}/view`,
            };
            this.files.set(fileId, file);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(file));
          });
          return;
        }

        // 4. Initiate Resumable Upload: POST /upload/drive/v3/files?uploadType=resumable
        if (pathname === '/upload/drive/v3/files' && method === 'POST') {
          let body = '';
          req.on('data', (c) => (body += c));
          req.on('end', () => {
            const data = JSON.parse(body || '{}');
            const totalBytes = parseInt(req.headers['x-upload-content-length'] as string || '0', 10);
            const sessionId = 'session_' + Math.random().toString(36).substring(2, 10);

            this.uploadSessions.set(sessionId, {
              id: sessionId,
              name: data.name || 'Untitled Video',
              totalBytes,
              receivedBytes: 0,
              buffer: Buffer.alloc(0),
            });

            res.writeHead(200, {
              Location: `${this.baseUrl}/upload/session/${sessionId}`,
              'Content-Type': 'application/json',
            });
            res.end(JSON.stringify({ success: true }));
          });
          return;
        }

        // 5. Chunk Upload & Resume Query: PUT /upload/session/{sessionId}
        if (pathname.startsWith('/upload/session/') && method === 'PUT') {
          const sessionId = pathname.split('/').pop() || '';
          const session = this.uploadSessions.get(sessionId);
          if (!session) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Upload session not found' }));
            return;
          }

          const contentRange = req.headers['content-range'] as string || '';

          // Case A: Resume check query (Content-Range: bytes */total)
          if (contentRange.startsWith('bytes */')) {
            if (session.receivedBytes < session.totalBytes) {
              res.writeHead(308, {
                Range: `bytes=0-${session.receivedBytes - 1}`,
              });
              res.end();
            } else {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ id: 'file_' + sessionId, name: session.name }));
            }
            return;
          }

          // Case B: Uploading chunk
          const match = contentRange.match(/bytes\s+(\d+)-(\d+)\/(\d+)/);
          if (!match) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid Content-Range header' }));
            return;
          }

          const total = parseInt(match[3], 10);

          const chunks: Buffer[] = [];
          req.on('data', (chunk) => {
            chunks.push(chunk);

            // Simulate network cut if configured
            if (session.simulateCutAtByte && session.receivedBytes + chunk.length >= session.simulateCutAtByte) {
              session.simulateCutAtByte = undefined; // Fire cut once
              req.destroy(new Error('Simulated network disruption mid-upload'));
            }
          });

          req.on('end', () => {
            const uploadedChunk = Buffer.concat(chunks);
            session.buffer = Buffer.concat([session.buffer, uploadedChunk]);
            session.receivedBytes = session.buffer.length;

            if (session.receivedBytes < total) {
              // Respond with 308 Resume Incomplete
              res.writeHead(308, {
                Range: `bytes=0-${session.receivedBytes - 1}`,
              });
              res.end();
            } else {
              // Completed upload
              const finalFileId = 'drv_' + Math.random().toString(36).substring(2, 10);
              const file: FakeDriveFile = {
                id: finalFileId,
                name: session.name,
                mimeType: 'video/mp4',
                size: total,
                trashed: false,
                webViewLink: `https://drive.google.com/file/d/${finalFileId}/view`,
              };
              this.files.set(finalFileId, file);

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(
                JSON.stringify({
                  id: finalFileId,
                  name: session.name,
                  webViewLink: file.webViewLink,
                })
              );
            }
          });
          return;
        }

        // 6. Permissions: POST /drive/v3/files/{id}/permissions
        if (pathname.includes('/permissions') && method === 'POST') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ id: 'perm_anyone_reader', role: 'reader', type: 'anyone' }));
          return;
        }

        // 7. Patch (Trash / Rename): PATCH /drive/v3/files/{id}
        if (pathname.startsWith('/drive/v3/files/') && method === 'PATCH') {
          const fileId = pathname.split('/')[4];
          const file = this.files.get(fileId);
          if (!file) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'File not found' }));
            return;
          }

          let body = '';
          req.on('data', (c) => (body += c));
          req.on('end', () => {
            const data = JSON.parse(body || '{}');
            if (data.trashed !== undefined) file.trashed = data.trashed;
            if (data.name) file.name = data.name;

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(file));
          });
          return;
        }

        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Endpoint not mapped' }));
      });

      this.server.listen(0, '127.0.0.1', () => {
        const addr = this.server!.address() as any;
        this.port = addr.port;
        this.baseUrl = `http://127.0.0.1:${this.port}`;
        resolve(this.baseUrl);
      });
    });
  }

  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }
}
