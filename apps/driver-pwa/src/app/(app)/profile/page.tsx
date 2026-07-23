import { requireAppUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { updateProfileSchema } from '@pedidosgo/validation';
import { Alert, Button, Input } from '@pedidosgo/ui';
import { revalidatePath } from 'next/cache';
import { NotificationPrefsForm } from './notification-prefs-form';

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
  const supabase = await createClient();
  const { data: prefsRows } = await supabase.rpc('get_my_notification_preferences');
  const row = Array.isArray(prefsRows) ? prefsRows[0] : prefsRows;
  const prefs = {
    emailEnabled: Boolean(row?.email_enabled ?? true),
    inAppEnabled: Boolean(row?.in_app_enabled ?? true),
    soundEnabled: Boolean(row?.sound_enabled ?? true),
    vibrationEnabled: Boolean(row?.vibration_enabled ?? true),
  };

  return (
    <div className="space-y-5">
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
          <Input label="Teléfono" name="phone" defaultValue={profile.phone ?? ''} />
          <Button type="submit" size="lg">
            Guardar cambios
          </Button>
        </form>
      </div>

      <NotificationPrefsForm prefs={prefs} />
    </div>
  );
}
