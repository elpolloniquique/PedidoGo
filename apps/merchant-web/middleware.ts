import { updateSession } from '@pedidosgo/supabase/middleware';
import { type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  return updateSession(request, {
    publicPaths: [
      '/login',
      '/register',
      '/forgot-password',
      '/update-password',
      '/auth',
      '/api/health',
      '/api/cron',
      '/api/v1',
      '/api/auth',
    ],
    requireAuth: true,
    loginPath: '/login',
    homePath: '/',
  });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
