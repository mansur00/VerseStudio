import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/adminAuth';
import { ServerDatabase } from '../../../../lib/serverDb';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req, 'manage_moderation');
  if ('error' in auth) return auth.error;

  const reports = await ServerDatabase.getModerationReports();
  return NextResponse.json({ reports });
}

export async function POST(req: NextRequest) {
  // Resolving or dismissing reports requires manage_moderation permission
  const auth = requireAdmin(req, 'manage_moderation');
  if ('error' in auth) return auth.error;

  const body = await req.json();
  const { reportId, action } = body;

  if (!reportId || !['resolved', 'dismissed'].includes(action)) {
    return NextResponse.json({ error: 'Valid reportId and action (resolved/dismissed) required' }, { status: 400 });
  }

  const ip = req.ip || req.headers.get('x-forwarded-for') || '127.0.0.1';
  try {
    const updated = await ServerDatabase.resolveModerationReport(reportId, action, {
      id: auth.session.id,
      email: auth.session.email,
      role: auth.session.role,
      ip,
    });
    return NextResponse.json({ success: true, report: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
