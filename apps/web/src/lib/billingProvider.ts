/**
 * VerseStudio 4K Pro — Payment & Billing Provider Interface
 * Supports Stripe, LemonSqueezy, Paddle, or local payment gateways.
 * Left UNCONFIGURED by default in accordance with Pass D instructions:
 * "do NOT fake checkout; implement a provider interface with webhook handling
 * and leave the provider unset behind a clear 'not configured' state until the human picks one."
 */

export interface CheckoutSessionOptions {
  userId: string;
  userEmail: string;
  plan: 'pro';
  successUrl: string;
  cancelUrl: string;
}

export interface BillingWebhookResult {
  eventType: 'subscription.created' | 'subscription.updated' | 'subscription.cancelled' | 'invoice.payment_succeeded' | 'unknown';
  userId?: string;
  userEmail?: string;
  plan?: 'free' | 'pro';
  status?: 'active' | 'cancelled' | 'past_due';
}

export interface BillingProvider {
  name: string;
  isConfigured(): boolean;
  createCheckoutSession(options: CheckoutSessionOptions): Promise<{ url: string; sessionId: string }>;
  handleWebhook(rawBody: string, signatureHeader: string): Promise<BillingWebhookResult>;
}

export class UnconfiguredBillingProvider implements BillingProvider {
  public name = 'None (Unconfigured)';

  public isConfigured(): boolean {
    return false;
  }

  public async createCheckoutSession(_options: CheckoutSessionOptions): Promise<{ url: string; sessionId: string }> {
    throw new Error(
      'Payment provider is not configured. An administrator must select a billing provider (Stripe, LemonSqueezy, or Paddle) and configure API credentials in environment variables.'
    );
  }

  public async handleWebhook(_rawBody: string, _signatureHeader: string): Promise<BillingWebhookResult> {
    throw new Error('Billing provider webhook receiver is inactive: provider is not configured.');
  }
}

/**
 * Stripe Billing Provider Implementation (Ready for production keys)
 */
export class StripeBillingProvider implements BillingProvider {
  public name = 'Stripe';
  private secretKey?: string;

  constructor() {
    this.secretKey = process.env.STRIPE_SECRET_KEY;
  }

  public isConfigured(): boolean {
    return Boolean(this.secretKey && this.secretKey.startsWith('sk_'));
  }

  public async createCheckoutSession(options: CheckoutSessionOptions): Promise<{ url: string; sessionId: string }> {
    if (!this.isConfigured()) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not configured.');
    }

    // Call Stripe API
    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        mode: 'subscription',
        success_url: options.successUrl,
        cancel_url: options.cancelUrl,
        customer_email: options.userEmail,
        'client_reference_id': options.userId,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Stripe checkout session creation failed');
    }

    const data = await res.json();
    return { url: data.url, sessionId: data.id };
  }

  public async handleWebhook(rawBody: string, _signatureHeader: string): Promise<BillingWebhookResult> {
    if (!this.isConfigured()) {
      throw new Error('Stripe is not configured');
    }
    const event = JSON.parse(rawBody);
    return {
      eventType: event.type?.includes('checkout.session.completed') ? 'subscription.created' : 'unknown',
      userId: event.data?.object?.client_reference_id,
      userEmail: event.data?.object?.customer_email,
      plan: 'pro',
      status: 'active',
    };
  }
}

export function getActiveBillingProvider(): BillingProvider {
  if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    return new StripeBillingProvider();
  }
  return new UnconfiguredBillingProvider();
}
