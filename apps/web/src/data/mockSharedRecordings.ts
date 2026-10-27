import { SharedRecordingData } from '@verse-studio/shared';

export const MOCK_SHARED_RECORDINGS: Record<string, SharedRecordingData> = {
  'demo-recording': {
    id: 'demo-recording',
    title: 'Deploying High-Performance Next.js 14 to Cloud Infrastructure',
    driveFileId: '1vVerseStudioSampleDriveFile4K60',
    driveEmbedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0',
    driveViewUrl: 'https://drive.google.com/file/d/1vVerseStudioSampleDriveFile4K60/view?usp=sharing',
    durationSeconds: 342, // 5m 42s
    resolution: '4k',
    fps: 60,
    authorName: 'Alex Rahman',
    authorAvatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    createdAt: '2026-10-25T14:30:00Z',
    viewsCount: 1420,
    subtitlesVtt: `WEBVTT

00:00:01.000 --> 00:00:04.500
আজকে আমরা দেখব কিভাবে ক্লাউডে ৪কে ভিডিও স্ট্রিম ডিপ্লয় করতে হয়।
Today we will see how to deploy 4K video streaming to cloud infrastructure.

00:00:05.000 --> 00:00:09.200
প্রথমে আমরা ডিপ্লয়মেন্ট কনফিগ ফাইলটি ওপেন করব।
First, we will open the deployment configuration file.

00:00:09.800 --> 00:00:14.000
এখানে এনভায়রনমেন্ট ভেরিয়েবলগুলো সঠিকভাবে কনফিগার করা জরুরি।
It is critical to configure all environment variables correctly here.

00:00:15.000 --> 00:00:20.000
সবকিছু প্রস্তুত হলে 'Deploy' বাটনে ক্লিক করে প্রোডাকশন রিলিজ শুরু করব।
Once ready, click the 'Deploy' button to initiate the production release.`,
    guideMarkdown: `# Step-by-Step Tutorial: Deploying High-Performance Next.js 14

Generated automatically by **VerseStudio 4K Pro** using bilingual AI and desktop event logging.

---

### Step 1: Initialize Workspace & Environment
- Open terminal and verify environment tokens:
  \`\`\`bash
  pnpm install
  cp .env.example .env.local
  \`\`\`
- Ensure all Google Cloud OAuth credentials and Supabase URLs are configured.

### Step 2: Configure 4K 60FPS Video Pipelines
- Navigate to \`apps/web/next.config.js\` and configure cache headers for chunked video byte-ranges:
  \`\`\`js
  module.exports = {
    async headers() {
      return [{ source: '/watch/(.*)', headers: [{ key: 'Accept-Ranges', value: 'bytes' }] }];
    }
  };
  \`\`\`

### Step 3: Trigger Production Deployment
- Click on **Deploy to Vercel/Cloudflare**.
- Monitor live build telemetry in the pipeline dashboard.
- Verification passed: 100% test coverage with zero memory leaks.

---
*Created with VerseStudio 4K Pro • Hosted on Google Drive*`,
  },
  'blocked-sample': {
    id: 'blocked-sample',
    title: 'Copyright Infringing Material Sample',
    driveFileId: 'blocked123',
    driveEmbedUrl: '',
    driveViewUrl: '',
    durationSeconds: 120,
    resolution: '1080p',
    fps: 30,
    authorName: 'Suspended Account',
    createdAt: '2026-10-20T10:00:00Z',
    viewsCount: 45,
    isBlocked: true,
  },
  'private-sample': {
    id: 'private-sample',
    title: 'Internal Architecture Sync',
    driveFileId: 'private123',
    driveEmbedUrl: '',
    driveViewUrl: '',
    durationSeconds: 900,
    resolution: '4k',
    fps: 60,
    authorName: 'Engineering Lead',
    createdAt: '2026-10-26T09:00:00Z',
    viewsCount: 2,
    isPrivate: true,
  },
};
