/*
 * Middleware flow:
 *
 *  request
 *     │
 *     ├── auth disabled (no GITHUB_CLIENT_ID)?  → pass through
 *     │
 *     ├── auth route (/api/auth, /login)?        → pass through
 *     │
 *     ├── getToken() → valid JWT?                → pass through
 *     │
 *     └── no valid JWT                           → redirect /login?callbackUrl=...
 */

import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_ENABLED = !!process.env.GITHUB_CLIENT_ID;

export async function middleware(request: NextRequest) {
  if (!AUTH_ENABLED) return NextResponse.next();

  const { pathname } = request.nextUrl;

  // Always allow auth routes and login page
  if (
    pathname.startsWith('/api/auth') ||
    pathname === '/login' ||
    pathname === '/' // landing page is always public
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request });
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/(app)/:path*',
    '/api/:path*',
    '/dashboard/:path*',
    '/prompts/:path*',
    '/playground/:path*',
    '/compare/:path*',
  ],
};
