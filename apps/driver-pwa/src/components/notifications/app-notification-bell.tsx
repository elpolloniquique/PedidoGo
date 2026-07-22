'use client';

import { NotificationBell } from '@pedidosgo/ui';
import { createClient } from '@/lib/supabase/client';

export function AppNotificationBell() {
  return <NotificationBell createClient={createClient} />;
}
