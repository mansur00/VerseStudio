import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '../middleware';
import {
  signAdminToken,
  requireAdmin,
  AdminSession,
} from '../lib/adminAuth';
import { ServerDatabase } from '../lib/serverDb';

describe('P0-1 & P0-2: Admin Server-Side Security & Audit Verification', () => {
  const superAdminSession: AdminSession = {
    id: 'usr_super_admin',
    email: 'admin@versestudio.app',
    name: 'Super Admin',
    role: 'super_admin',
    twoFactorEnabled: true,
    twoFactorVerified: true,
    issuedAt: Date.now(),
    expiresAt: Date.now() + 3600000,
  };

  const supportSession: AdminSession = {
    id: 'usr_support_admin',
    email: 'support@versestudio.app',
    name: 'Support Admin',
    role: 'support',
    twoFactorEnabled: true,
    twoFactorVerified: true,
    issuedAt: Date.now(),
    expiresAt: Date.now() + 3600000,
  };

  const viewerSession: AdminSession = {
    id: 'usr_viewer_admin',
    email: 'viewer@versestudio.app',
    name: 'Viewer Admin',
    role: 'viewer',
    twoFactorEnabled: true,
    twoFactorVerified: true,
    issuedAt: Date.now(),
    expiresAt: Date.now() + 3600000,
  };

  const unverified2FaSession: AdminSession = {
    ...superAdminSession,
    twoFactorVerified: false, // 2FA Challenge pending!
  };

  it('1. Unauthenticated request to /admin redirects to /admin/login', () => {
    const req = new NextRequest('http://localhost:3000/admin');
    const res = middleware(req);
    expect(res.status).toBe(307); // Next.js redirect
    expect(res.headers.get('location')).toContain('/admin/login');
  });

  it('2. Unauthenticated JSON API request to /admin returns 401 Unauthorized', () => {
    const req = new NextRequest('http://localhost:3000/admin', {
      headers: { accept: 'application/json' },
    });
    const res = middleware(req);
    expect(res.status).toBe(401);
  });

  it('3. Request with pending 2FA (AAL1 only) redirects to /admin/verify-2fa', () => {
    const token = signAdminToken(unverified2FaSession);
    const req = new NextRequest('http://localhost:3000/admin', {
      headers: { cookie: `vs_admin_token=${token}` },
    });
    const res = middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/admin/verify-2fa');
  });

  it('4. Verified Super Admin passes middleware with identity headers', () => {
    const token = signAdminToken(superAdminSession);
    const req = new NextRequest('http://localhost:3000/admin/users', {
      headers: { cookie: `vs_admin_token=${token}` },
    });
    const res = middleware(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('x-admin-role')).toBe('super_admin');
  });

  it('5. Role Enforcement: Viewer CANNOT suspend users (returns 403 Forbidden)', () => {
    const token = signAdminToken(viewerSession);
    const req = new Request('http://localhost:3000/api/admin/users', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
    });

    const check = requireAdmin(req, 'suspend_user');
    expect('error' in check).toBe(true);
    if ('error' in check) {
      expect(check.error.status).toBe(403);
    }
  });

  it('6. Role Enforcement: Super Admin CAN suspend user, creating immutable audit log', async () => {
    const token = signAdminToken(superAdminSession);
    const req = new Request('http://localhost:3000/api/admin/users', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
    });

    const check = requireAdmin(req, 'suspend_user');
    expect('session' in check).toBe(true);

    if ('session' in check) {
      const user = await ServerDatabase.setUserStatus('usr_creator_1', 'suspended', {
        id: check.session.id,
        email: check.session.email,
        role: check.session.role,
        ip: '192.168.1.50',
      });
      expect(user.status).toBe('suspended');

      // Verify audit log has recorded the action
      const { logs } = await ServerDatabase.getAuditLogs(1, 0);
      expect(logs[0].action).toBe('SUSPEND_USER');
      expect(logs[0].target_id).toBe('usr_creator_1');
      expect(logs[0].actor_email).toBe('admin@versestudio.app');
    }
  });

  it('7. Role Enforcement: Support CAN block a share page, but CANNOT change plans', () => {
    const token = signAdminToken(supportSession);
    const req = new Request('http://localhost:3000/api/admin/billing', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
    });

    // Support has block_shared_page permission
    const blockCheck = requireAdmin(req, 'block_shared_page');
    expect('session' in blockCheck).toBe(true);

    // Support lacks change_user_plan permission
    const planCheck = requireAdmin(req, 'change_user_plan');
    expect('error' in planCheck).toBe(true);
    if ('error' in planCheck) {
      expect(planCheck.error.status).toBe(403);
    }
  });

  it('8. Database queries return live data and no Google Drive delete file API exists', async () => {
    const { users, total } = await ServerDatabase.getUsers('', 'all', 'all');
    expect(total).toBeGreaterThan(0);
    expect(users.find((u) => u.email === 'tahmid@developer.bd')).toBeDefined();

    // Verify ServerDatabase does not export any Drive deletion method
    expect((ServerDatabase as any).deleteGoogleDriveFile).toBeUndefined();
  });

  it('9. Production code rule: zero imports of mockAdminData across apps/web/src', () => {
    const fs = require('fs');
    const path = require('path');

    function checkDir(dir: string): string[] {
      let violations: string[] = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && entry.name !== '__tests__') {
          violations = violations.concat(checkDir(fullPath));
        } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.match(/from\s+['"].*mockAdminData['"]/)) {
            violations.push(fullPath);
          }
        }
      }
      return violations;
    }

    const violations = checkDir(path.resolve(__dirname, '..'));
    expect(violations).toEqual([]);
  });
});
