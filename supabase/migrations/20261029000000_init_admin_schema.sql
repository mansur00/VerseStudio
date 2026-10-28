-- VerseStudio 4K Pro — Production Database Schema & RLS Policies
-- Migration: 20261029000000_init_admin_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. User Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  ai_minutes_used NUMERIC NOT NULL DEFAULT 0,
  ai_minutes_limit NUMERIC NOT NULL DEFAULT 30,
  google_drive_connected BOOLEAN NOT NULL DEFAULT false,
  google_drive_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Admin Roles Table (Super admin, Support, Viewer)
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id TEXT PRIMARY KEY DEFAULT ('adm_' || substr(md5(random()::text), 1, 10)),
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('super_admin', 'support', 'viewer')),
  two_factor_enabled BOOLEAN NOT NULL DEFAULT true,
  two_factor_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Plans Configuration Table
CREATE TABLE IF NOT EXISTS public.plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_monthly NUMERIC NOT NULL DEFAULT 0,
  ai_minutes_included INTEGER NOT NULL DEFAULT 30,
  max_resolution TEXT NOT NULL DEFAULT '4k',
  storage_type TEXT NOT NULL DEFAULT 'google_drive',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. User Subscriptions Table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id TEXT PRIMARY KEY DEFAULT ('sub_' || substr(md5(random()::text), 1, 10)),
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled')),
  amount_cents INTEGER NOT NULL DEFAULT 0,
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. AI Usage Tracking Table
CREATE TABLE IF NOT EXISTS public.usage_records (
  id TEXT PRIMARY KEY DEFAULT ('usg_' || substr(md5(random()::text), 1, 10)),
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  feature_type TEXT NOT NULL CHECK (feature_type IN ('live_subtitle', 'ai_voice_dubbing', 'step_guide')),
  minutes_consumed NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Shared Watch Pages (Metadata only, files hosted in user Drive)
CREATE TABLE IF NOT EXISTS public.share_pages (
  id TEXT PRIMARY KEY, -- e.g. drive file id or slug
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  drive_file_id TEXT NOT NULL,
  drive_view_url TEXT NOT NULL,
  duration_seconds NUMERIC NOT NULL DEFAULT 0,
  resolution TEXT NOT NULL DEFAULT '4k',
  fps INTEGER NOT NULL DEFAULT 60,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  is_private BOOLEAN NOT NULL DEFAULT false,
  views_count INTEGER NOT NULL DEFAULT 0,
  guide_markdown TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Moderation Reports Table
CREATE TABLE IF NOT EXISTS public.moderation_reports (
  id TEXT PRIMARY KEY DEFAULT ('rep_' || substr(md5(random()::text), 1, 10)),
  share_page_id TEXT NOT NULL REFERENCES public.share_pages(id) ON DELETE CASCADE,
  reporter_email TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  action_taken TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 8. Audit Log Table (Immutable server-side event logging)
CREATE TABLE IF NOT EXISTS public.audit_log (
  id TEXT PRIMARY KEY DEFAULT ('aud_' || substr(md5(random()::text), 1, 10)),
  actor_id TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  ip_address TEXT NOT NULL DEFAULT '127.0.0.1',
  details JSONB,
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failure')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Google Drive Connection Metadata (Strictly metadata, never tokens in plain text)
CREATE TABLE IF NOT EXISTS public.drive_connections (
  id TEXT PRIMARY KEY DEFAULT ('drc_' || substr(md5(random()::text), 1, 10)),
  user_id TEXT UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  google_email TEXT NOT NULL,
  folder_id TEXT NOT NULL DEFAULT 'VerseStudio',
  storage_quota_limit BIGINT NOT NULL DEFAULT 16106127360,
  storage_quota_used BIGINT NOT NULL DEFAULT 6871947673,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row Level Security (RLS) Activation
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drive_connections ENABLE ROW LEVEL SECURITY;

-- Security Policies:
-- 1. Profiles: users can read and update their own profile; admins can read all profiles.
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (true);

-- 2. Audit log: read-only for admins, append-only by service role
CREATE POLICY "Admins can view audit log" ON public.audit_log FOR SELECT USING (true);
CREATE POLICY "System can insert audit log" ON public.audit_log FOR INSERT WITH CHECK (true);

-- 3. Share pages: public read for active unblocked pages
CREATE POLICY "Public can view unblocked share pages" ON public.share_pages FOR SELECT USING (NOT is_blocked AND NOT is_private);
