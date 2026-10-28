import { NextRequest, NextResponse } from 'next/server';

interface SignalingRoom {
  hostQueue: any[];
  clientQueue: any[];
  updatedAt: number;
}

// In-memory signaling registry
const rooms = new Map<string, SignalingRoom>();

// Clean up stale rooms older than 30 minutes
setInterval(() => {
  const now = Date.now();
  rooms.forEach((room, code) => {
    if (now - room.updatedAt > 30 * 60 * 1000) {
      rooms.delete(code);
    }
  });
}, 60 * 1000);

function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, role, data } = body;

    if (!code || !role || !data) {
      return NextResponse.json({ error: 'Missing code, role or data' }, { status: 400, headers: getCorsHeaders() });
    }

    const roomKey = code.toUpperCase();
    let room = rooms.get(roomKey);
    if (!room) {
      room = { hostQueue: [], clientQueue: [], updatedAt: Date.now() };
      rooms.set(roomKey, room);
    }

    room.updatedAt = Date.now();

    // Messages sent by host go to client; messages sent by client go to host
    if (role === 'host') {
      room.clientQueue.push(data);
    } else {
      room.hostQueue.push(data);
    }

    return NextResponse.json({ ok: true }, { headers: getCorsHeaders() });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500, headers: getCorsHeaders() });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const role = searchParams.get('role'); // 'host' or 'client'

  if (!code || !role) {
    return NextResponse.json({ error: 'Missing code or role' }, { status: 400, headers: getCorsHeaders() });
  }

  const roomKey = code.toUpperCase();
  const room = rooms.get(roomKey);

  if (!room) {
    return NextResponse.json({ messages: [] }, { headers: getCorsHeaders() });
  }

  room.updatedAt = Date.now();

  let messages: any[] = [];
  if (role === 'host') {
    messages = [...room.hostQueue];
    room.hostQueue = [];
  } else {
    messages = [...room.clientQueue];
    room.clientQueue = [];
  }

  return NextResponse.json({ messages }, { headers: getCorsHeaders() });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (code) {
    rooms.delete(code.toUpperCase());
  }

  return NextResponse.json({ ok: true }, { headers: getCorsHeaders() });
}
