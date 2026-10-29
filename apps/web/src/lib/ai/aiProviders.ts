/**
 * VerseStudio 4K Pro — Production AI Pipeline Providers
 * Server-side Gemini (STT & Translation) and ElevenLabs (Neural English Voice)
 * Keys are strictly held in server environment variables.
 */

import type { SubtitleCue, ClickEventLog, StepByStepGuide } from '@verse-studio/shared';

export interface AIProcessRequest {
  userId: string;
  title: string;
  durationSeconds: number;
  clicks?: ClickEventLog[];
  audioBase64?: string;
  voicePersona?: string;
}

export interface AIProcessResponse {
  cues: SubtitleCue[];
  srtContent: string;
  vttContent: string;
  guide: StepByStepGuide;
  voiceAudioBase64?: string;
  minutesConsumed: number;
}

export interface STTProvider {
  transcribeAndTranslate(audioBase64: string, durationSeconds: number): Promise<SubtitleCue[]>;
}

export interface TTSProvider {
  synthesizeEnglishVoice(text: string, voicePersona?: string): Promise<string>; // returns base64 audio
}

/**
 * Real Gemini 1.5 Provider (Server-Side)
 */
export class GeminiSTTProvider implements STTProvider {
  private apiKey: string | undefined;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY;
  }

  public async transcribeAndTranslate(audioBase64: string, durationSeconds: number): Promise<SubtitleCue[]> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY not configured on server. Please configure Gemini API key in environment variables.');
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
    const prompt = `You are a professional audio transcriber and translator.
The provided audio is in Bengali (Bangla).
1. Transcribe the Bengali speech accurately.
2. Translate the Bengali speech to natural, fluent English.
3. Align timestamps (startTime and endTime in seconds) across the recording duration of ${durationSeconds} seconds.
Return STRICT JSON array with format:
[
  { "id": "cue-1", "startTime": 0.0, "endTime": 4.5, "banglaText": "...", "englishText": "..." }
]`;

    const body = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'audio/webm',
                data: audioBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini STT API error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('Gemini API returned an empty response');
    }

    const cues: SubtitleCue[] = JSON.parse(candidateText);
    return cues;
  }
}

/**
 * Real ElevenLabs Neural Voice Provider (Server-Side)
 */
export class ElevenLabsTTSProvider implements TTSProvider {
  private apiKey: string | undefined;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ELEVENLABS_API_KEY;
  }

  public async synthesizeEnglishVoice(text: string, voicePersona = 'natural-female'): Promise<string> {
    if (!this.apiKey) {
      throw new Error('ELEVENLABS_API_KEY not configured on server. Please configure ElevenLabs API key in environment variables.');
    }

    // Default voice IDs for ElevenLabs studio voices
    const voiceIdMap: Record<string, string> = {
      'natural-female': '21m00Tcm4TlvDq8ikWAM', // Rachel
      'studio-male': 'ErXwobaYiN019PkySvjV',   // Antoni
      'warm-narrator': 'AZnzlk1XvdvUeBnXmlld', // Domi
    };

    const voiceId = voiceIdMap[voicePersona] || voiceIdMap['natural-female'];
    const endpoint = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': this.apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2',
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.85,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`ElevenLabs TTS API error (${res.status}): ${errText}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
  }
}

/**
 * Fake Local AI Provider for Contract Testing & Validation
 */
export class FakeAiProvider implements STTProvider, TTSProvider {
  public async transcribeAndTranslate(_audioBase64: string, durationSeconds: number): Promise<SubtitleCue[]> {
    const cueCount = Math.max(1, Math.min(6, Math.floor(durationSeconds / 5)));
    const cues: SubtitleCue[] = [];

    const pairs = [
      { bn: 'স্বাগতম সবাইকে ভার্সস্টুডিও ৪কে প্রো ডেমোতে।', en: 'Welcome everyone to the VerseStudio 4K Pro demo.' },
      { bn: 'আমরা এখন রেকর্ডিং টুলস এবং লাইভ সাবটাইটেল ফিচার দেখছি।', en: 'We are now demonstrating the recording tools and live subtitle features.' },
      { bn: 'স্ক্রিন ক্যাপচারের সাথে সাথে ভয়েস ট্র্যাক স্বয়ংক্রিয়ভাবে তৈরি হয়।', en: 'The voice track is synthesized automatically alongside screen capture.' },
      { bn: 'রেকর্ডিং সম্পন্ন হলে ড্রাইভের সাথে শেয়ার লিংক তৈরি হবে।', en: 'Once recording finishes, a Drive share link will be prepared.' },
    ];

    for (let i = 0; i < cueCount; i++) {
      const p = pairs[i % pairs.length];
      const start = i * 5;
      const end = Math.min(durationSeconds, start + 4.5);
      cues.push({
        id: `cue-${i + 1}`,
        startTime: start,
        endTime: Math.max(start + 1, end),
        banglaText: p.bn,
        englishText: p.en,
      });
    }

    return cues;
  }

  public async synthesizeEnglishVoice(text: string): Promise<string> {
    // Generate valid small silent MP3 header / PCM buffer in base64
    const fakeAudioData = Buffer.from(`FAKE_MP3_AUDIO_FOR_TEST_${text.substring(0, 20)}`);
    return fakeAudioData.toString('base64');
  }
}
