import { NextRequest, NextResponse } from 'next/server';
import { userAuthService } from '../../../../lib/userAuthService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json({ error: 'Reset token and new password are required' }, { status: 400 });
    }

    const result = await userAuthService.resetPassword(token, password);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}
