import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/adminAuth';
import { ServerDatabase } from '../../../../lib/serverDb';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req, 'view_dashboard');
  if ('error' in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || '';
  const status = searchParams.get('status') || 'all';
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  const data = await ServerDatabase.getRecordings(query, status, limit, offset);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  // Requires 'block_shared_page' permission (Super admin & Support; Viewer FORBIDDEN)
  const auth = requireAdmin(req, 'block_shared_page');
  if ('error' in auth) return auth.error;

  const body = await req.json();
  const { pageId, isBlocked, reason } = body;
  const ip = req.ip || req.headers.get('x-forwarded-for') || '127.0.0.1';

  try {
    const updated = await ServerDatabase.setPageBlocked(
      pageId,
      Boolean(isBlocked),
      reason || 'Moderation action taken',
      {
        id: auth.session.id,
        email: auth.session.email,
        role: auth.session.role,
        ip,
      }
    );
    return NextResponse.json({ success: true, page: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

