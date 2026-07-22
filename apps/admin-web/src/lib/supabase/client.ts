'use client';

import { createSupabaseBrowserClient } from '@pedidosgo/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (!client) {
    client = createSupabaseBrowserClient();
  }
  return client;
}
