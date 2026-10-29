import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/adminAuth';
import { ServerDatabase } from '../../../../lib/serverDb';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req, 'manage_users');
  if ('error' in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || '';
  const status = searchParams.get('status') || 'all';
  const plan = searchParams.get('plan') || 'all';
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  const data = await ServerDatabase.getUsers(query, status, plan, limit, offset);
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, userId, status, plan } = body;
  const ip = req.ip || req.headers.get('x-forwarded-for') || '127.0.0.1';

  if (action === 'suspend') {
    // Requires 'suspend_user' permission (Super admin & Support; Viewer is FORBIDDEN)
    const auth = requireAdmin(req, 'suspend_user');
    if ('error' in auth) return auth.error;

    try {
      const updatedUser = await ServerDatabase.setUserStatus(
        userId,
        status || 'suspended',
        {
          id: auth.session.id,
          email: auth.session.email,
          role: auth.session.role,
          ip,
        }
      );
      return NextResponse.json({ success: true, user: updatedUser });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
  }

  if (action === 'change_plan') {
    // Requires 'change_user_plan' permission (Super admin ONLY; Support & Viewer FORBIDDEN)
    const auth = requireAdmin(req, 'change_user_plan');
    if ('error' in auth) return auth.error;

    try {
      const updatedUser = await ServerDatabase.setUserPlan(
        userId,
        plan || 'pro',
        {
          id: auth.session.id,
          email: auth.session.email,
          role: auth.session.role,
          ip,
        }
      );
      return NextResponse.json({ success: true, user: updatedUser });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}

