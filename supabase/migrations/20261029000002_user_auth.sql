-- Migration: 20261029000002_user_auth.sql
-- Production User Authentication & Credentials Table

CREATE TABLE IF NOT EXISTS public.user_credentials (
  user_id TEXT PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  two_factor_secret TEXT,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.email_verification_codes (
  id TEXT PRIMARY KEY DEFAULT ('evc_' || substr(md5(random()::text), 1, 10)),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  code TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id TEXT PRIMARY KEY DEFAULT ('prt_' || substr(md5(random()::text), 1, 10)),
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 hour'),
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.device_sessions (
  id TEXT PRIMARY KEY DEFAULT ('sess_' || substr(md5(random()::text), 1, 10)),
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  browser TEXT NOT NULL,
  os TEXT NOT NULL,
  ip TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT 'Dhaka, Bangladesh',
  is_current BOOLEAN NOT NULL DEFAULT true,
  last_active TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.user_credentials TO service_role;
GRANT ALL ON public.email_verification_codes TO service_role;
GRANT ALL ON public.password_reset_tokens TO service_role;
GRANT ALL ON public.device_sessions TO service_role, authenticated;

CREATE POLICY "Users read own sessions" ON public.device_sessions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR auth.role() = 'service_role');
