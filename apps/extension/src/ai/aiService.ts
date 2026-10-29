import type { SubtitleCue, ClickEventLog, StepByStepGuide, GuideStep } from '@verse-studio/shared';
import { mixAudioWithDucking } from './audioDuckingMixer';
import { getApiBaseUrl } from '../config/env';

export interface AIProcessResult {
  cues: SubtitleCue[];
  srtContent: string;
  vttContent: string;
  guide: StepByStepGuide;
  audioBlob?: Blob;
  mixedAudioBlob?: Blob;
  minutesConsumed?: number;
}

const getApiBase = () => {
  const envUrl = getApiBaseUrl();
  if (envUrl) return envUrl;
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (typeof window !== 'undefined' && (window as any).__VS_API_BASE__) {
    return (window as any).__VS_API_BASE__;
  }
  return '';
};

/**
 * Format seconds into SRT timestamp format: HH:MM:SS,mmm
 */
export function formatSrtTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const millis = Math.floor((totalSeconds % 1) * 1000);

  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(millis, 3)}`;
}

/**
 * Format seconds into VTT timestamp format: HH:MM:SS.mmm
 */
export function formatVttTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const millis = Math.floor((totalSeconds % 1) * 1000);

  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(millis, 3)}`;
}

/**
 * Generate standard .srt subtitle string from cues
 */
export function generateSrt(cues: SubtitleCue[], mode: 'bilingual' | 'english' | 'bangla' = 'bilingual'): string {
  return cues
    .map((cue, index) => {
      let text = '';
      if (mode === 'bilingual') {
        text = `${cue.banglaText}\n${cue.englishText}`;
      } else if (mode === 'english') {
        text = cue.englishText;
      } else {
        text = cue.banglaText;
      }

      return `${index + 1}\n${formatSrtTime(cue.startTime)} --> ${formatSrtTime(cue.endTime)}\n${text}\n`;
    })
    .join('\n');
}

/**
 * Generate standard WebVTT string from cues
 */
export function generateVtt(cues: SubtitleCue[]): string {
  const body = cues
    .map((cue, index) => {
      return `${index + 1}\n${formatVttTime(cue.startTime)} --> ${formatVttTime(cue.endTime)}\n${cue.englishText}\n`;
    })
    .join('\n');

  return `WEBVTT\n\n${body}`;
}

/**
 * Assemble a markdown tutorial guide from click events and transcribed audio cues
 */
export function generateStepByStepGuide(
  title: string,
  durationSeconds: number,
  cues: SubtitleCue[],
  clicks: ClickEventLog[] = []
): StepByStepGuide {
  const steps: GuideStep[] = [];
  const createdAt = new Date().toISOString();

  interface UnifiedEvent {
    timestamp: number;
    type: 'click' | 'speech';
    click?: ClickEventLog;
    cue?: SubtitleCue;
  }

  const events: UnifiedEvent[] = [
    ...clicks.map((c) => ({ timestamp: c.timestamp, type: 'click' as const, click: c })),
    ...cues.map((q) => ({ timestamp: q.startTime, type: 'speech' as const, cue: q })),
  ].sort((a, b) => a.timestamp - b.timestamp);

  let currentStepIndex = 1;
  let lastTimestamp = -10;

  for (const event of events) {
    if (event.timestamp - lastTimestamp >= 4) {
      lastTimestamp = event.timestamp;
      const mm = String(Math.floor(event.timestamp / 60)).padStart(2, '0');
      const ss = String(Math.floor(event.timestamp % 60)).padStart(2, '0');
      const timeFormatted = `[${mm}:${ss}]`;

      let stepTitle = `Action ${currentStepIndex}`;
      let stepDesc = 'User performed studio interaction on canvas.';

      if (event.type === 'click' && event.click) {
        stepTitle = event.click.actionDescription || `Click ${event.click.targetTag || 'element'}`;
        stepDesc = `User clicked at position (${Math.round(event.click.x * 100)}%, ${Math.round(
          event.click.y * 100
        )}%) on screen.`;
      } else if (event.type === 'speech' && event.cue) {
        stepTitle = `Explanation ${currentStepIndex}`;
        stepDesc = `Narrator explanation: "${event.cue.englishText}"`;
      }

      steps.push({
        stepNumber: currentStepIndex,
        timestamp: event.timestamp,
        timeFormatted,
        title: stepTitle,
        description: stepDesc,
        banglaTranscript: event.cue?.banglaText,
        englishTranscript: event.cue?.englishText,
      });

      currentStepIndex++;
    }
  }

  if (steps.length === 0) {
    steps.push({
      stepNumber: 1,
      timestamp: 0,
      timeFormatted: '[00:00]',
      title: 'Recording Overview',
      description: 'Studio recording session recorded at 4K 60 FPS.',
    });
  }

  const markdownContent = [
    `# ${title}`,
    ``,
    `*Generated automatically with VerseStudio 4K Pro Bilingual AI*`,
    `*Date: ${new Date(createdAt).toLocaleDateString()} | Duration: ${Math.floor(durationSeconds / 60)}m ${Math.floor(
      durationSeconds % 60
    )}s*`,
    ``,
    `---`,
    ``,
    `## Table of Contents`,
    ...steps.map((s) => `- [Step ${s.stepNumber}: ${s.title}](#step-${s.stepNumber}) \`${s.timeFormatted}\``),
    ``,
    `---`,
    ``,
    `## Step-by-Step Instructions`,
    ``,
    ...steps.map((s) => {
      let stepMd = `### Step ${s.stepNumber}: ${s.title}\n`;
      stepMd += `**Timestamp:** \`${s.timeFormatted}\`\n\n`;
      stepMd += `${s.description}\n\n`;
      if (s.englishTranscript) {
        stepMd += `> **Spoken Instruction:** "${s.englishTranscript}"\n`;
      }
      if (s.banglaTranscript) {
        stepMd += `> *Bangla Audio:* "${s.banglaTranscript}"\n\n`;
      }
      return stepMd;
    }),
    `---`,
    `*Exported from VerseStudio. High-definition tutorial guide.*`,
  ].join('\n');

  return {
    title,
    createdAt,
    durationSeconds,
    steps,
    markdownContent,
  };
}

