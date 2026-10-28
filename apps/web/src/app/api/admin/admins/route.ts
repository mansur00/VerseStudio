import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/adminAuth';
import { ServerDatabase } from '../../../../lib/serverDb';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req, 'view_dashboard');
  if ('error' in auth) return auth.error;

  const admins = await ServerDatabase.getAdmins();
  return NextResponse.json({ admins });
}

export async function POST(req: NextRequest) {
  // Super admin ONLY
  const auth = requireAdmin(req, 'manage_admins');
  if ('error' in auth) return auth.error;

  const body = await req.json();
  const { email, role } = body;
  const ip = req.ip || req.headers.get('x-forwarded-for') || '127.0.0.1';

  try {
    const newAdmin = await ServerDatabase.inviteAdmin(
      email,
      role || 'viewer',
      {
        id: auth.session.id,
        email: auth.session.email,
        role: auth.session.role,
        ip,
      }
    );
    return NextResponse.json({ success: true, admin: newAdmin });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
