import { NextRequest, NextResponse } from 'next/server';
import { requireUserSession } from '../../../../lib/userAuthMiddleware';
import { ServerDatabase } from '../../../../lib/serverDb';

export async function GET(req: NextRequest) {
  const auth = requireUserSession(req);
  if ('error' in auth) return auth.error;

  const { users } = await ServerDatabase.getUsers('', 'all', 'all');
  const user = users.find((u) => u.id === auth.user.id);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ user });
}
