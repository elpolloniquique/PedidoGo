'use client';

import { useOpenJobsRealtime } from '@/lib/realtime';

export function JobsRealtimeBridge({ enabled }: { enabled: boolean }) {
  useOpenJobsRealtime(enabled);
  return null;
}
