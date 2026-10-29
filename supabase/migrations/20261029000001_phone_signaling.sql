-- Migration: 20261029000001_phone_signaling.sql
-- Phone Camera WebRTC Signaling Table with 10-Minute TTL and Attempt Limits

CREATE TABLE IF NOT EXISTS public.phone_signaling_rooms (
  id TEXT PRIMARY KEY, -- Room ID / 128-bit pairing token
  token TEXT UNIQUE NOT NULL, -- 128+ bit pairing token (for QR code)
  code TEXT UNIQUE NOT NULL, -- 6-character short code (e.g. VS-8924)
  host_queue JSONB NOT NULL DEFAULT '[]'::jsonb,
  client_queue JSONB NOT NULL DEFAULT '[]'::jsonb,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for token/code lookups and TTL expiry
CREATE INDEX IF NOT EXISTS idx_phone_signaling_code ON public.phone_signaling_rooms(code);
CREATE INDEX IF NOT EXISTS idx_phone_signaling_token ON public.phone_signaling_rooms(token);
CREATE INDEX IF NOT EXISTS idx_phone_signaling_expires ON public.phone_signaling_rooms(expires_at);

-- RLS: accessible only within TTL
ALTER TABLE public.phone_signaling_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signaling rooms accessible within TTL"
  ON public.phone_signaling_rooms
  FOR ALL
  USING (NOW() < expires_at);

