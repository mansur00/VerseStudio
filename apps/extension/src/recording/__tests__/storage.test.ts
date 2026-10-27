import { describe, it, expect } from 'vitest';
import 'fake-indexeddb/auto';
import { RecordingStorage, StoredRecordingMeta } from '../storage';

describe('RecordingStorage (Crash-Resilient Chunked Buffer)', () => {
  const mockMeta: StoredRecordingMeta = {
    id: 'test_rec_123',
    name: 'Test Recording 4K',
    createdAt: Date.now(),
    durationMs: 0,
    resolution: '3840x2160',
    fps: 60,
    mimeType: 'video/webm',
    isComplete: false,
  };

  it('starts session and appends ordered video chunks', async () => {
    await RecordingStorage.startSession(mockMeta);

    const chunk1 = new Blob(['chunk-data-1'], { type: 'video/webm' });
    const chunk2 = new Blob(['chunk-data-2'], { type: 'video/webm' });

    await RecordingStorage.appendChunk('test_rec_123', 0, chunk1);
    await RecordingStorage.appendChunk('test_rec_123', 1, chunk2);

    const result = await RecordingStorage.getRecordingBlob('test_rec_123');
    expect(result).not.toBeNull();
    expect(result?.meta.id).toBe('test_rec_123');
    expect(result?.blob.size).toBe(chunk1.size + chunk2.size);
  });

  it('detects incomplete session for crash recovery', async () => {
    const recoverable = await RecordingStorage.checkRecoverableSession();
    expect(recoverable).not.toBeNull();
    expect(recoverable?.id).toBe('test_rec_123');
    expect(recoverable?.isComplete).toBe(false);
  });

  it('finalizes session and marks complete', async () => {
    await RecordingStorage.finalizeSession('test_rec_123', 12500);
    const result = await RecordingStorage.getRecordingBlob('test_rec_123');
    expect(result?.meta.isComplete).toBe(true);
    expect(result?.meta.durationMs).toBe(12500);

    const recoverableAfterFinalize = await RecordingStorage.checkRecoverableSession();
    expect(recoverableAfterFinalize).toBeNull();
  });

  it('deletes session and cleans up chunks from storage', async () => {
    await RecordingStorage.deleteSession('test_rec_123');
    const result = await RecordingStorage.getRecordingBlob('test_rec_123');
    expect(result).toBeNull();
  });
});
