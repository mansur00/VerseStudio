import { NextRequest, NextResponse } from 'next/server';
import { userAuthService } from '../../../../lib/userAuthService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
    }

    const result = await userAuthService.signUp(name, email, password);
    if (!result.success) {
      const status = result.error?.includes('already exists') ? 409 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to email',
      // In development / test environments we provide the code for automated verification testing
      debugCode: process.env.NODE_ENV !== 'production' ? result.code : undefined,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}
