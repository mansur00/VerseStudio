import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useAIStore } from '../aiStore';
import { generateSrt, generateVtt, generateStepByStepGuide } from '../aiService';
import { useAuthStore } from '../../auth/authStore';
import type { SubtitleCue, ClickEventLog } from '@verse-studio/shared';

describe('useAIStore & AIService', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    useAIStore.getState().clearSessionEvents();
    useAuthStore.setState({
      isAuthenticated: true,
      user: {
        id: 'user-1',
        email: 'test@versestudio.app',
        name: 'Test Creator',
        plan: 'free',
        aiMinutesUsed: 5,
        aiMinutesLimit: 30,
        googleDriveConnected: true,
        createdAt: new Date().toISOString(),
      },
    });

    global.fetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const urlStr = url.toString();
      if (init?.signal?.aborted) {
        const err = new Error('The operation was aborted');
        err.name = 'AbortError';
        throw err;
      }

      if (urlStr.includes('/api/ai/process')) {
        const body = init?.body ? JSON.parse(init.body as string) : {};
        const durationSeconds = body.durationSeconds || 15;
        const cues: SubtitleCue[] = [
          {
            id: 'cue-1',
            startTime: 0,
            endTime: 5,
            banglaText: 'স্বাগতম টিউটোরিয়ালে',
            englishText: 'Welcome to the tutorial',
          },
        ];
        const srtContent = generateSrt(cues, 'bilingual');
        const vttContent = generateVtt(cues);
        const guide = generateStepByStepGuide(body.title || 'Guide', durationSeconds, cues, body.clicks || []);

        const resp = new Response(
          JSON.stringify({
            success: true,
            cues,
            srtContent,
            vttContent,
            guide,
            voiceAudioBase64: 'RkFLRV9BVURJT19kYXRh',
            minutesConsumed: 1,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

        if (init?.signal) {
          if (init.signal.aborted) {
            const err = new Error('The operation was aborted');
            err.name = 'AbortError';
            throw err;
          }
          return new Promise((resolve, reject) => {
            const onAbort = () => {
              const err = new Error('The operation was aborted');
              err.name = 'AbortError';
              reject(err);
            };
            init.signal?.addEventListener('abort', onAbort);
            setTimeout(() => {
              init.signal?.removeEventListener('abort', onAbort);
              resolve(resp);
            }, 10);
          });
        }

        return resp;
      }

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }) as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('initializes with default bilingual subtitle mode and english AI audio track', () => {
    const s = useAIStore.getState();
    expect(s.subtitleMode).toBe('bilingual');
    expect(s.selectedAudioTrack).toBe('english-ai');
    expect(s.liveCues).toHaveLength(0);
    expect(s.currentLiveCue).toBeNull();
  });

  it('generates standard SRT format subtitles with timestamps and bilingual lines', () => {
    const sampleCues: SubtitleCue[] = [
      {
        id: '1',
        startTime: 0,
        endTime: 4.5,
        banglaText: 'স্বাগতম টিউটোরিয়ালে',
        englishText: 'Welcome to the tutorial',
      },
      {
        id: '2',
        startTime: 5,
        endTime: 8.25,
        banglaText: 'রেকর্ডিং শুরু করুন',
        englishText: 'Start recording now',
      },
    ];

    const srt = generateSrt(sampleCues, 'bilingual');
    expect(srt).toContain('1\n00:00:00,000 --> 00:00:04,500');
    expect(srt).toContain('স্বাগতম টিউটোরিয়ালে\nWelcome to the tutorial');
    expect(srt).toContain('2\n00:00:05,000 --> 00:00:08,250');
  });

  it('generates standard WebVTT subtitles with WEBVTT header', () => {
    const sampleCues: SubtitleCue[] = [
      {
        id: '1',
        startTime: 1,
        endTime: 3,
        banglaText: 'বাংলা টেক্সট',
        englishText: 'English text',
      },
    ];

    const vtt = generateVtt(sampleCues);
    expect(vtt.startsWith('WEBVTT')).toBe(true);
    expect(vtt).toContain('00:00:01.000 --> 00:00:03.000');
    expect(vtt).toContain('English text');
  });

  it('assembles a structured Markdown step-by-step tutorial guide from clicks and cues', () => {
    const sampleCues: SubtitleCue[] = [
      {
        id: '1',
        startTime: 2,
        endTime: 6,
        banglaText: 'এখানে ক্লিক করে ড্যাশবোর্ড খুলুন',
        englishText: 'Click here to open the studio dashboard',
      },
    ];

    const sampleClicks: ClickEventLog[] = [
      {
        timestamp: 2.2,
        x: 0.5,
        y: 0.5,
        targetTag: 'BUTTON',
        targetText: 'Open Dashboard',
        actionDescription: 'Clicked on main dashboard launcher button',
      },
    ];

    const guide = generateStepByStepGuide('Studio Walkthrough', 60, sampleCues, sampleClicks);
    expect(guide.title).toBe('Studio Walkthrough');
    expect(guide.steps.length).toBeGreaterThan(0);
    expect(guide.markdownContent).toContain('# Studio Walkthrough');
    expect(guide.markdownContent).toContain('## Table of Contents');
    expect(guide.markdownContent).toContain('Spoken Instruction:');
  });

  it('enforces monthly AI minutes quota and prevents processing when exceeded', async () => {
    // Set user to exceed quota
    useAuthStore.setState({
      user: {
        id: 'user-1',
        email: 'test@versestudio.app',
        name: 'Test Creator',
        plan: 'free',
        aiMinutesUsed: 30, // 30 of 30 used
        aiMinutesLimit: 30,
        googleDriveConnected: true,
        createdAt: new Date().toISOString(),
      },
    });

    const store = useAIStore.getState();
    const success = await store.startProcessingAI('Quick Demo', 120);

    expect(success).toBe(false);
    expect(useAIStore.getState().quotaExceededWarning).toBe(true);
    expect(useAIStore.getState().processingState.status).toBe('error');
  });

  it('executes the full AI pipeline, updates progress, deducts quota, and saves assets', async () => {
    const store = useAIStore.getState();
    store.addClickEvent({
      timestamp: 3,
      x: 0.2,
      y: 0.4,
      targetTag: 'DIV',
      targetText: 'Setup Card',
    });

    const success = await store.startProcessingAI('Complete 4K Tutorial', 15);

    expect(success).toBe(true);
    const finalState = useAIStore.getState();
    expect(finalState.processingState.status).toBe('completed');
    expect(finalState.processingState.progress).toBe(100);
    expect(finalState.liveCues.length).toBeGreaterThan(0);
    expect(finalState.srtContent).not.toBeNull();
    expect(finalState.generatedGuide).not.toBeNull();

    // Verify quota deduction (15s = 1 minute deducted from 5 used -> 6 used)
    const user = useAuthStore.getState().user;
    expect(user?.aiMinutesUsed).toBe(6);
  });

  it('cancels an in-flight AI processing run', async () => {
    const store = useAIStore.getState();
    const promise = store.startProcessingAI('Test Cancel', 60);

    // Cancel immediately
    store.cancelProcessing();
    await promise;

    expect(useAIStore.getState().isProcessingModalOpen).toBe(false);
    expect(useAIStore.getState().processingState.status).toBe('idle');
  });
});
