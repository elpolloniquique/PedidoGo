import { Alert, Surface } from '@pedidosgo/ui';
import { requireAppUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { FeatureFlagsPanel, SettingsPanel } from './ops-panels';

export default async function OpsPage() {
  await requireAppUser();
  const supabase = await createClient();

  const [flagsRes, auditRes, errorsRes, settingsRes] = await Promise.all([
    supabase.rpc('list_feature_flags'),
    supabase.rpc('list_audit_logs', { p_limit: 60 }),
    supabase.rpc('list_system_errors', { p_limit: 40 }),
    supabase.rpc('list_app_settings_admin'),
  ]);

  if (flagsRes.error || auditRes.error || errorsRes.error || settingsRes.error) {
    return (
      <Alert variant="error">
        No se pudo cargar el panel de operaciones. ¿Aplicaste la migración Fase 20
        (`20260721000026_ops_audit_flags_fase20.sql`)?
        <br />
        {[flagsRes.error, auditRes.error, errorsRes.error, settingsRes.error]
          .filter(Boolean)
          .map((e) => e!.message)
          .join(' · ')}
      </Alert>
    );
  }

  const flags = ((flagsRes.data ?? []) as Array<Record<string, unknown>>).map((f) => ({
    key: String(f.key),
    enabled: Boolean(f.enabled),
    description: (f.description as string | null) ?? null,
  }));

  const audits = ((auditRes.data ?? []) as Array<Record<string, unknown>>).map((a) => ({
    id: String(a.id),
    action: String(a.action),
    entityType: String(a.entity_type),
    actorEmail: (a.actor_email as string | null) ?? null,
    createdAt: String(a.created_at ?? ''),
  }));

  const errors = ((errorsRes.data ?? []) as Array<Record<string, unknown>>).map((e) => ({
    id: String(e.id),
    source: String(e.source),
    message: String(e.message),
    createdAt: String(e.created_at ?? ''),
  }));

  const settings = ((settingsRes.data ?? []) as Array<Record<string, unknown>>).map((s) => ({
    key: String(s.key),
    value: String(s.value ?? ''),
    description: (s.description as string | null) ?? null,
    isPublic: Boolean(s.is_public),
  }));

  return (
    <div className="space-y-6">
      <Surface>
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
          Operaciones
        </h2>
        <p className="mt-2 text-sm text-[var(--color-ink-muted)]">
          Feature flags, ajustes de marca, bitácora y errores de sistema.
        </p>
      </Surface>

      <section className="space-y-3">
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Feature flags
        </h3>
        <FeatureFlagsPanel flags={flags} />
      </section>

      <section className="space-y-3">
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          App settings
        </h3>
        <SettingsPanel settings={settings} />
      </section>

      <section className="space-y-3">
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Auditoría reciente
        </h3>
        <ul className="divide-y divide-slate-100 rounded-2xl border border-teal-900/10 bg-white/90">
          {audits.length === 0 ? (
            <li className="px-4 py-3 text-sm text-[var(--color-ink-muted)]">Sin eventos.</li>
          ) : (
            audits.map((a) => (
              <li key={a.id} className="flex flex-wrap justify-between gap-2 px-4 py-3 text-sm">
                <span>
                  <strong>{a.action}</strong> · {a.entityType}
                  <span className="text-[var(--color-ink-muted)]">
                    {' '}
                    · {a.actorEmail ?? 'sistema'}
                  </span>
                </span>
                <span className="text-xs text-[var(--color-ink-muted)]">
                  {a.createdAt ? new Date(a.createdAt).toLocaleString('es-CL') : ''}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Errores de sistema / cliente
        </h3>
        <ul className="divide-y divide-slate-100 rounded-2xl border border-teal-900/10 bg-white/90">
          {errors.length === 0 ? (
            <li className="px-4 py-3 text-sm text-[var(--color-ink-muted)]">Sin errores recientes.</li>
          ) : (
            errors.map((e) => (
              <li key={e.id} className="px-4 py-3 text-sm">
                <p className="font-semibold">
                  {e.source}{' '}
                  <span className="text-xs font-normal text-[var(--color-ink-muted)]">
                    {e.createdAt ? new Date(e.createdAt).toLocaleString('es-CL') : ''}
                  </span>
                </p>
                <p className="mt-1 text-[var(--color-ink-muted)]">{e.message}</p>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
