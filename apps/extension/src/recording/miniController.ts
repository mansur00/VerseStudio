/**
 * VerseStudio 4K Pro — Document Picture-in-Picture Mini Controller
 * Always-on-top floating controller for recording state, timer, mic toggle, and stop.
 */

export interface MiniControllerCallbacks {
  onPauseResume: () => void;
  onStop: () => void;
  onToggleMic: () => void;
}

export class MiniController {
  private pipWindow: Window | null = null;
  private callbacks: MiniControllerCallbacks;

  constructor(callbacks: MiniControllerCallbacks) {
    this.callbacks = callbacks;
  }

  public async open(): Promise<boolean> {
    if ('documentPictureInPicture' in window) {
      try {
        const pip = await (window as any).documentPictureInPicture.requestWindow({
          width: 320,
          height: 72,
        });
        this.pipWindow = pip;
        this.renderContent();

        pip.addEventListener('pagehide', () => {
          this.pipWindow = null;
        });
        return true;
      } catch (err) {
        console.warn('Document Picture-in-Picture not granted or failed:', err);
      }
    }
    return false;
  }

  public update(isRecording: boolean, isPaused: boolean, formattedTime: string, micMuted: boolean) {
    if (!this.pipWindow || !this.pipWindow.document) return;
    const doc = this.pipWindow.document;

    const timerEl = doc.getElementById('vs-pip-timer');
    if (timerEl) {
      timerEl.textContent = formattedTime;
    }

    const badgeEl = doc.getElementById('vs-pip-badge');
    if (badgeEl) {
      badgeEl.className = !isRecording ? 'pip-badge idle' : isPaused ? 'pip-badge paused' : 'pip-badge recording';
      badgeEl.textContent = !isRecording ? 'IDLE' : isPaused ? 'PAUSED' : 'REC';
    }

    const pauseBtn = doc.getElementById('vs-pip-pause') as HTMLButtonElement | null;
    if (pauseBtn) {
      pauseBtn.textContent = isPaused ? '▶ Resume' : '❚❚ Pause';
    }

    const micBtn = doc.getElementById('vs-pip-mic') as HTMLButtonElement | null;
    if (micBtn) {
      micBtn.textContent = micMuted ? '🔇 Unmute' : '🎙️ Mic';
      micBtn.className = micMuted ? 'pip-btn pip-btn-warn' : 'pip-btn';
    }
  }

  public close() {
    if (this.pipWindow) {
      this.pipWindow.close();
      this.pipWindow = null;
    }
  }

  private renderContent() {
    if (!this.pipWindow) return;
    const doc = this.pipWindow.document;

    doc.title = 'VerseStudio 4K Controller';
    doc.body.style.margin = '0';
    doc.body.style.padding = '0';
    doc.body.style.backgroundColor = '#1B1C21';
    doc.body.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, sans-serif';
    doc.body.style.color = '#F5F5F7';
    doc.body.style.userSelect = 'none';

    const style = doc.createElement('style');
    style.textContent = `
      .pip-container {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        height: 100vh;
        box-sizing: border-box;
        background: #1B1C21;
      }
      .pip-status {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .pip-badge {
        font-size: 10px;
        font-weight: 700;
        padding: 3px 6px;
        border-radius: 4px;
        letter-spacing: 0.5px;
      }
      .pip-badge.recording {
        background: #FF4D4F;
        color: white;
        animation: pulse 1.5s infinite;
      }
      .pip-badge.paused {
        background: #F59E0B;
        color: black;
      }
      .pip-timer {
        font-family: 'JetBrains Mono', monospace;
        font-size: 14px;
        font-weight: 600;
        color: #F5F5F7;
      }
      .pip-actions {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .pip-btn {
        background: #292A31;
        border: 1px solid #383942;
        color: #F5F5F7;
        font-size: 11px;
        font-weight: 600;
        padding: 5px 8px;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
        transition: background 0.15s;
      }
      .pip-btn:hover {
        background: #383942;
      }
      .pip-btn-warn {
        border-color: #FF4D4F;
        color: #FF4D4F;
      }
      .pip-btn-stop {
        background: #FF4D4F;
        border-color: #FF4D4F;
        color: white;
      }
      .pip-btn-stop:hover {
        background: #D83538;
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
    `;
    doc.head.appendChild(style);

    const container = doc.createElement('div');
    container.className = 'pip-container';

    container.innerHTML = `
      <div class="pip-status">
        <span id="vs-pip-badge" class="pip-badge recording">REC</span>
        <span id="vs-pip-timer" class="pip-timer">00:00:00</span>
      </div>
      <div class="pip-actions">
        <button id="vs-pip-mic" class="pip-btn">🎙️ Mic</button>
        <button id="vs-pip-pause" class="pip-btn">❚❚ Pause</button>
        <button id="vs-pip-stop" class="pip-btn pip-btn-stop">■ Stop</button>
      </div>
    `;

    doc.body.appendChild(container);

    doc.getElementById('vs-pip-pause')?.addEventListener('click', () => {
      this.callbacks.onPauseResume();
    });
    doc.getElementById('vs-pip-mic')?.addEventListener('click', () => {
      this.callbacks.onToggleMic();
    });
    doc.getElementById('vs-pip-stop')?.addEventListener('click', () => {
      this.callbacks.onStop();
    });
  }
}
