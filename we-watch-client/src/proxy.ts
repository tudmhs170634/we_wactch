import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = ['/123', '/456'];
const AUTH_ROUTES = ['/login', '/register'];

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Nếu chưa login và truy cập trang private -> Redirect sang /login
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    // Lưu lại trang đang định truy cập để quay lại sau khi login thành công (optional)
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Nếu đã login và truy cập trang auth (login/register) -> Redirect về Home
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
