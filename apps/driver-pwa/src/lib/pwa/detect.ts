/** Utilidades PWA PedidosGo (cliente) */

export const INSTALL_DISMISS_KEY = 'pedidosgo.pwa.installDismissedAt';
export const INSTALL_DONE_KEY = 'pedidosgo.pwa.installed';
export const ACTIVE_DELIVERY_KEY = 'pedidosgo.pwa.activeDelivery';
export const DISMISS_DAYS = 7;

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false;
  const media = window.matchMedia('(display-mode: standalone)').matches;
  const iosStandalone =
    'standalone' in navigator &&
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
  return media || iosStandalone;
}

export function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function isSafariBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios|chrome|android/i.test(ua);
  return isSafari || (/iphone|ipad|ipod/i.test(ua) && /safari/i.test(ua) && !/crios|fxios/i.test(ua));
}

export function wasInstallDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(INSTALL_DISMISS_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return false;
    const ms = DISMISS_DAYS * 24 * 60 * 60 * 1000;
    return Date.now() - ts < ms;
  } catch {
    return false;
  }
}

export function markInstallDismissed(): void {
  try {
    localStorage.setItem(INSTALL_DISMISS_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

export function markInstalledLocally(): void {
  try {
    localStorage.setItem(INSTALL_DONE_KEY, '1');
  } catch {
    // ignore
  }
}

export function isMarkedInstalled(): boolean {
  try {
    return localStorage.getItem(INSTALL_DONE_KEY) === '1';
  } catch {
    return false;
  }
}

export function hasActiveDeliveryLock(): boolean {
  try {
    return localStorage.getItem(ACTIVE_DELIVERY_KEY) === '1';
  } catch {
    return false;
  }
}

/** Marca bloqueo de actualización (usar en fases de pedido activo) */
export function setActiveDeliveryLock(active: boolean): void {
  try {
    if (active) localStorage.setItem(ACTIVE_DELIVERY_KEY, '1');
    else localStorage.removeItem(ACTIVE_DELIVERY_KEY);
  } catch {
    // ignore
  }
}
