import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { guestRegex, isDevelopmentEnvironment } from './lib/constants';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*
   * Playwright starts the dev server and requires a 200 status to
   * begin the tests, so this ensures that the tests can start
   */
  if (pathname.startsWith('/ping')) {
    return new Response('pong', { status: 200 });
  }

  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Allow access to authentication pages without token to prevent redirect loops
  if (pathname === '/login' || pathname === '/register') {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment,
  });

  // Force authentication - no guests allowed, redirect to login
  if (!token) {
    console.log('[AUTH] No token found, redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const isGuest = guestRegex.test(token?.email ?? '');

  // Force real authentication - no guest users allowed
  if (isGuest) {
    console.log('[AUTH] Guest user detected, redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect authenticated users away from auth pages
  if (token && !isGuest && ['/login', '/register'].includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - /api/auth (authentication endpoints)
     * - /ping (health check)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/auth|ping).*)',
  ],
};
