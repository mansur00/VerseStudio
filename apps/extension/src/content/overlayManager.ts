/**
 * VerseStudio 4K Pro — In-Tab Content Script Live Tools & Overlays
 * Implements:
 * 1. Auto Zoom & Pan on Click (2x smooth spring focus, 2.5s duration)
 * 2. Click Ripple Feedback (expanding brand lime wave)
 * 3. Cursor Spotlight (Alt+S)
 * 4. Laser Pen with 2-second decay fade (Alt+L)
 * 5. Keystroke Display HUD (Alt+K)
 * 6. Privacy Shield Blur (Alt+P)
 * Respects prefers-reduced-motion and in-app reduce motion setting.
 */

export interface LiveToolSettings {
  laser: boolean;
  spotlight: boolean;
  keystroke: boolean;
  privacy: boolean;
  autoZoom: boolean;
  teleprompter: boolean;
  reduceMotion: boolean;
}

export class InTabOverlayManager {
  private settings: LiveToolSettings = {
    laser: false,
    spotlight: false,
    keystroke: true,
    privacy: false,
    autoZoom: false,
    teleprompter: false,
    reduceMotion: false,
  };

  private rootContainer: HTMLDivElement | null = null;

  // Spotlight Elements
  private spotlightEl: HTMLDivElement | null = null;
  private mousePos = { x: 0, y: 0 };

  // Laser Pen Canvas
  private laserCanvas: HTMLCanvasElement | null = null;
  private laserCtx: CanvasRenderingContext2D | null = null;
  private laserPoints: Array<{ x: number; y: number; time: number }> = [];
  private isDrawingLaser: boolean = false;
  private laserAnimFrame: number | null = null;

  // Keystroke HUD
  private keystrokeHudEl: HTMLDivElement | null = null;
  private keystrokeTimeout: number | null = null;

  // Privacy Shield
  private privacyShieldEl: HTMLDivElement | null = null;

  // Auto Zoom
  private zoomTimeout: number | null = null;
  private isZoomed: boolean = false;

  constructor() {
    this.checkReduceMotion();
    this.initDOM();
    this.bindEvents();
  }

  private checkReduceMotion() {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.settings.reduceMotion = mediaQuery.matches;
  }

  private initDOM() {
    if (document.getElementById('vs-overlay-root')) return;

    const root = document.createElement('div');
    root.id = 'vs-overlay-root';
    root.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 2147483640;
      overflow: hidden;
      font-family: Inter, system-ui, sans-serif;
    `;
    document.body.appendChild(root);
    this.rootContainer = root;

    // Inject CSS animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes vs-ripple-expand {
        0% { transform: scale(0.2); opacity: 1; }
        100% { transform: scale(2.2); opacity: 0; }
      }
      @keyframes vs-hud-pop {
        0% { transform: translateY(12px) scale(0.95); opacity: 0; }
        100% { transform: translateY(0) scale(1); opacity: 1; }
      }
      .vs-click-ripple {
        position: fixed;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 3px solid #A3E635;
        box-shadow: 0 0 16px rgba(163, 230, 53, 0.7);
        pointer-events: none;
        z-index: 2147483645;
        animation: vs-ripple-expand 0.45s ease-out forwards;
      }
    `;
    document.head.appendChild(style);

    this.initSpotlight();
    this.initLaserCanvas();
    this.initKeystrokeHud();
    this.initPrivacyShield();
  }

