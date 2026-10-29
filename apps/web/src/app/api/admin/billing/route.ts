import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../../../../lib/adminAuth';
import { ServerDatabase } from '../../../../lib/serverDb';
import { getActiveBillingProvider } from '../../../../lib/billingProvider';

export async function GET(req: NextRequest) {
  const auth = requireAdmin(req, 'manage_billing');
  if ('error' in auth) return auth.error;

  const summary = await ServerDatabase.getBillingSummary();
  const provider = getActiveBillingProvider();

  return NextResponse.json({
    summary,
    provider: {
      name: provider.name,
      configured: provider.isConfigured(),
      notice: !provider.isConfigured()
        ? 'Payment provider is not configured. Subscriptions are currently managed through direct administrative entitlements.'
        : undefined,
    },
  });
}
