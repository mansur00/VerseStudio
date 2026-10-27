import { describe, it, expect } from 'vitest';

describe('Video Compositor Coordinates and Aspect Ratio Math', () => {
  it('correctly calculates video cover scaling with letterboxing / pillarboxing', () => {
    // 16:9 video into 1:1 square camera bubble
    const vw = 1920;
    const vh = 1080;
    const targetW = 320;
    const targetH = 320;

    const videoAspect = vw / vh; // 1.777
    const targetAspect = targetW / targetH; // 1.0

    let sx = 0,
      sy = 0,
      sw = vw,
      sh = vh;

    if (videoAspect > targetAspect) {
      sw = vh * targetAspect; // 1080 * 1 = 1080
      sx = (vw - sw) / 2; // (1920 - 1080) / 2 = 420
    } else {
      sh = vw / targetAspect;
      sy = (vh - sh) / 2;
    }

    expect(sw).toBe(1080);
    expect(sx).toBe(420);
    expect(sy).toBe(0);
    expect(sh).toBe(1080);
  });

  it('clamps camera bubble position within viewport bounds', () => {
    const clampPos = (normX: number, normY: number) => ({
      x: Math.max(0.1, Math.min(0.9, normX)),
      y: Math.max(0.1, Math.min(0.9, normY)),
    });

    expect(clampPos(-0.5, 1.5)).toEqual({ x: 0.1, y: 0.9 });
    expect(clampPos(0.85, 0.8)).toEqual({ x: 0.85, y: 0.8 });
  });

  it('calculates trim time percentage accurately', () => {
    const duration = 120; // 2 minutes
    const startTime = 15;
    const endTime = 90;

    const startPercent = (startTime / duration) * 100;
    const endPercent = (endTime / duration) * 100;

    expect(startPercent).toBe(12.5);
    expect(endPercent).toBe(75);
    expect(endPercent - startPercent).toBe(62.5);
  });
});
