import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/adminAuth';
import { ServerDatabase } from '../../../../lib/serverDb';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req, 'manage_limits');
  if ('error' in auth) return auth.error;

  const telemetry = await ServerDatabase.getDriveTelemetry();
  return NextResponse.json({ telemetry });
}
