'use client';

import { brandConfig } from '@pedidosgo/config';
import { Alert, Button } from '@pedidosgo/ui';
import { useEffect, useState } from 'react';
import {
  type BeforeInstallPromptEvent,
  isIosDevice,
  isMarkedInstalled,
  isSafariBrowser,
  isStandaloneDisplay,
  markInstallDismissed,
  markInstalledLocally,
  wasInstallDismissedRecently,
} from '@/lib/pwa/detect';
import { createClient } from '@/lib/supabase/client';

type InstallPromptProps = {
  /** Solo mostrar si el repartidor está aprobado */
  driverApproved: boolean;
  driverId?: string;
};

export function InstallPrompt({ driverApproved, driverId }: InstallPromptProps) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [iosGuide, setIosGuide] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    setStandalone(isStandaloneDisplay());

    if (!driverApproved) return;
    if (isStandaloneDisplay() || isMarkedInstalled()) return;
    if (wasInstallDismissedRecently()) return;

    const onBip = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setVisible(true);
      setIosGuide(false);
    };

    const onInstalled = () => {
      markInstalledLocally();
      setVisible(false);
      setDeferred(null);
      void registerDevice(driverId, true);
    };

    window.addEventListener('beforeinstallprompt', onBip);
    window.addEventListener('appinstalled', onInstalled);

    // iOS: no hay beforeinstallprompt
    if (isIosDevice() && isSafariBrowser() && !isStandaloneDisplay()) {
      setIosGuide(true);
      setVisible(true);
    } else if (!isIosDevice()) {
      // Android/desktop: mostrar tarjeta genérica aunque aún no haya BIP
      setVisible(true);
    }

    if (isStandaloneDisplay()) {
      void registerDevice(driverId, true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBip);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [driverApproved, driverId]);

  if (!driverApproved || !visible || standalone) return null;

  async function onInstallClick() {
    if (!deferred) {
      // Sin prompt nativo: mostrar guía
      setIosGuide(true);
      return;
    }
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    if (choice.outcome === 'accepted') {
      markInstalledLocally();
      setVisible(false);
      void registerDevice(driverId, true);
    } else {
      markInstallDismissed();
      setVisible(false);
    }
  }

  function onDismiss() {
    markInstallDismissed();
    setVisible(false);
  }

  return (
    <div className="mb-4 rounded-2xl border border-teal-200 bg-teal-50/80 p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-teal-950">Tu cuenta fue aprobada</h3>
      <p className="mt-1 text-sm text-teal-900/80">
        Instala {brandConfig.appName} en tu celular para recibir pedidos, usar el GPS y trabajar
        más fácilmente.
      </p>

      {iosGuide ? (
        <Alert variant="info">
          <p className="font-medium">Para instalar en iPhone / iPad (Safari):</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
            <li>Presiona el botón Compartir de Safari.</li>
            <li>Selecciona “Agregar a pantalla de inicio”.</li>
            <li>Confirma el nombre {brandConfig.appName}.</li>
            <li>Presiona “Agregar”.</li>
          </ol>
        </Alert>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {!iosGuide ? (
          <Button type="button" size="lg" onClick={onInstallClick}>
            Instalar aplicativo
          </Button>
        ) : null}
        <Button type="button" size="lg" variant="secondary" onClick={onDismiss}>
          Ahora no
        </Button>
      </div>
    </div>
  );
}

async function registerDevice(driverId: string | undefined, isPwaInstalled: boolean) {
  if (!driverId) return;
  try {
    const supabase = createClient();
    const fingerprint =
      typeof navigator !== 'undefined'
        ? `${navigator.userAgent.slice(0, 120)}`
        : 'unknown';

    await supabase.from('driver_devices').insert({
      driver_id: driverId,
      device_fingerprint: fingerprint,
      platform: typeof navigator !== 'undefined' ? navigator.platform : null,
      is_pwa_installed: isPwaInstalled,
      last_opened_at: new Date().toISOString(),
    });
  } catch {
    // No bloquear la UI si falla el registro del dispositivo
  }
}
