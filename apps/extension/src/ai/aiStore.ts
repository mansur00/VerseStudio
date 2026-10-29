import { create } from 'zustand';
import type {
  SubtitleMode,
  SubtitleCue,
  ClickEventLog,
  StepByStepGuide,
  AIProcessingState,
  AudioTrackOption,
} from '@verse-studio/shared';
import { AIService, generateSrt, generateStepByStepGuide } from './aiService';
import { useAuthStore } from '../auth/authStore';

export interface AIState {
  subtitleMode: SubtitleMode;
  selectedAudioTrack: AudioTrackOption;
  liveCues: SubtitleCue[];
  currentLiveCue: SubtitleCue | null;
  recordedClicks: ClickEventLog[];
  processingState: AIProcessingState;
  generatedGuide: StepByStepGuide | null;
  srtContent: string | null;
  vttContent: string | null;
  isProcessingModalOpen: boolean;
  isGuideModalOpen: boolean;
  quotaExceededWarning: boolean;

  // Actions
  setSubtitleMode: (mode: SubtitleMode) => void;
  setSelectedAudioTrack: (track: AudioTrackOption) => void;
  addClickEvent: (event: ClickEventLog) => void;
  clearSessionEvents: () => void;
  updateLiveCueForTimestamp: (timeSeconds: number) => void;
  startProcessingAI: (title: string, durationSeconds: number) => Promise<boolean>;
  cancelProcessing: () => void;
  setIsProcessingModalOpen: (open: boolean) => void;
  setIsGuideModalOpen: (open: boolean) => void;
  exportSrtDownload: (filename?: string) => void;
  exportGuideMarkdownDownload: (filename?: string) => void;
}

let activeAbortController: AbortController | null = null;

export const useAIStore = create<AIState>((set, get) => ({
  subtitleMode: 'bilingual',
  selectedAudioTrack: 'english-ai',
  liveCues: [],
  currentLiveCue: null,
  recordedClicks: [],
  processingState: {
    status: 'idle',
    progress: 0,
    activeStepText: '',
  },
  generatedGuide: null,
  srtContent: null,
  vttContent: null,
  isProcessingModalOpen: false,
  isGuideModalOpen: false,
  quotaExceededWarning: false,

  setSubtitleMode: (mode) => set({ subtitleMode: mode }),
  setSelectedAudioTrack: (track) => set({ selectedAudioTrack: track }),

  addClickEvent: (event) =>
    set((state) => ({
      recordedClicks: [...state.recordedClicks, event],
    })),

  clearSessionEvents: () =>
    set({
      recordedClicks: [],
      liveCues: [],
      currentLiveCue: null,
      generatedGuide: null,
      srtContent: null,
      vttContent: null,
      quotaExceededWarning: false,
      processingState: { status: 'idle', progress: 0, activeStepText: '' },
    }),

  updateLiveCueForTimestamp: (timeSeconds) => {
    const { liveCues, subtitleMode } = get();
    if (subtitleMode === 'off') {
      set({ currentLiveCue: null });
      return;
    }

    const activeCue = liveCues.find(
      (c) => timeSeconds >= c.startTime && timeSeconds <= c.endTime
    );
    set({ currentLiveCue: activeCue || null });
  },

  startProcessingAI: async (title: string, durationSeconds: number): Promise<boolean> => {
    const auth = useAuthStore.getState();
    const durationMinutes = Math.max(1, Math.ceil(durationSeconds / 60));

    // Quota verification
    if (auth.user) {
      const remaining = auth.user.aiMinutesLimit - auth.user.aiMinutesUsed;
      if (remaining < durationMinutes) {
        set({
          quotaExceededWarning: true,
          processingState: {
            status: 'error',
            progress: 0,
            activeStepText: '',
            error: 'AI minute quota exceeded for your plan tier.',
          },
        });
        return false;
      }
    }

    // Initialize processing run
    if (activeAbortController) {
      activeAbortController.abort();
    }
    activeAbortController = new AbortController();

    set({
      isProcessingModalOpen: true,
      quotaExceededWarning: false,
      processingState: {
        status: 'transcribing',
        progress: 10,
        activeStepText: 'Starting bilingual speech recognition...',
      },
    });

    try {
      const clicks = get().recordedClicks;
      const result = await AIService.processRecording(
        title,
        durationSeconds,
        clicks,
        (progress, activeStepText) => {
          let status: AIProcessingState['status'] = 'transcribing';
          if (progress >= 30 && progress < 60) status = 'translating';
          else if (progress >= 60 && progress < 85) status = 'generating-voice';
          else if (progress >= 85) status = 'generating-guide';

          set({
            processingState: {
              status,
              progress,
              activeStepText,
            },
          });
        },
        activeAbortController.signal,
        {
          token: auth.session?.token,
          testMode: process.env.NODE_ENV === 'test' || !auth.user,
        }
      );

      // Deduct used AI minutes from auth store
      if (auth.user) {
        useAuthStore.setState({
          user: {
            ...auth.user,
            aiMinutesUsed: Math.min(
              auth.user.aiMinutesLimit,
              auth.user.aiMinutesUsed + durationMinutes
            ),
          },
        });
      }

      set({
        liveCues: result.cues,
        currentLiveCue: result.cues[0] || null,
        srtContent: result.srtContent,
        vttContent: result.vttContent,
        generatedGuide: result.guide,
        processingState: {
          status: 'completed',
          progress: 100,
          activeStepText: 'All AI assets generated successfully!',
        },
      });

      return true;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Processing failed';
      const isAborted =
        (err instanceof Error && (err.name === 'AbortError' || err.message.includes('aborted') || err.message.includes('cancelled'))) ||
        errorMsg === 'AI Processing cancelled';
      if (isAborted) {
        set({
          processingState: {
            status: 'idle',
            progress: 0,
            activeStepText: 'Processing cancelled.',
          },
        });
      } else {
        set({
          processingState: {
            status: 'error',
            progress: 0,
            activeStepText: '',
            error: errorMsg,
          },
        });
      }
      return false;
    }
  },

  cancelProcessing: () => {
    if (activeAbortController) {
      activeAbortController.abort();
      activeAbortController = null;
    }
    set({
      isProcessingModalOpen: false,
      processingState: {
        status: 'idle',
        progress: 0,
        activeStepText: '',
      },
    });
  },

  setIsProcessingModalOpen: (open) => set({ isProcessingModalOpen: open }),
  setIsGuideModalOpen: (open) => set({ isGuideModalOpen: open }),

  exportSrtDownload: (filename = 'subtitles.srt') => {
    const { srtContent, liveCues } = get();
    const content = srtContent || generateSrt(liveCues, 'bilingual');
    if (!content) return;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.srt') ? filename : `${filename}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  exportGuideMarkdownDownload: (filename = 'Tutorial-Guide.md') => {
    const { generatedGuide, liveCues, recordedClicks } = get();
    let content = generatedGuide?.markdownContent;

    if (!content) {
      const fallbackGuide = generateStepByStepGuide('Studio Recording Guide', 60, liveCues, recordedClicks);
      content = fallbackGuide.markdownContent;
    }

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.md') ? filename : `${filename}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
}));
