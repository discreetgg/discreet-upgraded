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
  const hasManualLogoutMarker =
    request.cookies.get('manual_logout')?.value === '1';

  // Check for real auth session cookies (httpOnly cookies are sent automatically).
  // `discord_id` is only an identifier helper and should not gate auth routes.
  const hasAuthCookie =
    request.cookies.has('auth_token') ||
    request.cookies.has('refresh_token');
  const isAuthenticated = hasAuthCookie && !hasManualLogoutMarker;

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Check if route is auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Redirect to auth if accessing protected route without auth
  if (isProtectedRoute && !isAuthenticated) {
    const authUrl = new URL('/auth', request.url);
    authUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(authUrl);
  }

  // Redirect to home if accessing auth route while authenticated
  if (isAuthRoute && isAuthenticated) {
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
