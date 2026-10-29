import { describe, it, expect, beforeEach } from 'vitest';
import { FakeAiProvider, GeminiSTTProvider, ElevenLabsTTSProvider } from '../lib/ai/aiProviders';
import { generateSrt, generateVtt, generateStepByStepGuide } from '../lib/ai/aiGuideBuilder';
import { ServerDatabase } from '../lib/serverDb';
import type { ClickEventLog } from '@verse-studio/shared';

describe('Server-Side AI Pipeline & Quotas (Pass D)', () => {
  const fakeProvider = new FakeAiProvider();
  let testUserId = 'usr_ai_test_creator';

  beforeEach(async () => {
    // Seed user in database
    ServerDatabase.seedProfile({
      id: testUserId,
      email: 'ai.creator@versestudio.app',
      name: 'AI Creator',
      plan: 'free',
      status: 'active',
      ai_minutes_used: 10,
      ai_minutes_limit: 30,
      google_drive_connected: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  it('generates properly formatted bilingual cues from fake STT provider', async () => {
    const durationSeconds = 30;
    const cues = await fakeProvider.transcribeAndTranslate('BASE64_AUDIO_SAMPLE', durationSeconds);

    expect(cues.length).toBeGreaterThan(0);
    expect(cues[0]).toHaveProperty('startTime');
    expect(cues[0]).toHaveProperty('endTime');
    expect(cues[0]).toHaveProperty('banglaText');
    expect(cues[0]).toHaveProperty('englishText');
    expect(cues[0].endTime).toBeLessThanOrEqual(durationSeconds);

    // Verify SRT output
    const srt = generateSrt(cues, 'bilingual');
    expect(srt).toContain('1\n00:00:00,000 --> 00:00:04,500');
    expect(srt).toContain(cues[0].banglaText);
    expect(srt).toContain(cues[0].englishText);

    // Verify VTT output
    const vtt = generateVtt(cues);
    expect(vtt.startsWith('WEBVTT')).toBe(true);
  });

  it('generates structured step-by-step markdown tutorial from speech and clicks', async () => {
    const durationSeconds = 60;
    const cues = await fakeProvider.transcribeAndTranslate('BASE64_AUDIO_SAMPLE', durationSeconds);
    const clicks: ClickEventLog[] = [
      {
        timestamp: 5,
        x: 0.3,
        y: 0.4,
        targetTag: 'BUTTON',
        targetText: 'Start Capture',
        actionDescription: 'Clicked Start Capture button',
      },
    ];

    const guide = generateStepByStepGuide('AI Masterclass', durationSeconds, cues, clicks);
    expect(guide.title).toBe('AI Masterclass');
    expect(guide.steps.length).toBeGreaterThan(0);
    expect(guide.markdownContent).toContain('# AI Masterclass');
    expect(guide.markdownContent).toContain('## Table of Contents');
    expect(guide.markdownContent).toContain('Clicked Start Capture button');
  });

  it('synthesizes synthetic neural English voice track', async () => {
    const audioBase64 = await fakeProvider.synthesizeEnglishVoice('Welcome to the studio.');
    expect(audioBase64).toBeDefined();
    expect(typeof audioBase64).toBe('string');
    expect(audioBase64.length).toBeGreaterThan(0);
  });

  it('fails with clear error when Gemini or ElevenLabs keys are unconfigured in production', async () => {
    const originalGeminiKey = process.env.GEMINI_API_KEY;
    const originalElevenKey = process.env.ELEVENLABS_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.ELEVENLABS_API_KEY;

    try {
      const gemini = new GeminiSTTProvider(undefined);
      await expect(gemini.transcribeAndTranslate('sample', 10)).rejects.toThrow(
        /GEMINI_API_KEY not configured on server/
      );

      const eleven = new ElevenLabsTTSProvider(undefined);
      await expect(eleven.synthesizeEnglishVoice('sample')).rejects.toThrow(
        /ELEVENLABS_API_KEY not configured on server/
      );
    } finally {
      process.env.GEMINI_API_KEY = originalGeminiKey;
      process.env.ELEVENLABS_API_KEY = originalElevenKey;
    }
  });

  it.skipIf(!process.env.GEMINI_API_KEY || !process.env.ELEVENLABS_API_KEY)(
    'real provider pipeline test [needs human + keys]',
    async () => {
      const gemini = new GeminiSTTProvider(process.env.GEMINI_API_KEY);
      const eleven = new ElevenLabsTTSProvider(process.env.ELEVENLABS_API_KEY);

      const cues = await gemini.transcribeAndTranslate('SAMPLE_AUDIO', 10);
      expect(cues).toBeDefined();

      const voice = await eleven.synthesizeEnglishVoice('Hello world');
      expect(voice).toBeDefined();
    }
  );
});
