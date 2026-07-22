import { createServerClient, type CookieOptions } from '@supabase/ssr';

type CookieStore = {
  getAll: () => { name: string; value: string }[];
  set?: (name: string, value: string, options: CookieOptions) => void;
};

/**
 * Cliente Supabase para Server Components / Route Handlers de Next.js.
 * Requiere pasar el cookie store de next/headers.
 */
export function createSupabaseServerClient(cookieStore: CookieStore) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY. Configúralas en .env.local',
    );
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set?.(name, value, options);
          });
        } catch {
          // set puede fallar en Server Components de solo lectura; el middleware renueva la sesión.
        }
      },
    },
  });
}
