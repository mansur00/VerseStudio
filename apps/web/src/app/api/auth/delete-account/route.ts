import { NextRequest, NextResponse } from 'next/server';
import { requireUserSession } from '../../../../lib/userAuthMiddleware';
import { userAuthService } from '../../../../lib/userAuthService';

export async function POST(req: NextRequest) {
  const auth = requireUserSession(req);
  if ('error' in auth) return auth.error;

  // Clean account deletion removing platform data without touching user's Google Drive
  await userAuthService.deleteAccount(auth.user.id);
  return NextResponse.json({
    success: true,
    message: 'Account and platform data deleted. Note: User Google Drive files remain untouched.',
  });
}
