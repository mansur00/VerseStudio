/**
 * VerseStudio 4K Pro — Canvas 2D 60FPS Video Compositor
 * Combines screen capture and camera stream with dynamic layouts, spring morphing,
 * wallpaper backdrop frames, corner radius, and drop shadows.
 */

import { RecordingLayout } from '@verse-studio/shared';

export interface CompositorConfig {
  width: number;
  height: number;
  fps: number;
  wallpaper: string; // CSS background or color
  padding: number; // 0, 16, 32, 48 px
  borderRadius: number; // 0, 12, 24 px
  cameraBubbleSize: number; // e.g. 240px
  cameraBubblePos: { x: number; y: number }; // normalized 0..1
}

export class VideoCompositor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private screenVideo: HTMLVideoElement | null = null;
  private cameraVideo: HTMLVideoElement | null = null;
  private animFrameId: number | null = null;
  private isRunning: boolean = false;

  public config: CompositorConfig;
  public layout: RecordingLayout = 'screen-camera';

  // Smooth layout interpolation values (0..1)
  private currentCameraScale: number = 1.0;
  private targetCameraScale: number = 1.0;
  private currentBubblePos = { x: 0.85, y: 0.8 };
  private targetBubblePos = { x: 0.85, y: 0.8 };

  constructor(config: Partial<CompositorConfig> = {}) {
    this.config = {
      width: config.width || 3840,
      height: config.height || 2160,
      fps: config.fps || 60,
      wallpaper: config.wallpaper || 'radial-gradient(circle at 20% 20%, rgba(163, 230, 53, 0.25) 0%, #1B1C21 80%)',
      padding: config.padding ?? 32,
      borderRadius: config.borderRadius ?? 24,
      cameraBubbleSize: config.cameraBubbleSize ?? 320,
      cameraBubblePos: config.cameraBubblePos ?? { x: 0.85, y: 0.8 },
    };

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.config.width;
    this.canvas.height = this.config.height;

    const context = this.canvas.getContext('2d', { alpha: false });
    if (!context) {
      throw new Error('Failed to acquire Canvas 2D context for VideoCompositor');
    }
    this.ctx = context;
    this.targetBubblePos = { ...this.config.cameraBubblePos };
    this.currentBubblePos = { ...this.config.cameraBubblePos };
  }

  public setScreenSource(stream: MediaStream | null) {
    if (this.screenVideo) {
      this.screenVideo.pause();
      this.screenVideo.srcObject = null;
      this.screenVideo = null;
    }

    if (stream && stream.getVideoTracks().length > 0) {
      this.screenVideo = document.createElement('video');
      this.screenVideo.muted = true;
      this.screenVideo.playsInline = true;
      this.screenVideo.srcObject = stream;
      this.screenVideo.play().catch(console.error);
    }
  }

  public setCameraSource(stream: MediaStream | null) {
    if (this.cameraVideo) {
      this.cameraVideo.pause();
      this.cameraVideo.srcObject = null;
      this.cameraVideo = null;
    }

    if (stream && stream.getVideoTracks().length > 0) {
      this.cameraVideo = document.createElement('video');
      this.cameraVideo.muted = true;
      this.cameraVideo.playsInline = true;
      this.cameraVideo.srcObject = stream;
      this.cameraVideo.play().catch(console.error);
    }
  }

  public setLayout(layout: RecordingLayout) {
    this.layout = layout;
    if (layout === 'screen-only') {
      this.targetCameraScale = 0;
    } else if (layout === 'camera-only') {
      this.targetCameraScale = 1;
    } else if (layout === 'screen-camera') {
      this.targetCameraScale = 1;
    } else if (layout === 'split-50-50') {
      this.targetCameraScale = 1;
    }
  }

  public setCameraBubblePosition(normX: number, normY: number) {
    this.targetBubblePos = {
      x: Math.max(0.1, Math.min(0.9, normX)),
      y: Math.max(0.1, Math.min(0.9, normY)),
    };
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public getStream(): MediaStream {
    return this.canvas.captureStream(this.config.fps);
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.renderLoop();
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private renderLoop = () => {
    if (!this.isRunning) return;

    this.updatePhysics();
    this.drawFrame();

    this.animFrameId = requestAnimationFrame(this.renderLoop);
  };

  /**
   * Smooth spring interpolation towards targets
   */
  private updatePhysics() {
    const lerpFactor = 0.15;
    this.currentCameraScale += (this.targetCameraScale - this.currentCameraScale) * lerpFactor;
    this.currentBubblePos.x += (this.targetBubblePos.x - this.currentBubblePos.x) * lerpFactor;
    this.currentBubblePos.y += (this.targetBubblePos.y - this.currentBubblePos.y) * lerpFactor;
  }

  private drawFrame() {
    const { width, height, padding, borderRadius } = this.config;
    const ctx = this.ctx;

    // 1. Draw Wallpaper Frame Background
    this.drawWallpaperBackground(ctx, width, height);

    // 2. Compute inner frame rectangle (with user padding)
    const innerX = padding;
    const innerY = padding;
    const innerW = width - padding * 2;
    const innerH = height - padding * 2;

    // 3. Render according to current Layout
    if (this.layout === 'camera-only') {
      this.drawFullCamera(ctx, innerX, innerY, innerW, innerH, borderRadius);
    } else if (this.layout === 'split-50-50') {
      this.drawSplit5050(ctx, innerX, innerY, innerW, innerH, borderRadius);
    } else {
      // 'screen-only' or 'screen-camera'
      this.drawScreenContent(ctx, innerX, innerY, innerW, innerH, borderRadius);

      if (this.layout === 'screen-camera' && this.currentCameraScale > 0.05) {
        this.drawCameraBubble(ctx, width, height);
      }
    }
  }

  private drawWallpaperBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
    if (this.config.wallpaper === 'transparent') {
      ctx.clearRect(0, 0, width, height);
      return;
    }

    // Default dark canvas
    ctx.fillStyle = '#1B1C21';
    ctx.fillRect(0, 0, width, height);

    // If wallpaper has lime gradient
    if (this.config.wallpaper.includes('163, 230, 53') || this.config.wallpaper.includes('#A3E635')) {
      const grad = ctx.createRadialGradient(
        width * 0.2,
        height * 0.2,
        100,
        width * 0.5,
        height * 0.5,
        width * 0.9
      );
      grad.addColorStop(0, 'rgba(163, 230, 53, 0.20)');
      grad.addColorStop(0.6, '#1B1C21');
      grad.addColorStop(1, '#151619');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    } else if (this.config.wallpaper.includes('#22D3EE') || this.config.wallpaper.includes('34, 211, 238')) {
      const grad = ctx.createRadialGradient(
        width * 0.8,
        height * 0.2,
        100,
        width * 0.5,
        height * 0.5,
        width * 0.9
      );
      grad.addColorStop(0, 'rgba(34, 211, 238, 0.22)');
      grad.addColorStop(0.7, '#1B1C21');
      grad.addColorStop(1, '#151619');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }
  }

  private drawScreenContent(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    radius: number
  ) {
    ctx.save();

    // Drop Shadow
    if (this.config.padding > 0) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 32;
      ctx.shadowOffsetY = 16;
    }

    // Rounded clipping
    this.roundRect(ctx, x, y, w, h, radius);
    ctx.fillStyle = '#121316';
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.clip();

    if (this.screenVideo && this.screenVideo.readyState >= 2) {
      ctx.drawImage(this.screenVideo, x, y, w, h);
    } else {
      // Placeholder screen graphics
      this.drawScreenPlaceholder(ctx, x, y, w, h);
    }

    ctx.restore();
  }

  private drawFullCamera(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    radius: number
  ) {
    ctx.save();
    if (this.config.padding > 0) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 32;
      ctx.shadowOffsetY = 16;
    }

    this.roundRect(ctx, x, y, w, h, radius);
    ctx.fillStyle = '#121316';
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.clip();

    if (this.cameraVideo && this.cameraVideo.readyState >= 2) {
      this.drawVideoCover(ctx, this.cameraVideo, x, y, w, h);
    } else {
      this.drawCameraPlaceholder(ctx, x, y, w, h);
    }

    ctx.restore();
  }

  private drawSplit5050(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    radius: number
  ) {
    const gap = 24;
    const halfW = (w - gap) / 2;

    // Left pane: Screen
    this.drawScreenContent(ctx, x, y, halfW, h, radius);

    // Right pane: Camera
    ctx.save();
    const rightX = x + halfW + gap;
    if (this.config.padding > 0) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 32;
      ctx.shadowOffsetY = 16;
    }
    this.roundRect(ctx, rightX, y, halfW, h, radius);
    ctx.fillStyle = '#121316';
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.clip();

    if (this.cameraVideo && this.cameraVideo.readyState >= 2) {
      this.drawVideoCover(ctx, this.cameraVideo, rightX, y, halfW, h);
    } else {
      this.drawCameraPlaceholder(ctx, rightX, y, halfW, h);
    }
    ctx.restore();
  }

  private drawCameraBubble(ctx: CanvasRenderingContext2D, canvasW: number, canvasH: number) {
    const size = this.config.cameraBubbleSize * this.currentCameraScale;
    const radius = size / 2;
    const cx = this.currentBubblePos.x * canvasW;
    const cy = this.currentBubblePos.y * canvasH;

    ctx.save();

    // Bubble Drop Shadow & Lime Glow
    ctx.shadowColor = 'rgba(163, 230, 53, 0.35)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 8;

    // Draw circular clip
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#222329';
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.clip();

    if (this.cameraVideo && this.cameraVideo.readyState >= 2) {
      this.drawVideoCover(ctx, this.cameraVideo, cx - radius, cy - radius, size, size);
    } else {
      this.drawCameraPlaceholder(ctx, cx - radius, cy - radius, size, size);
    }

    ctx.restore();

    // Draw crisp Lime border ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#A3E635';
    ctx.stroke();
    ctx.restore();
  }

  private drawVideoCover(
    ctx: CanvasRenderingContext2D,
    video: HTMLVideoElement,
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    const vw = video.videoWidth || 1;
    const vh = video.videoHeight || 1;
    const videoAspect = vw / vh;
    const targetAspect = w / h;

    let sx = 0,
      sy = 0,
      sw = vw,
      sh = vh;

    if (videoAspect > targetAspect) {
      sw = vh * targetAspect;
      sx = (vw - sw) / 2;
    } else {
      sh = vw / targetAspect;
      sy = (vh - sh) / 2;
    }

    ctx.drawImage(video, sx, sy, sw, sh, x, y, w, h);
  }

  private drawScreenPlaceholder(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    ctx.fillStyle = '#1B1C21';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#6E6F7B';
    ctx.font = 'bold 36px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Select Screen, Window, or Tab to start', x + w / 2, y + h / 2);
  }

  private drawCameraPlaceholder(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ) {
    ctx.fillStyle = '#222329';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#A3E635';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h / 2 - 16, Math.min(w, h) * 0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6E6F7B';
    ctx.font = '500 24px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Camera Feed', x + w / 2, y + h / 2 + Math.min(w, h) * 0.28);
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  public dispose() {
    this.stop();
    if (this.screenVideo) {
      this.screenVideo.pause();
      this.screenVideo.srcObject = null;
      this.screenVideo = null;
    }
    if (this.cameraVideo) {
      this.cameraVideo.pause();
      this.cameraVideo.srcObject = null;
      this.cameraVideo = null;
    }
  }
}
