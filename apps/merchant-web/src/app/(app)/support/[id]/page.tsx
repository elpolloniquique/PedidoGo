import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Surface } from '@pedidosgo/ui';
import { requireAppUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { TicketThread } from '../support-forms';

export default async function SupportTicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireAppUser();
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_support_ticket_thread', {
    p_ticket_id: id,
  });

  if (error || !data || (Array.isArray(data) && data.length === 0)) {
    notFound();
  }

  const rows = data as Array<Record<string, unknown>>;
  const first = rows[0];
  if (!first) {
    notFound();
  }
  const canModerate =
    profile.roles.includes('super_admin') ||
    profile.roles.includes('platform_admin') ||
    profile.roles.includes('support_agent');

  return (
    <div className="space-y-5">
      <div>
        <Link href="/support" className="text-sm font-semibold text-teal-800 hover:underline">
          ← Volver
        </Link>
      </div>
      <Surface>
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
          {String(first.subject)}
        </h2>
        <div className="mt-5">
          <TicketThread
            ticketId={id}
            status={String(first.status)}
            canModerate={canModerate}
            messages={rows.map((m) => ({
              id: String(m.message_id),
              authorEmail: (m.author_email as string | null) ?? null,
              message: String(m.message),
              createdAt: String(m.created_at),
            }))}
          />
        </div>
      </Surface>
    </div>
  );
}
