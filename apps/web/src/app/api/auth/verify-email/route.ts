import { NextRequest, NextResponse } from 'next/server';
import { userAuthService } from '../../../../lib/userAuthService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, email } = body;

    if (!code) {
      return NextResponse.json({ error: 'Verification code is required' }, { status: 400 });
    }

    const result = await userAuthService.verifyEmail(code, email);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
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
