import { NextRequest, NextResponse } from 'next/server';
import { requireUserSession } from '../../../../lib/userAuthMiddleware';
import { ServerDatabase } from '../../../../lib/serverDb';
import {
  GeminiSTTProvider,
  ElevenLabsTTSProvider,
  FakeAiProvider,
  STTProvider,
  TTSProvider,
} from '../../../../lib/ai/aiProviders';
import { generateSrt, generateVtt, generateStepByStepGuide } from '../../../../lib/ai/aiGuideBuilder';

export async function POST(req: NextRequest) {
  try {
    const auth = requireUserSession(req);
    if ('error' in auth) return auth.error;

    const body = await req.json();
    const { title, durationSeconds, clicks = [], audioBase64, voicePersona, testMode } = body;

    if (!title || durationSeconds === undefined || durationSeconds < 0) {
      return NextResponse.json({ error: 'Title and durationSeconds are required' }, { status: 400 });
    }

    // 1. Fetch user profile and check plan quota
    const { users } = await ServerDatabase.getUsers('', 'all', 'all');
    const user = users.find((u) => u.id === auth.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const minutesNeeded = Math.max(1, Math.ceil(durationSeconds / 60));
    const quotaLimit = user.plan === 'pro' ? 300 : 30;
    const currentUsed = user.ai_minutes_used || 0;

    if (currentUsed + minutesNeeded > quotaLimit) {
      return NextResponse.json(
        {
          error: `Monthly AI quota exceeded. Used: ${currentUsed}m / Limit: ${quotaLimit}m. You need ${minutesNeeded}m for this recording. Please upgrade to Pro.`,
          quotaLimit,
          currentUsed,
          minutesNeeded,
        },
        { status: 403 }
      );
    }

    // 2. Select AI providers
    let sttProvider: STTProvider;
    let ttsProvider: TTSProvider;

    if (testMode === true || process.env.USE_FAKE_AI === 'true') {
      const fake = new FakeAiProvider();
      sttProvider = fake;
      ttsProvider = fake;
    } else {
      if (!process.env.GEMINI_API_KEY || !process.env.ELEVENLABS_API_KEY) {
        return NextResponse.json(
          {
            error:
              'AI Service unconfigured: GEMINI_API_KEY and ELEVENLABS_API_KEY environment variables must be configured on the server.',
          },
          { status: 503 }
        );
      }
      sttProvider = new GeminiSTTProvider(process.env.GEMINI_API_KEY);
      ttsProvider = new ElevenLabsTTSProvider(process.env.ELEVENLABS_API_KEY);
    }

    // 3. Execute Speech-to-Text & Translation
    const cues = await sttProvider.transcribeAndTranslate(audioBase64 || '', durationSeconds);

    // 4. Synthesize English voice
    const fullEnglishScript = cues.map((c) => c.englishText).join(' ');
    const voiceAudioBase64 = await ttsProvider.synthesizeEnglishVoice(fullEnglishScript, voicePersona);

    // 5. Build Subtitles & Guide
    const srtContent = generateSrt(cues, 'bilingual');
    const vttContent = generateVtt(cues);
    const guide = generateStepByStepGuide(title, durationSeconds, cues, clicks);

    // 6. Deduct minutes and update DB
    user.ai_minutes_used = currentUsed + minutesNeeded;
    user.updated_at = new Date().toISOString();

    return NextResponse.json({
      success: true,
      cues,
      srtContent,
      vttContent,
      guide,
      voiceAudioBase64,
      minutesConsumed: minutesNeeded,
      newQuotaUsed: user.ai_minutes_used,
      quotaLimit,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'AI processing pipeline failed' }, { status: 500 });
  }
}
