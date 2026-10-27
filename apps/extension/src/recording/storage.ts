/**
 * VerseStudio 4K Pro — Crash-Resilient Chunked Recording Storage
 * Utilizes IndexedDB to stream video chunks continuously to disk.
 * Safely handles 6+ hour recordings without RAM accumulation and recovers from tab crashes.
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface StoredRecordingMeta {
  id: string;
  name: string;
  createdAt: number;
  durationMs: number;
  resolution: string;
  fps: number;
  mimeType: string;
  isComplete: boolean;
}

export interface StoredChunk {
  id?: number;
  recordingId: string;
  index: number;
  data: Blob;
  timestamp: number;
}

interface VerseStudioDB extends DBSchema {
  recordings: {
    key: string;
    value: StoredRecordingMeta;
  };
  chunks: {
    key: number;
    value: StoredChunk;
    indexes: { 'by-recording': string };
  };
}

const DB_NAME = 'VerseStudioDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<VerseStudioDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<VerseStudioDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('recordings')) {
          db.createObjectStore('recordings', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('chunks')) {
          const chunkStore = db.createObjectStore('chunks', {
            keyPath: 'id',
            autoIncrement: true,
          });
          chunkStore.createIndex('by-recording', 'recordingId');
        }
      },
    });
  }
  return dbPromise;
}

export class RecordingStorage {
  /**
   * Initializes a new recording session metadata entry.
   */
  static async startSession(meta: StoredRecordingMeta): Promise<void> {
    const db = await getDB();
    await db.put('recordings', meta);
  }

  /**
   * Appends an encoded video chunk directly to IndexedDB.
   */
  static async appendChunk(recordingId: string, index: number, blob: Blob): Promise<void> {
    const db = await getDB();
    await db.add('chunks', {
      recordingId,
      index,
      data: blob,
      timestamp: Date.now(),
    });
  }

  /**
   * Marks a recording session as successfully completed.
   */
  static async finalizeSession(recordingId: string, finalDurationMs: number): Promise<void> {
    const db = await getDB();
    const rec = await db.get('recordings', recordingId);
    if (rec) {
      rec.durationMs = finalDurationMs;
      rec.isComplete = true;
      await db.put('recordings', rec);
    }
  }

  /**
   * Retrieves all ordered chunks for a recording session and combines into a single Blob.
   */
  static async getRecordingBlob(recordingId: string): Promise<{ blob: Blob; meta: StoredRecordingMeta } | null> {
    const db = await getDB();
    const meta = await db.get('recordings', recordingId);
    if (!meta) return null;

    const chunks = await db.getAllFromIndex('chunks', 'by-recording', recordingId);
    chunks.sort((a, b) => a.index - b.index);

    const blob = new Blob(chunks.map((c) => c.data), { type: meta.mimeType || 'video/webm' });
    return { blob, meta };
  }

  /**
   * Checks if an incomplete recording exists from an unexpected browser/tab crash.
   */
  static async checkRecoverableSession(): Promise<StoredRecordingMeta | null> {
    const db = await getDB();
    const all = await db.getAll('recordings');
    // An incomplete recording that has chunks saved
    const incomplete = all.find((r) => !r.isComplete);
    if (incomplete) {
      const chunks = await db.getAllFromIndex('chunks', 'by-recording', incomplete.id);
      if (chunks.length > 0) {
        return incomplete;
      }
    }
    return null;
  }

  /**
   * Deletes a recording and all its stored chunks to free local disk space.
   */
  static async deleteSession(recordingId: string): Promise<void> {
    const db = await getDB();
    await db.delete('recordings', recordingId);

    const tx = db.transaction('chunks', 'readwrite');
    const index = tx.store.index('by-recording');
    let cursor = await index.openCursor(recordingId);

    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;
  }
}
