import { NextRequest, NextResponse } from 'next/server';
import { requireUserSession } from '../../../../lib/userAuthMiddleware';
import { userAuthService } from '../../../../lib/userAuthService';

export async function GET(req: NextRequest) {
  const auth = requireUserSession(req);
  if ('error' in auth) return auth.error;

  const sessions = userAuthService.getSessions(auth.user.id);
  return NextResponse.json({ sessions });
}

export async function DELETE(req: NextRequest) {
  const auth = requireUserSession(req);
  if ('error' in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('id');
  if (!sessionId) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
  }

  userAuthService.revokeSession(auth.user.id, sessionId);
  return NextResponse.json({ success: true });
}
