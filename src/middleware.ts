import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Redirect to login if no token
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Role-based access control
    if (pathname.startsWith('/teacher') && token.role !== 'teacher') {
      return NextResponse.redirect(new URL('/student', req.url));
    }

    if (pathname.startsWith('/student') && token.role !== 'student') {
      return NextResponse.redirect(new URL('/teacher', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ['/teacher/:path*', '/student/:path*', '/profile/:path*'],
};
