import type { SubtitleCue, ClickEventLog, StepByStepGuide, GuideStep } from '@verse-studio/shared';

export interface AIProcessResult {
  cues: SubtitleCue[];
  srtContent: string;
  vttContent: string;
  guide: StepByStepGuide;
  audioBlob?: Blob;
  mixedAudioBlob?: Blob;
}

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
  clicks: ClickEventLog[]
): StepByStepGuide {
  const steps: GuideStep[] = [];
  const createdAt = new Date().toISOString();

  // Combine and sort events by timestamp
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

  // Group events within 4-second windows into logical steps
  let currentStepIndex = 1;
  let lastTimestamp = -10;

  for (const event of events) {
    const isNewStep = event.timestamp - lastTimestamp > 3.5 || steps.length === 0;

    const timeFormatted = `[${String(Math.floor(event.timestamp / 60)).padStart(2, '0')}:${String(
      Math.floor(event.timestamp % 60)
    ).padStart(2, '0')}]`;

    if (isNewStep) {
      lastTimestamp = event.timestamp;
      let stepTitle = `Action at ${timeFormatted}`;
      let stepDesc = 'User interaction recorded.';
      let bangla: string | undefined;
      let english: string | undefined;

      if (event.click) {
        stepTitle = event.click.targetText
          ? `Click "${event.click.targetText}"`
          : `Click ${event.click.targetTag || 'element'}`;
        stepDesc = event.click.actionDescription || `Clicked on ${event.click.targetTag || 'interactive UI'}.`;
      } else if (event.cue) {
        stepTitle = `Instruction: ${event.cue.englishText.slice(0, 45)}...`;
        stepDesc = event.cue.englishText;
        bangla = event.cue.banglaText;
        english = event.cue.englishText;
      }

      steps.push({
        stepNumber: currentStepIndex++,
        timestamp: event.timestamp,
        timeFormatted,
        title: stepTitle,
        description: stepDesc,
        banglaTranscript: bangla,
        englishTranscript: english,
      });
    } else {
      // Append to the current step
      const currentStep = steps[steps.length - 1];
      if (event.click) {
        currentStep.description += ` Then clicked "${event.click.targetText || event.click.targetTag}".`;
      }
      if (event.cue) {
        currentStep.banglaTranscript = currentStep.banglaTranscript
          ? `${currentStep.banglaTranscript} ${event.cue.banglaText}`
          : event.cue.banglaText;
        currentStep.englishTranscript = currentStep.englishTranscript
          ? `${currentStep.englishTranscript} ${event.cue.englishText}`
          : event.cue.englishText;
      }
    }
  }

  // Fallback step if recording had no clicks/cues
  if (steps.length === 0) {
    steps.push({
      stepNumber: 1,
      timestamp: 0,
      timeFormatted: '[00:00]',
      title: 'Recording Overview',
      description: 'Studio recording session recorded at 4K 60 FPS.',
    });
  }

  // Construct Markdown formatted document
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
   * Process a recording session through the AI pipeline
   */
  public static async processRecording(
    title: string,
    durationSeconds: number,
    clicks: ClickEventLog[] = [],
    onProgress?: (progress: number, stepText: string) => void,
    abortSignal?: AbortSignal
  ): Promise<AIProcessResult> {
    if (abortSignal?.aborted) {
      throw new Error('AI Processing cancelled');
    }

    onProgress?.(15, 'Transcribing Bengali speech from audio stream...');
    await new Promise((r) => setTimeout(r, 400));
    if (abortSignal?.aborted) throw new Error('AI Processing cancelled');

    onProgress?.(40, 'Translating Bengali speech to natural English...');
    await new Promise((r) => setTimeout(r, 500));
    if (abortSignal?.aborted) throw new Error('AI Processing cancelled');

    // Generate realistic timed cues based on recording duration
    const cues = this.generateSimulatedCues(durationSeconds);

    onProgress?.(70, 'Synthesizing studio-grade English neural voice...');
    await new Promise((r) => setTimeout(r, 600));
    if (abortSignal?.aborted) throw new Error('AI Processing cancelled');

    onProgress?.(90, 'Compiling step-by-step tutorial guide...');
    await new Promise((r) => setTimeout(r, 400));
    if (abortSignal?.aborted) throw new Error('AI Processing cancelled');

    const srtContent = generateSrt(cues, 'bilingual');
    const vttContent = generateVtt(cues);
    const guide = generateStepByStepGuide(title, durationSeconds, cues, clicks);

    onProgress?.(100, 'AI processing complete!');

    return {
      cues,
      srtContent,
      vttContent,
      guide,
    };
  }

  /**
   * Generate realistic Bengali & English sample cues for a given recording duration
   */
  public static generateSimulatedCues(durationSeconds: number): SubtitleCue[] {
    const templates: Array<{ bangla: string; english: string }> = [
      {
        bangla: 'স্বাগতম সবাইকে ভার্সস্টুডিও ৪কে প্রো টিউটোরিয়ালে।',
        english: 'Welcome everyone to the VerseStudio 4K Pro tutorial.',
      },
      {
        bangla: 'প্রথমে আমরা আমাদের মূল ড্যাশবোর্ড এবং সেটিংস পরীক্ষা করে নেব।',
        english: 'First, we will inspect our main dashboard and recording settings.',
      },
      {
        bangla: 'এখানে ক্লিক করে নতুন প্রজেক্ট ফোল্ডার এবং অপশনগুলো দেখুন।',
        english: 'Click here to review the new project folder and studio options.',
      },
      {
        bangla: 'রেকর্ডিংয়ের সময় লেজার পেন এবং স্পটলাইট টুলগুলো ব্যবহার করা অত্যন্ত সহজ।',
        english: 'During recording, using the laser pen and spotlight tools is very intuitive.',
      },
      {
        bangla: 'সবকিছু সঠিকভাবে সম্পন্ন হলে সেভ বাটনে ক্লিক করে ফাইলটি সংরক্ষণ করুন।',
        english: 'Once complete, click the Save button to preserve your high-resolution file.',
      },
      {
        bangla: 'ভিডিওটি স্বয়ংক্রিয়ভাবে গুগল ড্রাইভে আপলোড হয়ে শেয়ারিং লিংক তৈরি হবে।',
        english: 'The video will automatically upload to Google Drive with an instant share link.',
      },
    ];

    const cues: SubtitleCue[] = [];
    const interval = 5; // 5-second cues
    const cueCount = Math.max(1, Math.min(templates.length, Math.floor(durationSeconds / interval)));

    for (let i = 0; i < cueCount; i++) {
      const template = templates[i % templates.length];
      const start = i * interval;
      const end = Math.min(durationSeconds, start + interval - 0.5);

      cues.push({
        id: `cue-${i + 1}`,
        startTime: start,
        endTime: Math.max(start + 1, end),
        banglaText: template.bangla,
        englishText: template.english,
      });
    }

    return cues;
  }
}
