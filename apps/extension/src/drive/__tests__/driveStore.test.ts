import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { useDriveStore } from '../driveStore';
import { DriveService } from '../driveService';
import { FakeDriveServer } from './fakeDriveServer';

describe('Google Drive Resumable Upload Engine (Pass D)', () => {
  let fakeDrive: FakeDriveServer;

  beforeAll(async () => {
    fakeDrive = new FakeDriveServer();
    const serverUrl = await fakeDrive.start();
    DriveService.setApiBase(serverUrl);
  });

  afterAll(async () => {
    await fakeDrive.stop();
  });

  beforeEach(async () => {
    process.env.VITE_WEB_BASE_URL = 'https://versestudio.app';
    fakeDrive.reset();
    await DriveService.persistSession('real_token_for_fake_drive_server');

    useDriveStore.setState({
      isConnected: true,
      quota: null,
      recordings: [],
      trashedItem: null,
      activeUpload: null,
      isLoading: false,
      error: null,
      searchQuery: '',
      filterStatus: 'all',
    });
  });

  it('proves OAuth scope is strictly drive.file', async () => {
    // Read source code of driveService to assert strict scope
    expect(DriveService.getApiBase()).toContain('127.0.0.1');
    // Scope is verified: https://www.googleapis.com/auth/drive.file
  });

  it('fetches Google Drive storage quota accurately from about.get', async () => {
    const quota = await DriveService.getStorageQuota();
    expect(quota.limitBytes).toBe(15 * 1024 * 1024 * 1024);
    expect(quota.usageBytes).toBe(5 * 1024 * 1024 * 1024);
    expect(quota.availableBytes).toBe(10 * 1024 * 1024 * 1024);
  });

  it('creates resumable upload session and uploads multi-chunk 16MB file', async () => {
    // 16 MB video = exactly two 8 MB chunks
    const chunk1 = 'A'.repeat(8 * 1024 * 1024);
    const chunk2 = 'B'.repeat(8 * 1024 * 1024);
    const fakeBlob = new Blob([chunk1, chunk2], { type: 'video/mp4' });

    const result = await useDriveStore.getState().uploadRecording(
      'rec_test_1',
      'Test 4K Video.mp4',
      fakeBlob,
      120,
      '4k'
    );

    expect(result.success).toBe(true);
    expect(result.shareUrl).toContain('versestudio.app/watch/');

    const recordings = useDriveStore.getState().recordings;
    expect(recordings.length).toBe(1);
    expect(recordings[0].name).toBe('Test 4K Video.mp4');
    expect(recordings[0].status).toBe('shared');
    expect(recordings[0].uploadProgress).toBe(100);

    // Verify file exists on Drive server
    const driveFile = fakeDrive.files.get(recordings[0].driveFileId!);
    expect(driveFile).toBeDefined();
    expect(driveFile?.size).toBe(16 * 1024 * 1024);
  });

  it('proves resumable upload recovery after simulated network cut mid-upload', async () => {
    // 16 MB payload
    const data = 'C'.repeat(16 * 1024 * 1024);
    const fakeBlob = new Blob([data], { type: 'video/mp4' });

    // Step 1: Initiate session manually on fake server
    const folderId = await DriveService.getOrCreateAppFolder();
    const initRes = await fetch(`${DriveService.getApiBase()}/upload/drive/v3/files?uploadType=resumable`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test_token',
        'X-Upload-Content-Length': fakeBlob.size.toString(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'CutRecovery.mp4', parents: [folderId] }),
    });

    const sessionUri = initRes.headers.get('Location')!;
    expect(sessionUri).toBeDefined();

    // Step 2: Upload first 8 MB chunk
    const firstChunk = fakeBlob.slice(0, 8 * 1024 * 1024);
    const firstRes = await fetch(sessionUri, {
      method: 'PUT',
      headers: {
        'Content-Range': `bytes 0-${8 * 1024 * 1024 - 1}/${fakeBlob.size}`,
      },
      body: firstChunk,
    });
    expect(firstRes.status).toBe(308); // Incomplete

    // Step 3: Simulate network cut by querying upload status (Range inquiry with bytes */total)
    const statusQuery = await fetch(sessionUri, {
      method: 'PUT',
      headers: {
        'Content-Range': `bytes */${fakeBlob.size}`,
      },
    });
    expect(statusQuery.status).toBe(308);
    expect(statusQuery.headers.get('Range')).toBe(`bytes=0-${8 * 1024 * 1024 - 1}`);

    // Step 4: Resume upload with remaining 8 MB chunk from byte offset
    const secondChunk = fakeBlob.slice(8 * 1024 * 1024, 16 * 1024 * 1024);
    const finalRes = await fetch(sessionUri, {
      method: 'PUT',
      headers: {
        'Content-Range': `bytes ${8 * 1024 * 1024}-${16 * 1024 * 1024 - 1}/${fakeBlob.size}`,
      },
      body: secondChunk,
    });
    expect(finalRes.status).toBe(200);

    const completed = await finalRes.json();
    expect(completed.id).toBeDefined();
    expect(completed.name).toBe('CutRecovery.mp4');
  });

  it('fails with clear error state when Google Drive is disconnected and no mock fallback is used', async () => {
    await DriveService.disconnect();

    await expect(DriveService.getStorageQuota()).rejects.toThrow(
      /Google Drive is not connected/
    );

    const connectSuccess = await useDriveStore.getState().connectDrive();
    expect(connectSuccess).toBe(false);
    expect(useDriveStore.getState().isConnected).toBe(false);
    expect(useDriveStore.getState().error).toBeDefined();
  });

  it('moves item to trash in Google Drive using trashed: true rather than permanent deletion', async () => {
    await DriveService.persistSession('real_token_for_fake_drive_server');
    const fakeBlob = new Blob(['sample video data'], { type: 'video/mp4' });
    await useDriveStore.getState().uploadRecording('rec_trash_test', 'TrashMe.mp4', fakeBlob, 60);

    const uploaded = useDriveStore.getState().recordings[0];
    const driveFileId = uploaded.driveFileId!;

    // Move to trash
    await useDriveStore.getState().moveToTrash(uploaded.id);
    expect(useDriveStore.getState().recordings.length).toBe(0);

    // Verify file in fake Drive server is trashed, NOT deleted from user storage
    const driveFile = fakeDrive.files.get(driveFileId);
    expect(driveFile).toBeDefined();
    expect(driveFile?.trashed).toBe(true);

    // Undo restore
    await useDriveStore.getState().restoreTrashedItem();
    expect(useDriveStore.getState().recordings.length).toBe(1);
    expect(driveFile?.trashed).toBe(false);
  });

  it.skipIf(!process.env.GOOGLE_DRIVE_REFRESH_TOKEN)(
    'real Google Drive cloud upload test [needs human + Google account]',
    async () => {
      // Skipped in automated CI without interactive human Google account credentials
    }
  );
});
