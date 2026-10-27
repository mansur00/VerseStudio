import { describe, it, expect, beforeEach } from 'vitest';
import { useDriveStore } from '../driveStore';
import { DriveService } from '../driveService';

describe('useDriveStore & DriveService', () => {
  beforeEach(async () => {
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

  it('fetches Google Drive storage quota accurately', async () => {
    const quota = await DriveService.getStorageQuota();
    expect(quota.limitBytes).toBeGreaterThan(0);
    expect(quota.usageBytes).toBeGreaterThan(0);
    expect(quota.availableBytes).toBe(quota.limitBytes - quota.usageBytes);
  });

  it('uploads video through resumable chunks with progress updates', async () => {
    const fakeBlob = new Blob(['x'.repeat(16 * 1024 * 1024)], { type: 'video/mp4' }); // 16 MB

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
  });

  it('toggles visibility between public and private', async () => {
    const fakeBlob = new Blob(['sample data'], { type: 'video/mp4' });
    await useDriveStore.getState().uploadRecording('rec_vis_test', 'Demo.mp4', fakeBlob, 60);

    // Make private
    await useDriveStore.getState().toggleVisibility('rec_vis_test', false);
    expect(useDriveStore.getState().recordings[0].status).toBe('private');

    // Make public
    await useDriveStore.getState().toggleVisibility('rec_vis_test', true);
    expect(useDriveStore.getState().recordings[0].status).toBe('shared');
  });

  it('renames a recording in the library', async () => {
    const fakeBlob = new Blob(['sample data'], { type: 'video/mp4' });
    await useDriveStore.getState().uploadRecording('rec_rename_test', 'Original.mp4', fakeBlob, 60);

    await useDriveStore.getState().renameRecording('rec_rename_test', 'Renamed Product Demo.mp4');
    expect(useDriveStore.getState().recordings[0].name).toBe('Renamed Product Demo.mp4');
  });

  it('moves item to trash and supports undo restoration', async () => {
    const fakeBlob = new Blob(['sample data'], { type: 'video/mp4' });
    await useDriveStore.getState().uploadRecording('rec_trash_test', 'Trash Me.mp4', fakeBlob, 60);
    expect(useDriveStore.getState().recordings.length).toBe(1);

    // Move to trash
    await useDriveStore.getState().moveToTrash('rec_trash_test');
    expect(useDriveStore.getState().recordings.length).toBe(0);
    expect(useDriveStore.getState().trashedItem?.name).toBe('Trash Me.mp4');

    // Undo restore
    await useDriveStore.getState().restoreTrashedItem();
    expect(useDriveStore.getState().recordings.length).toBe(1);
    expect(useDriveStore.getState().trashedItem).toBeNull();
  });

  it('supports search query and status filtering', async () => {
    useDriveStore.setState({
      recordings: [
        {
          id: '1',
          name: 'React Tutorial 4K',
          durationSeconds: 100,
          sizeBytes: 1000,
          createdAt: 'Oct 26',
          status: 'shared',
          resolution: '4k',
          fps: 60,
        },
        {
          id: '2',
          name: 'Private Notes',
          durationSeconds: 50,
          sizeBytes: 500,
          createdAt: 'Oct 26',
          status: 'private',
          resolution: '1080p',
          fps: 30,
        },
      ],
    });

    useDriveStore.getState().setSearchQuery('React');
    expect(useDriveStore.getState().searchQuery).toBe('React');

    useDriveStore.getState().setFilterStatus('shared');
    expect(useDriveStore.getState().filterStatus).toBe('shared');
  });
});
