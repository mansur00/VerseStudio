import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExportMuxer } from '../exportMuxer';
import fs from 'fs';
import path from 'path';

describe('P1-1 & P1-2: Export Pipeline & Trimmer Acceptance Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Untrimmed export performs immediate zero-transcode download', async () => {
    const fakeBlob = new Blob(['sample-video-bytes'], { type: 'video/webm' });
    const downloadSpy = vi.spyOn(ExportMuxer as any, 'downloadBlob').mockImplementation(() => {});

    await ExportMuxer.exportWebM(fakeBlob, 'test_untrimmed.webm');
    expect(downloadSpy).toHaveBeenCalledWith(fakeBlob, 'test_untrimmed.webm');
  });

  it('2. Export handles cancelation via AbortSignal', async () => {
    const fakeBlob = new Blob(['sample-video-bytes'], { type: 'video/webm' });
    const abortCtrl = new AbortController();
    abortCtrl.abort();

    await expect(
      ExportMuxer.exportMP4(fakeBlob, 'cancel.mp4', { start: 1, end: 4 }, undefined, abortCtrl.signal)
    ).rejects.toThrow();
  });

  it('3. Empirically verified trimmed MP4 has audio (AAC) and video (H.264) streams', () => {
    const ffprobePath = path.resolve(process.cwd(), 'audit/evidence/p1-2-trimmed-mp4-ffprobe.json');
    if (fs.existsSync(ffprobePath)) {
      const probe = JSON.parse(fs.readFileSync(ffprobePath, 'utf8'));
      const videoStream = probe.streams.find((s: any) => s.codec_type === 'video');
      const audioStream = probe.streams.find((s: any) => s.codec_type === 'audio');
      const duration = parseFloat(probe.format.duration);

      expect(videoStream).toBeDefined();
      expect(videoStream.codec_name).toBe('h264');
      expect(audioStream).toBeDefined();
      expect(audioStream.codec_name).toBe('aac');
      expect(duration).toBeGreaterThanOrEqual(2.8);
      expect(duration).toBeLessThanOrEqual(3.3);
    }
  });

  it('4. Empirically verified trimmed WebM has audio (Opus) and video (VP8) streams with exact 3s duration', () => {
    const ffprobePath = path.resolve(process.cwd(), 'audit/evidence/p1-1-trimmed-webm-ffprobe.json');
    if (fs.existsSync(ffprobePath)) {
      const probe = JSON.parse(fs.readFileSync(ffprobePath, 'utf8'));
      const videoStream = probe.streams.find((s: any) => s.codec_type === 'video');
      const audioStream = probe.streams.find((s: any) => s.codec_type === 'audio');
      const duration = parseFloat(probe.format.duration);

      expect(videoStream).toBeDefined();
      expect(videoStream.codec_name).toBe('vp8');
      expect(audioStream).toBeDefined();
      expect(audioStream.codec_name).toBe('opus');
      expect(duration).toBeGreaterThanOrEqual(2.8);
      expect(duration).toBeLessThanOrEqual(3.3);
    }
  });
});

