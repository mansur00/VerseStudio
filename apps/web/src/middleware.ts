import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAdminToken } from './lib/adminAuth';

const ADMIN_TOKEN_COOKIE = 'vs_admin_token';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect all /admin routes
  if (pathname.startsWith('/admin')) {
    // Whitelist auth challenge pages and static assets
    if (
      pathname === '/admin/login' ||
      pathname === '/admin/verify-2fa' ||
      pathname.startsWith('/admin/api/auth')
    ) {
      return NextResponse.next();
    }

    const token =
      request.cookies.get(ADMIN_TOKEN_COOKIE)?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    // 1. Unauthenticated request -> redirect to login or return 401
    if (!token) {
      if (request.headers.get('accept')?.includes('application/json')) {
        return NextResponse.json(
          { error: 'Unauthorized: Admin authentication required', code: 'UNAUTHORIZED' },
          { status: 401 }
        );
      }
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const session = verifyAdminToken(token);

    // 2. Invalid or expired token -> redirect to login
    if (!session) {
      if (request.headers.get('accept')?.includes('application/json')) {
        return NextResponse.json(
          { error: 'Unauthorized: Session invalid or expired', code: 'SESSION_EXPIRED' },
          { status: 401 }
        );
      }
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete(ADMIN_TOKEN_COOKIE);
      return res;
    }

    // 3. Admin signed in but 2FA challenge pending (AAL2 enforcement)
    if (!session.twoFactorVerified) {
      if (request.headers.get('accept')?.includes('application/json')) {
        return NextResponse.json(
          { error: 'Forbidden: 2FA challenge required', code: '2FA_REQUIRED' },
          { status: 403 }
        );
      }
      const challengeUrl = new URL('/admin/verify-2fa', request.url);
      challengeUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(challengeUrl);
    }

    // 4. Session valid and 2FA verified -> pass with verified identity headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-admin-id', session.id);
    requestHeaders.set('x-admin-email', session.email);
    requestHeaders.set('x-admin-role', session.role);

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    response.headers.set('x-admin-id', session.id);
    response.headers.set('x-admin-email', session.email);
    response.headers.set('x-admin-role', session.role);

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
