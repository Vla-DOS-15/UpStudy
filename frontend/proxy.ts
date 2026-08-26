import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

const protectedExecutorRoutes = [
  '/dashboard/market',
  '/dashboard/active-orders',
  '/dashboard/my-shop',
  '/dashboard/balance'
];

export function proxy(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  const { pathname } = request.nextUrl;

  // 1. Захист адмінки
  if (pathname.startsWith('/admin')) {
    if (!token) {
      // Якщо не залогінений - на головну (відкриє модалку сам)
      return NextResponse.redirect(new URL('/', request.url));
    }

    try {
      const decoded: any = jwtDecode(token);
      const roles = decoded.role ? (Array.isArray(decoded.role) ? decoded.role : [decoded.role]) : [];
      
      // Перевіряємо чи є доступ (Admin або Manager)
      const hasAdminAccess = roles.includes('Admin') || roles.includes('VerificationManager') || roles.includes('UserManager');

      if (!hasAdminAccess) {
        // 🔥 Показуємо 404, ніби сторінки не існує (Security through obscurity)
        return NextResponse.rewrite(new URL('/404', request.url));
      }
    } catch (e) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // 2. Логіка Dashbord (як було раніше, але редірект на / замість /login)
  if (!token && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (token && pathname.startsWith('/dashboard')) {
    try {
      const decoded: any = jwtDecode(token);
      const roles = decoded.role ? (Array.isArray(decoded.role) ? decoded.role : [decoded.role]) : [];
      
      // Важливо: переконайтесь, що назва claim співпадає з бекендом ("IsVerified" vs "isVerified")
      // В токені зазвичай ключі як є в C# (PascalCase), якщо не налаштовано інакше
      const isVerified = decoded.IsVerified === 'True' || decoded.IsVerified === true;
      const isExecutor = roles.includes('Executor');
      const isClient = roles.includes('Client');

      if (isExecutor) {
        const isVerificationPending = decoded.IsVerificationPending === 'True' || decoded.IsVerificationPending === true;

        if (!isVerified) {
          // Якщо не верифікований:
          if (isVerificationPending && pathname !== '/dashboard/verification') {
            return NextResponse.redirect(new URL('/dashboard/verification', request.url));
          } else if (!isVerificationPending && pathname !== '/setup-profile') {
            return NextResponse.redirect(new URL('/setup-profile', request.url));
          }
        } else {
          // Якщо верифікований і зайшов на сторінки очікування/реєстрації
          if (pathname === '/dashboard/verification' || pathname === '/setup-profile') {
            return NextResponse.redirect(new URL('/dashboard', request.url));
          }
        }
      }
      
      if (isClient && (pathname === '/dashboard/verification' || pathname === '/setup-profile')) {
         return NextResponse.redirect(new URL('/dashboard', request.url));
      }

    } catch (e) {
      const response = NextResponse.redirect(new URL('/', request.url));
      response.cookies.delete('accessToken');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/setup-profile'],
};