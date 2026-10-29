import { NextRequest, NextResponse } from 'next/server';

export type AdminRole = 'super_admin' | 'support' | 'viewer';

export interface AdminSession {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  twoFactorEnabled: boolean;
  twoFactorVerified: boolean;
  issuedAt: number;
  expiresAt: number;
}

export type AdminPermission =
  | 'view_dashboard'
  | 'manage_users'
  | 'suspend_user'
  | 'change_user_plan'
  | 'manage_moderation'
  | 'block_shared_page'
  | 'manage_billing'
  | 'manage_limits'
  | 'manage_admins'
  | 'view_audit_log';

// Screen A14: Official Permission Matrix from Figma design
export const ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  super_admin: [
    'view_dashboard',
    'manage_users',
    'suspend_user',
    'change_user_plan',
    'manage_moderation',
    'block_shared_page',
    'manage_billing',
    'manage_limits',
    'manage_admins',
    'view_audit_log',
  ],
  support: [
    'view_dashboard',
    'manage_users',
    'suspend_user',
    'manage_moderation',
    'block_shared_page',
    'view_audit_log',
  ],
  viewer: [
    'view_dashboard',
    'view_audit_log',
  ],
};

const ADMIN_TOKEN_COOKIE = 'vs_admin_token';
const ADMIN_SECRET = process.env.ADMIN_SESSION_SECRET || 'vs_dev_admin_session_secret_2026';

/**
 * Encodes an admin session payload into a signed base64 token
 */
export function signAdminToken(session: AdminSession): string {
  const payload = JSON.stringify(session);
  const signature = Buffer.from(`${payload}.${ADMIN_SECRET}`).toString('base64');
  return Buffer.from(JSON.stringify({ payload, signature })).toString('base64');
}

/**
 * Validates and decodes an admin session token
 */
export function verifyAdminToken(token: string): AdminSession | null {
  try {
    const raw = Buffer.from(token, 'base64').toString('utf8');
    const { payload, signature } = JSON.parse(raw);
    const expectedSignature = Buffer.from(`${payload}.${ADMIN_SECRET}`).toString('base64');
    if (signature !== expectedSignature) return null;

    const session: AdminSession = JSON.parse(payload);
    if (Date.now() > session.expiresAt) return null;
    return session;
  } catch {
    return null;
  }
}

/**
 * Extracts and verifies the admin session from an incoming HTTP request
 */
export function getAdminSessionFromRequest(req: NextRequest | Request): AdminSession | null {
  let token: string | null = null;

  // 1. Check Bearer Authorization Header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  // 2. Check HTTP Cookie
  if (!token && 'cookies' in req) {
    const cookieToken = (req as NextRequest).cookies.get(ADMIN_TOKEN_COOKIE)?.value;
    if (cookieToken) token = cookieToken;
  }

  if (!token) return null;
  return verifyAdminToken(token);
}

/**
 * Checks whether an admin session has permission for a specific action
 */
export function hasAdminPermission(session: AdminSession, permission: AdminPermission): boolean {
  const allowedPermissions = ROLE_PERMISSIONS[session.role] || [];
  return allowedPermissions.includes(permission);
}

/**
 * Server guard: verifies request has a valid admin session, 2FA verified, and required permission
 */
export function requireAdmin(
  req: NextRequest | Request,
  permission: AdminPermission = 'view_dashboard'
): { session: AdminSession } | { error: NextResponse } {
  const session = getAdminSessionFromRequest(req);

  if (!session) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized: Admin authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      ),
    };
  }

  // Enforce 2FA verification (AAL2)
  if (!session.twoFactorVerified) {
    return {
      error: NextResponse.json(
        { error: 'Two-Factor Authentication required (AAL2 challenge pending)', code: '2FA_REQUIRED' },
        { status: 403 }
      ),
    };
  }

  // Enforce Role-Based Permissions
  if (!hasAdminPermission(session, permission)) {
    return {
      error: NextResponse.json(
        {
          error: `Forbidden: Role '${session.role}' lacks permission '${permission}'`,
          code: 'FORBIDDEN',
        },
        { status: 403 }
      ),
    };
  }

  return { session };
}

