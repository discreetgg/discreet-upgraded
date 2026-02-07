import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Protected routes that require authentication
 */
const protectedRoutes = ['/messages', '/profile', '/settings', '/earnings'];

/**
 * Auth routes that should redirect if already authenticated
 */
const authRoutes = ['/auth', '/_auth'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check for auth cookies (httpOnly cookies are sent automatically)
  const hasAuthCookie = request.cookies.has('auth_token') || 
                        request.cookies.has('discord_id') ||
                        request.cookies.has('refresh_token');

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Check if route is auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Redirect to auth if accessing protected route without auth
  if (isProtectedRoute && !hasAuthCookie) {
    const authUrl = new URL('/auth', request.url);
    authUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(authUrl);
  }

  // Redirect to home if accessing auth route while authenticated
  if (isAuthRoute && hasAuthCookie) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