  // --- 1. Spotlight Overlay (Alt+S) ---
  private initSpotlight() {
    const el = document.createElement('div');
    el.id = 'vs-spotlight';
    el.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      display: none;
      z-index: 2147483642;
      transition: background 0.05s ease-out;
    `;
    this.rootContainer?.appendChild(el);
    this.spotlightEl = el;
  }

  public updateSpotlight(x: number, y: number) {
    if (!this.settings.spotlight || !this.spotlightEl) return;
    this.spotlightEl.style.display = 'block';
    this.spotlightEl.style.background = `radial-gradient(circle 130px at ${x}px ${y}px, transparent 0%, transparent 120px, rgba(0, 0, 0, 0.65) 130px)`;
  }

  // --- 2. Laser Pen Canvas (Alt+L) ---
  private initLaserCanvas() {
    const canvas = document.createElement('canvas');
    canvas.id = 'vs-laser-canvas';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      display: none;
      z-index: 2147483643;
    `;
    this.rootContainer?.appendChild(canvas);
    this.laserCanvas = canvas;
    this.laserCtx = canvas.getContext('2d');

    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });

    this.startLaserRenderLoop();
  }

  private startLaserRenderLoop() {
    const render = () => {
      if (this.laserCtx && this.laserCanvas) {
        const now = Date.now();
        // Remove points older than 2 seconds (2000ms decay)
        this.laserPoints = this.laserPoints.filter((p) => now - p.time < 2000);

        this.laserCtx.clearRect(0, 0, this.laserCanvas.width, this.laserCanvas.height);

        if (this.laserPoints.length > 1) {
          for (let i = 1; i < this.laserPoints.length; i++) {
            const p1 = this.laserPoints[i - 1];
            const p2 = this.laserPoints[i];
            const age = now - p2.time;
            const opacity = Math.max(0, 1 - age / 2000);

            this.laserCtx.beginPath();
            this.laserCtx.moveTo(p1.x, p1.y);
            this.laserCtx.lineTo(p2.x, p2.y);
            this.laserCtx.lineWidth = 6;
            this.laserCtx.lineCap = 'round';
            this.laserCtx.strokeStyle = `rgba(34, 211, 238, ${opacity})`; // #22D3EE Cyan Neon
            this.laserCtx.shadowColor = '#22D3EE';
            this.laserCtx.shadowBlur = 14;
            this.laserCtx.stroke();
          }
        }
      }
      this.laserAnimFrame = requestAnimationFrame(render);
    };

    this.laserAnimFrame = requestAnimationFrame(render);
  }

  // --- 3. Keystroke Display HUD (Alt+K) ---
  private initKeystrokeHud() {
    const el = document.createElement('div');
    el.id = 'vs-keystroke-hud';
    el.style.cssText = `
      position: fixed;
      bottom: 48px;
      left: 50%;
      transform: translateX(-50%);
      display: none;
      pointer-events: none;
      z-index: 2147483646;
      background: rgba(27, 28, 33, 0.92);
      backdrop-filter: blur(12px);
      border: 1px solid #383942;
      border-radius: 12px;
      padding: 8px 16px;
      color: #F5F5F7;
      font-size: 14px;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
      animation: vs-hud-pop 0.15s cubic-bezier(0.2, 0, 0, 1) forwards;
    `;
    this.rootContainer?.appendChild(el);
    this.keystrokeHudEl = el;
  }

  public displayKeystroke(text: string) {
    if (!this.settings.keystroke || !this.keystrokeHudEl) return;

    this.keystrokeHudEl.textContent = text;
    this.keystrokeHudEl.style.display = 'block';

    if (this.keystrokeTimeout) clearTimeout(this.keystrokeTimeout);
    this.keystrokeTimeout = window.setTimeout(() => {
      if (this.keystrokeHudEl) {
        this.keystrokeHudEl.style.display = 'none';
      }
    }, 2000);
  }

  // --- 4. Privacy Shield Blur (Alt+P) ---
  private initPrivacyShield() {
    const el = document.createElement('div');
    el.id = 'vs-privacy-shield';
    el.style.cssText = `
      position: fixed;
      top: 25%;
      left: 35%;
      width: 320px;
      height: 120px;
      display: none;
      z-index: 2147483644;
      pointer-events: auto;
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      background: rgba(255, 77, 79, 0.12);
      border: 2px dashed #FF4D4F;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(255, 77, 79, 0.25);
      cursor: move;
      resize: both;
      overflow: hidden;
    `;

    // Header label
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 4px 8px;
      background: rgba(255, 77, 79, 0.85);
      color: white;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    header.innerHTML = `
      <span>🛡️ Privacy Blur Shield</span>
      <span style="cursor: pointer; padding: 0 4px;" id="vs-privacy-close">✕</span>
    `;
    el.appendChild(header);

    // Dragging physics
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    header.addEventListener('mousedown', (e) => {
      isDragging = true;
      offsetX = e.clientX - el.getBoundingClientRect().left;
      offsetY = e.clientY - el.getBoundingClientRect().top;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      el.style.left = `${e.clientX - offsetX}px`;
      el.style.top = `${e.clientY - offsetY}px`;
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    el.querySelector('#vs-privacy-close')?.addEventListener('click', () => {
      this.toggleTool('privacy', false);
    });

    this.rootContainer?.appendChild(el);
    this.privacyShieldEl = el;
  }

  // --- 5. Auto Zoom & Pan on Click (2x Smooth Spring) ---
  public triggerAutoZoom(targetX: number, targetY: number) {
    if (!this.settings.autoZoom || this.settings.reduceMotion) return;

    if (this.isZoomed) {
      this.resetZoom();
      return;
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const originX = (targetX / vw) * 100;
    const originY = (targetY / vh) * 100;

    document.body.style.transformOrigin = `${originX}% ${originY}%`;
    document.body.style.transition = 'transform 0.4s cubic-bezier(0.2, 0, 0, 1)';
    document.body.style.transform = 'scale(2)';
    this.isZoomed = true;

    if (this.zoomTimeout) clearTimeout(this.zoomTimeout);
    this.zoomTimeout = window.setTimeout(() => {
      this.resetZoom();
    }, 2500);
  }

  private resetZoom() {
    document.body.style.transition = 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
    document.body.style.transform = 'scale(1)';
    this.isZoomed = false;
    if (this.zoomTimeout) clearTimeout(this.zoomTimeout);
  }

  // --- 6. Click Ripple Animation ---
  public triggerClickRipple(x: number, y: number) {
    const ripple = document.createElement('div');
    ripple.className = 'vs-click-ripple';
    ripple.style.left = `${x - 20}px`;
    ripple.style.top = `${y - 20}px`;

    document.body.appendChild(ripple);
    setTimeout(() => {
      ripple.remove();
    }, 450);
  }

  // --- Bind Global Shortcuts & Mouse Listeners ---
  private bindEvents() {
    window.addEventListener('mousemove', (e) => {
      this.mousePos = { x: e.clientX, y: e.clientY };

      if (this.settings.spotlight) {
        this.updateSpotlight(e.clientX, e.clientY);
      }

      if (this.isDrawingLaser && this.settings.laser) {
        this.laserPoints.push({ x: e.clientX, y: e.clientY, time: Date.now() });
      }
    });

    window.addEventListener('mousedown', (e) => {
      this.triggerClickRipple(e.clientX, e.clientY);

      if (this.settings.autoZoom) {
        this.triggerAutoZoom(e.clientX, e.clientY);
      }

      if (this.settings.laser) {
        this.isDrawingLaser = true;
        this.laserPoints.push({ x: e.clientX, y: e.clientY, time: Date.now() });
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDrawingLaser = false;
    });

    // Global Key Listener for HUD and Tool Shortcuts
    window.addEventListener('keydown', (e) => {
      // Don't trigger when user is typing in form inputs
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      // Format pressed keys for Keystroke HUD
      const modifiers: string[] = [];
      if (e.metaKey) modifiers.push('⌘');
      if (e.ctrlKey) modifiers.push('Ctrl');
      if (e.altKey) modifiers.push('Alt');
      if (e.shiftKey) modifiers.push('Shift');

      const keyName = e.key.length === 1 ? e.key.toUpperCase() : e.key;
      const combo = [...modifiers, keyName].join(' + ');
      this.displayKeystroke(combo);

      // Tool Toggles via Alt + Letter
      if (e.altKey) {
        const key = e.key.toLowerCase();
        if (key === 's') {
          e.preventDefault();
          this.toggleTool('spotlight');
        } else if (key === 'l') {
          e.preventDefault();
          this.toggleTool('laser');
        } else if (key === 'k') {
          e.preventDefault();
          this.toggleTool('keystroke');
        } else if (key === 'p') {
          e.preventDefault();
          this.toggleTool('privacy');
        } else if (key === 'z') {
          e.preventDefault();
          this.toggleTool('autoZoom');
        }
      }
    });
  }

  public toggleTool(tool: keyof LiveToolSettings, explicitState?: boolean) {
    const newState = explicitState !== undefined ? explicitState : !this.settings[tool];
    (this.settings as any)[tool] = newState;

    if (tool === 'spotlight') {
      if (this.spotlightEl) {
        this.spotlightEl.style.display = newState ? 'block' : 'none';
        if (newState) this.updateSpotlight(this.mousePos.x, this.mousePos.y);
      }
    } else if (tool === 'laser') {
      if (this.laserCanvas) {
        this.laserCanvas.style.display = newState ? 'block' : 'none';
        if (!newState) this.laserPoints = [];
      }
    } else if (tool === 'privacy') {
      if (this.privacyShieldEl) {
        this.privacyShieldEl.style.display = newState ? 'block' : 'none';
      }
    } else if (tool === 'autoZoom') {
      if (!newState && this.isZoomed) {
        this.resetZoom();
      }
    }
  }

  public getSettings(): LiveToolSettings {
    return { ...this.settings };
  }

  public dispose() {
    if (this.laserAnimFrame) cancelAnimationFrame(this.laserAnimFrame);
    if (this.zoomTimeout) clearTimeout(this.zoomTimeout);
    if (this.keystrokeTimeout) clearTimeout(this.keystrokeTimeout);
    this.resetZoom();
    this.rootContainer?.remove();
  }
}
