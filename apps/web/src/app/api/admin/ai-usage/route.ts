import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/adminAuth';
import { ServerDatabase } from '../../../../lib/serverDb';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req, 'view_dashboard');
  if ('error' in auth) return auth.error;

  const stats = await ServerDatabase.getAiUsageStats();
  return NextResponse.json({ stats });
}
