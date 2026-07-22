/** IndexedDB offline limitado (Fase 5) */

const DB_NAME = 'pedidosgo-driver-offline';
const DB_VERSION = 1;
const STORE = 'kv';

type KvRecord = { key: string; value: unknown; updatedAt: number };

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function offlineSet(key: string, value: unknown): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({ key, value, updatedAt: Date.now() } satisfies KvRecord);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function offlineGet<T>(key: string): Promise<T | null> {
  const db = await openDb();
  const result = await new Promise<KvRecord | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result as KvRecord | undefined);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return (result?.value as T) ?? null;
}

export async function offlineDelete(key: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export type PendingAction = {
  id: string;
  type: string;
  payload: unknown;
  createdAt: number;
};

const PENDING_KEY = 'pending_actions';

export async function enqueuePendingAction(action: Omit<PendingAction, 'id' | 'createdAt'>): Promise<void> {
  const list = (await offlineGet<PendingAction[]>(PENDING_KEY)) ?? [];
  list.push({
    ...action,
    id: `pa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  });
  await offlineSet(PENDING_KEY, list);
}

export async function getPendingActions(): Promise<PendingAction[]> {
  return (await offlineGet<PendingAction[]>(PENDING_KEY)) ?? [];
}

export async function clearPendingActions(): Promise<void> {
  await offlineDelete(PENDING_KEY);
}

export async function cacheDriverSnapshot(snapshot: {
  driverId: string;
  status: string;
  email?: string | null;
  firstName?: string | null;
}): Promise<void> {
  await offlineSet('driver_profile', snapshot);
}
