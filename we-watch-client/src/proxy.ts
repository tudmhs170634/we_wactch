import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/rooms', '/profile', '/videos', '/private', '/community'];

const AUTH_ROUTES = ['/login', '/register'];

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const userRole = request.cookies.get('user_role')?.value;
  const { pathname } = request.nextUrl;

  // 1. Bảo vệ trang Admin - Chỉ cho phép role là 'admin'
  if (pathname.startsWith('/admin')) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (userRole !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // 2. Nếu chưa login và truy cập trang private (rooms, profile, videos) -> Redirect sang /login
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Nếu đã login và truy cập trang auth (login/register) -> Redirect về Home
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Cấu hình các route mà middleware sẽ chạy qua
export const config = {
  matcher: [
    // Bỏ qua tất cả các file tĩnh, api, và các tệp có đuôi (png, jpg, svg, etc.)
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
