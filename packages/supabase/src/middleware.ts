import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type UpdateSessionOptions = {
  /** Rutas públicas (sin sesión). Ej: ['/login', '/register'] */
  publicPaths?: string[];
  /** Si true, redirige a /login cuando no hay sesión en rutas no públicas */
  requireAuth?: boolean;
  loginPath?: string;
  homePath?: string;
};

/**
 * Refresca la sesión de Supabase en cada request (middleware Next.js).
 * No valida roles aquí: eso se hace en layouts/server con get_my_roles().
 */
export async function updateSession(
  request: NextRequest,
  options: UpdateSessionOptions = {},
): Promise<NextResponse> {
  const {
    publicPaths = ['/login', '/register', '/forgot-password', '/update-password', '/auth'],
    requireAuth = true,
    loginPath = '/login',
    homePath = '/',
  } = options;

  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options: cookieOptions }) => {
          supabaseResponse.cookies.set(name, value, cookieOptions);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPublic = publicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (requireAuth && !user && !isPublic) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = loginPath;
    redirectUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && (pathname === loginPath || pathname === '/register')) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = homePath;
    redirectUrl.search = '';
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
