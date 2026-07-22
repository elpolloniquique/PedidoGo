'use client';

import { Button } from './button';
import type { SupabaseClient } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  data: Record<string, unknown>;
};

export type NotificationBellProps = {
  createClient: () => SupabaseClient;
};

export function NotificationBell({ createClient }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id ?? null;
    setUserId(uid);
    if (!uid) return;

    const [{ data }, { data: countData }] = await Promise.all([
      supabase
        .from('notifications')
        .select('id, title, message, type, is_read, created_at, data')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase.rpc('get_my_unread_notification_count'),
    ]);

    setItems(
      (data ?? []).map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: Boolean(n.is_read),
        createdAt: n.created_at,
        data: (n.data as Record<string, unknown>) ?? {},
      })),
    );
    setUnread(typeof countData === 'number' ? countData : Number(countData ?? 0));
  }, [createClient]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void load();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, createClient, load]);

  async function markAll() {
    const supabase = createClient();
    await supabase.rpc('mark_all_my_notifications_read');
    await load();
  }

  async function markOne(id: string) {
    const supabase = createClient();
    await supabase.rpc('mark_my_notification_read', { p_notification_id: id });
    await load();
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="md"
        aria-label="Notificaciones"
        onClick={() => setOpen((v) => !v)}
      >
        Avisos
        {unread > 0 ? (
          <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-teal-700 px-1.5 text-xs text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-[min(100vw-2rem,22rem)] rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900">Notificaciones</p>
            {unread > 0 ? (
              <button
                type="button"
                className="text-xs text-teal-800 underline-offset-2 hover:underline"
                onClick={() => void markAll()}
              >
                Marcar todas
              </button>
            ) : null}
          </div>

          {items.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">Sin notificaciones</p>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto">
              {items.map((item) => (
                <li
                  key={item.id}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    item.isRead
                      ? 'border-slate-100 bg-slate-50 text-slate-600'
                      : 'border-teal-100 bg-teal-50/70 text-slate-900'
                  }`}
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => {
                      if (!item.isRead) void markOne(item.id);
                    }}
                  >
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-0.5 text-xs text-slate-600">{item.message}</p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {new Date(item.createdAt).toLocaleString('es-CL')}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
