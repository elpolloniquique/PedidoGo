import { createSupabaseServerClient } from '@pedidosgo/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function createClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  return createSupabaseServerClient({
    getAll: () => cookieStore.getAll(),
    set: (name, value, options) => {
      try {
        cookieStore.set(name, value, options);
      } catch {
        // Ignorar en Server Components de solo lectura
      }
    },
  });
}
