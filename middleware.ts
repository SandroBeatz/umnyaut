import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthenticated = request.cookies.get('umnyaut_auth')?.value === 'true';

  // Auth pages
  if (pathname.startsWith('/auth')) {
    if (isAuthenticated && pathname === '/auth/onboarding') {
      return NextResponse.redirect(new URL('/p/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Dashboard routes (/p/*) - require authentication
  if (pathname.startsWith('/p')) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/auth/onboarding', request.url));
    }
    if (pathname === '/p' || pathname === '/p/') {
      return NextResponse.redirect(new URL('/p/dashboard', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.svg|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp).*)',
  ],
};
