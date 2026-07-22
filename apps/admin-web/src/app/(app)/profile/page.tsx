import { requireAppUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { updateProfileSchema } from '@pedidosgo/validation';
import { Alert, Button, Input } from '@pedidosgo/ui';
import { revalidatePath } from 'next/cache';

async function updateProfileAction(formData: FormData) {
  'use server';

  const parsed = updateProfileSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    phone: formData.get('phone') || '',
  });

  if (!parsed.success) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('profiles')
    .update({
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      phone: parsed.data.phone || null,
    })
    .eq('id', user.id);

  revalidatePath('/profile');
}

export default async function ProfilePage() {
  const profile = await requireAppUser();

  return (
    <div className="space-y-4 rounded-2xl border border-teal-900/10 bg-white/90 p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Mi perfil</h2>
      <Alert variant="info">Correo: {profile.email}</Alert>

      <form action={updateProfileAction} className="flex max-w-md flex-col gap-4">
        <Input
          label="Nombre"
          name="firstName"
          defaultValue={profile.firstName ?? ''}
          required
        />
        <Input
          label="Apellido"
          name="lastName"
          defaultValue={profile.lastName ?? ''}
          required
        />
        <Input
          label="Teléfono"
          name="phone"
          defaultValue={profile.phone ?? ''}
        />
        <Button type="submit" size="lg">
          Guardar cambios
        </Button>
      </form>
    </div>
  );
}