/**
 * AI Service for Speech-to-Text, Neural Voice, and Guide Generation
 */
export class AIService {
  /**
   * Process a recording session through the server AI pipeline
   */
  public static async processRecording(
    title: string,
    durationSeconds: number,
    clicks: ClickEventLog[] = [],
    onProgress?: (progress: number, stepText: string) => void,
    abortSignal?: AbortSignal,
    options?: {
      token?: string;
      voicePersona?: string;
      originalAudioBlob?: Blob;
      testMode?: boolean;
    }
  ): Promise<AIProcessResult> {
    if (abortSignal?.aborted) {
      throw new Error('AI Processing cancelled');
    }

    onProgress?.(15, 'Transcribing Bengali speech from audio stream via server...');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (options?.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    }

    let audioBase64: string | undefined;
    if (options?.originalAudioBlob) {
      const buffer = await options.originalAudioBlob.arrayBuffer();
      audioBase64 = Buffer.from(buffer).toString('base64');
    }

    onProgress?.(35, 'Contacting Gemini for Speech-to-Text and translation...');

    const res = await fetch(`${getApiBase()}/api/ai/process`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title,
        durationSeconds,
        clicks,
        voicePersona: options?.voicePersona,
        audioBase64,
        testMode: options?.testMode ?? false,
      }),
      signal: abortSignal,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `AI processing failed with HTTP ${res.status}`);
    }

    const data = await res.json();
    onProgress?.(70, 'Received bilingual subtitles and transcript from server...');

    let voiceAudioBlob: Blob | undefined;
    let mixedAudioBlob: Blob | undefined;

    if (data.voiceAudioBase64) {
      onProgress?.(85, 'Synthesizing English neural voice audio stream...');
      const byteChars = atob(data.voiceAudioBase64);
      const byteNums = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNums[i] = byteChars.charCodeAt(i);
      }
      voiceAudioBlob = new Blob([new Uint8Array(byteNums)], { type: 'audio/webm' });

      if (options?.originalAudioBlob) {
        onProgress?.(95, 'Mixing audio: ducking original Bangla track to ~20% under English...');
        mixedAudioBlob = await mixAudioWithDucking(options.originalAudioBlob, voiceAudioBlob);
      }
    }

    onProgress?.(100, 'AI processing complete!');

    return {
      cues: data.cues,
      srtContent: data.srtContent,
      vttContent: data.vttContent,
      guide: data.guide,
      audioBlob: voiceAudioBlob,
      mixedAudioBlob,
      minutesConsumed: data.minutesConsumed,
    };
  }
}
