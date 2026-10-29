import { NextRequest, NextResponse } from 'next/server';
import { signalingDb } from '@/lib/signalingStore';

function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || '127.0.0.1';
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateCheck = signalingDb.checkRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        {
          status: 429,
          headers: {
            ...getCorsHeaders(),
            'Retry-After': String(rateCheck.retryAfter || 60),
          },
        }
      );
    }

    const body = await req.json();
    const { code, token, role, data } = body;
    const identifier = token || code;

    if (!identifier || !role || !data) {
      return NextResponse.json(
        { error: 'Missing code/token, role or data payload' },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    if (role === 'host' && code) {
      // Register or touch room
      signalingDb.createOrTouchRoom(code, token);
    }

    const result = signalingDb.postMessage(identifier, role, data);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || 'Failed to post message' },
        { status: result.status || 400, headers: getCorsHeaders() }
      );
    }

    return NextResponse.json({ ok: true }, { headers: getCorsHeaders() });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: getCorsHeaders() });
  }
}

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateCheck = signalingDb.checkRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        {
          status: 429,
          headers: {
            ...getCorsHeaders(),
            'Retry-After': String(rateCheck.retryAfter || 60),
          },
        }
      );
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const token = searchParams.get('token');
    const role = searchParams.get('role'); // 'host' or 'client'
    const wantConfig = searchParams.get('config') === 'turn';

    // If requesting TURN configuration
    if (wantConfig) {
      return NextResponse.json(
        { iceServers: signalingDb.getIceServers() },
        { headers: getCorsHeaders() }
      );
    }

    const identifier = token || code;
    if (!identifier || !role) {
      return NextResponse.json(
        { error: 'Missing code/token or role query param' },
        { status: 400, headers: getCorsHeaders() }
      );
    }

    const result = signalingDb.pollMessages(identifier, role as 'host' | 'client');
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status || 404, headers: getCorsHeaders() }
      );
    }

    return NextResponse.json(
      {
        messages: result.messages,
        iceServers: signalingDb.getIceServers(),
      },
      { headers: getCorsHeaders() }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: getCorsHeaders() });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const token = searchParams.get('token');
    const identifier = token || code;

    if (identifier) {
      signalingDb.deleteRoom(identifier);
    }

    return NextResponse.json({ ok: true }, { headers: getCorsHeaders() });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: getCorsHeaders() });
  }
}
