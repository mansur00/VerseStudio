import { NextRequest, NextResponse } from 'next/server';
import { userAuthService } from '../../../../lib/userAuthService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const result = await userAuthService.forgotPassword(email);

    return NextResponse.json({
      success: true,
      message: 'If the email exists in our system, a password reset link has been dispatched',
      debugToken: process.env.NODE_ENV !== 'production' ? result.resetToken : undefined,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}
