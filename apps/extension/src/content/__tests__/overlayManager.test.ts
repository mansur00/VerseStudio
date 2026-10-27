// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InTabOverlayManager } from '../overlayManager';

describe('InTabOverlayManager (Phase 2 Live Tools)', () => {
  let manager: InTabOverlayManager;

  beforeEach(() => {
    // Mock matchMedia
    window.matchMedia = window.matchMedia || vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    // Clear DOM
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    manager = new InTabOverlayManager();
  });

  afterEach(() => {
    manager.dispose();
  });

  it('initializes overlay root element and tool sub-elements in DOM', () => {
    expect(document.getElementById('vs-overlay-root')).not.toBeNull();
    expect(document.getElementById('vs-spotlight')).not.toBeNull();
    expect(document.getElementById('vs-laser-canvas')).not.toBeNull();
    expect(document.getElementById('vs-keystroke-hud')).not.toBeNull();
    expect(document.getElementById('vs-privacy-shield')).not.toBeNull();
  });

  it('toggles spotlight on and off and updates radial gradient mask', () => {
    const spotlightEl = document.getElementById('vs-spotlight') as HTMLDivElement;
    expect(spotlightEl.style.display).toBe('none');

    manager.toggleTool('spotlight', true);
    expect(spotlightEl.style.display).toBe('block');

    manager.updateSpotlight(250, 400);
    expect(spotlightEl.style.background).toContain('radial-gradient');
    expect(spotlightEl.style.background).toContain('250px 400px');

    manager.toggleTool('spotlight', false);
    expect(spotlightEl.style.display).toBe('none');
  });

  it('formats and displays keystroke combinations in HUD with timeout', () => {
    vi.useFakeTimers();

    const hudEl = document.getElementById('vs-keystroke-hud') as HTMLDivElement;
    expect(hudEl.style.display).toBe('none');

    manager.displayKeystroke('Alt + S');
    expect(hudEl.style.display).toBe('block');
    expect(hudEl.textContent).toBe('Alt + S');

    // Fast forward 2.1 seconds (2000ms timeout)
    vi.advanceTimersByTime(2100);
    expect(hudEl.style.display).toBe('none');

    vi.useRealTimers();
  });

  it('toggles privacy blur shield element', () => {
    const shieldEl = document.getElementById('vs-privacy-shield') as HTMLDivElement;
    expect(shieldEl.style.display).toBe('none');

    manager.toggleTool('privacy', true);
    expect(shieldEl.style.display).toBe('block');

    manager.toggleTool('privacy', false);
    expect(shieldEl.style.display).toBe('none');
  });

  it('triggers auto-zoom 2x scale and resets after timeout', () => {
    vi.useFakeTimers();

    manager.toggleTool('autoZoom', true);
    manager.triggerAutoZoom(400, 300);

    expect(document.body.style.transform).toBe('scale(2)');

    // Fast-forward 2.6 seconds (2500ms duration)
    vi.advanceTimersByTime(2600);
    expect(document.body.style.transform).toBe('scale(1)');

    vi.useRealTimers();
  });

  it('creates click ripple element and removes it after animation', () => {
    vi.useFakeTimers();

    manager.triggerClickRipple(150, 200);
    const ripple = document.querySelector('.vs-click-ripple') as HTMLDivElement;
    expect(ripple).not.toBeNull();
    expect(ripple.style.left).toBe('130px'); // 150 - 20
    expect(ripple.style.top).toBe('180px'); // 200 - 20

    vi.advanceTimersByTime(500);
    expect(document.querySelector('.vs-click-ripple')).toBeNull();

    vi.useRealTimers();
  });
});
