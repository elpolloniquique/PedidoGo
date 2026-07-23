import Link from 'next/link';
import { Surface } from '@pedidosgo/ui';
import { requireAppUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { CreateTicketForm } from './support-forms';

const STATUS_LABEL: Record<string, string> = {
  open: 'Abierto',
  in_progress: 'En progreso',
  resolved: 'Resuelto',
  closed: 'Cerrado',
};

export default async function SupportListPage() {
  await requireAppUser();
  const supabase = await createClient();
  const { data } = await supabase.rpc('list_support_tickets', { p_limit: 80 });

  const tickets = ((data ?? []) as Array<Record<string, unknown>>).map((t) => ({
    id: String(t.id),
    subject: String(t.subject),
    status: String(t.status),
    priority: String(t.priority),
    userEmail: (t.user_email as string | null) ?? null,
    updatedAt: String(t.updated_at ?? ''),
  }));

  return (
    <div className="space-y-5">
      <Surface>
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
          Soporte
        </h2>
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
          Abrí un ticket si necesitás ayuda con pedidos, sucursales o integraciones.
        </p>
      </Surface>

      <Surface>
        <h3 className="mb-4 font-semibold">Nuevo ticket</h3>
        <CreateTicketForm />
      </Surface>

      <Surface>
        <h3 className="mb-3 font-semibold">Mis tickets</h3>
        <ul className="divide-y divide-slate-100">
          {tickets.length === 0 ? (
            <li className="py-2 text-sm text-[var(--color-ink-muted)]">Sin tickets.</li>
          ) : (
            tickets.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <Link
                    href={`/support/${t.id}`}
                    className="font-semibold text-teal-900 underline-offset-2 hover:underline"
                  >
                    {t.subject}
                  </Link>
                  <p className="text-xs text-[var(--color-ink-muted)]">
                    {STATUS_LABEL[t.status] ?? t.status} · {t.priority}
                  </p>
                </div>
                <span className="text-xs text-[var(--color-ink-muted)]">
                  {t.updatedAt ? new Date(t.updatedAt).toLocaleString('es-CL') : ''}
                </span>
              </li>
            ))
          )}
        </ul>
      </Surface>
    </div>
  );
}
