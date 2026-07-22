'use client';

import { useEffect } from 'react';
import { cacheDriverSnapshot } from '@/lib/pwa/offline';

type Props = {
  driverId: string;
  status: string;
  email?: string | null;
  firstName?: string | null;
};

/** Guarda un snapshot mínimo para modo offline */
export function OfflineProfileSync({ driverId, status, email, firstName }: Props) {
  useEffect(() => {
    void cacheDriverSnapshot({ driverId, status, email, firstName });
  }, [driverId, status, email, firstName]);

  return null;
}
