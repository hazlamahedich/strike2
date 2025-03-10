import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  // Get the pathname
  const { pathname } = req.nextUrl;
  
  // Get the NextAuth.js session token
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isAuthenticated = !!token;
  
  // Auth condition: if accessing dashboard routes and not authenticated
  if (pathname.startsWith('/dashboard') && !isAuthenticated) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if ((pathname.startsWith('/auth') || pathname === '/') && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}; 