import { InviteUserForm, MembersTable } from '@/components/merchant/users-panel';
import {
  listBranches,
  listMerchantMembers,
  requireMerchantContext,
} from '@/lib/merchant';
import { Alert } from '@pedidosgo/ui';

export default async function UsersPage() {
  const { merchant, membershipRole } = await requireMerchantContext();
  const [branches, members] = await Promise.all([
    listBranches(merchant.id),
    listMerchantMembers(merchant.id),
  ]);

  const canInvite = membershipRole === 'owner' || membershipRole === 'admin';
  const canManage = membershipRole === 'owner';

  return (
    <div className="space-y-6 rounded-2xl border border-teal-900/10 bg-white/90 p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Usuarios del comercio</h2>
      <Alert variant="info">
        El usuario debe estar registrado antes (mismo correo en Auth). No se envían invitaciones
        por email en esta fase.
      </Alert>

      <MembersTable members={members} canManage={canManage} />

      {canInvite ? (
        <div className="space-y-3 border-t border-slate-200 pt-6">
          <h3 className="font-semibold text-slate-900">Agregar usuario existente</h3>
          <InviteUserForm branches={branches} />
        </div>
      ) : null}
    </div>
  );
}
