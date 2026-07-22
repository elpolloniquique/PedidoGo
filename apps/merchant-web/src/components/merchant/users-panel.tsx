'use client';

import { Button, Input } from '@pedidosgo/ui';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import {
  inviteMerchantUserAction,
  setMerchantUserActiveAction,
} from '@/app/(app)/actions';
import type { BranchRecord, MerchantMemberRecord } from '@/lib/merchant-constants';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Dueño',
  admin: 'Admin',
  operator: 'Operador',
};

export function InviteUserForm({ branches }: { branches: BranchRecord[] }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    const result = await inviteMerchantUserAction(new FormData(event.currentTarget));
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(result.message ?? 'OK');
    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-lg flex-col gap-4">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      <Input label="Correo del usuario" name="email" type="email" required />
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-slate-700">Rol en el comercio</span>
        <select
          name="role"
          defaultValue="operator"
          className="min-h-11 rounded-xl border border-slate-300 bg-white px-3"
        >
          <option value="admin">Admin</option>
          <option value="operator">Operador</option>
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-slate-700">Sucursal (opcional)</span>
        <select
          name="branchId"
          defaultValue=""
          className="min-h-11 rounded-xl border border-slate-300 bg-white px-3"
        >
          <option value="">Todas las sucursales</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" size="lg" disabled={loading}>
        {loading ? 'Vinculando…' : 'Agregar usuario'}
      </Button>
    </form>
  );
}

export function MembersTable({
  members,
  canManage,
}: {
  members: MerchantMemberRecord[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggle(member: MerchantMemberRecord) {
    setBusyId(member.id);
    setError(null);
    const result = await setMerchantUserActiveAction(member.id, !member.isActive);
    setBusyId(null);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200">
        {members.map((m) => (
          <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-medium text-slate-900">
                {[m.firstName, m.lastName].filter(Boolean).join(' ') || 'Sin nombre'}
              </p>
              <p className="text-sm text-slate-600">{m.email}</p>
              <p className="text-xs text-slate-500">
                {ROLE_LABELS[m.role] ?? m.role}
                {m.isActive ? '' : ' · inactivo'}
              </p>
            </div>
            {canManage && m.role !== 'owner' ? (
              <Button
                type="button"
                variant="ghost"
                size="md"
                disabled={busyId === m.id}
                onClick={() => toggle(m)}
              >
                {m.isActive ? 'Desactivar' : 'Activar'}
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
