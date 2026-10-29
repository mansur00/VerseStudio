import { NextRequest, NextResponse } from 'next/server';
import { userAuthService } from '../../../../lib/userAuthService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const ip = req.ip || req.headers.get('x-forwarded-for') || '127.0.0.1';
    const result = await userAuthService.signIn(email, password, ip);

    if (!result.success) {
      const status = result.error?.includes('suspended') ? 403 : 401;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({
      success: true,
      user: result.user,
      token: result.token,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}
