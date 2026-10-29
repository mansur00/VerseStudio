import type { SubtitleCue, ClickEventLog, StepByStepGuide, GuideStep } from '@verse-studio/shared';

export function formatSrtTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const millis = Math.floor((totalSeconds % 1) * 1000);

  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(millis, 3)}`;
}

export function formatVttTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const millis = Math.floor((totalSeconds % 1) * 1000);

  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(millis, 3)}`;
}

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

export function generateVtt(cues: SubtitleCue[]): string {
  const body = cues
    .map((cue, index) => {
      return `${index + 1}\n${formatVttTime(cue.startTime)} --> ${formatVttTime(cue.endTime)}\n${cue.englishText}\n`;
    })
    .join('\n');

  return `WEBVTT\n\n${body}`;
}

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
