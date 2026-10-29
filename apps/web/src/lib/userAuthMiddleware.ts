import { NextRequest, NextResponse } from 'next/server';
import { userAuthService } from './userAuthService';

export function requireUserSession(req: NextRequest): { user: { id: string; email: string; name: string } } | { error: NextResponse } {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      error: NextResponse.json({ error: 'Unauthorized: Missing bearer token' }, { status: 401 }),
    };
  }

  const token = authHeader.substring(7);
  const payload = userAuthService.verifyUserToken(token);
  if (!payload) {
    return {
      error: NextResponse.json({ error: 'Unauthorized: Invalid or expired session token' }, { status: 401 }),
    };
  }

  return { user: payload };
}
