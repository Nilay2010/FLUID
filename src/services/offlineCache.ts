/**
 * Dual-layer Offline Cache Engine (IndexedDB + localStorage fallback).
 * Ensures feed posts, external pulse items, stories, comments, chats, messages,
 * and follower lists remain accessible with high storage capacity even when completely offline.
 */

const DB_NAME = 'fluid_offline_cache_db';
const DB_VERSION = 1;
const STORE_NAME = 'keyval_cache';

export type CacheKey =
  | 'fluid_posts'
  | 'fluid_pulse_items'
  | 'fluid_stories'
  | 'fluid_comments'
  | 'fluid_chats'
  | 'fluid_messages'
  | 'fluid_following'
  | 'fluid_followers_list'
  | 'fluid_following_list'
  | 'fluid_user_notes'
  | 'fluid_offline_queue';

export interface OfflineMutation {
  id: string;
  type: 'like_post' | 'add_comment' | 'create_post';
  payload: Record<string, unknown>;
  createdAt: number;
}

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openCacheDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });

  return dbPromise;
}

/**
 * Synchronously reads initial state from localStorage for instant zero-flicker boot.
 */
export function readSyncCache<T>(key: CacheKey, fallback: T): T {
  try {
    if (typeof window === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Asynchronously reads from IndexedDB (falling back to localStorage).
 * Ideal for large feed datasets (images, posts, pulse items, message histories).
 */
export async function readOfflineCache<T>(key: CacheKey, fallback: T): Promise<T> {
  try {
    const db = await openCacheDB();
    if (db) {
      const value = await new Promise<T | undefined>((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const req = store.get(key);
          req.onsuccess = () => resolve(req.result as T | undefined);
          req.onerror = () => resolve(undefined);
        } catch {
          resolve(undefined);
        }
      });

      if (value !== undefined && value !== null) {
        return value;
      }
    }
  } catch {
    // Fallback to localStorage below
  }

  return readSyncCache<T>(key, fallback);
}

/**
 * Writes data to both IndexedDB (for large capacity persistence) and localStorage (for fast synchronous hydration).
 */
export async function writeOfflineCache<T>(key: CacheKey, data: T): Promise<void> {
  // 1. Best-effort synchronous write to localStorage
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch {
    // Quota exceeded in localStorage is safely handled by IndexedDB below
  }

  // 2. High-capacity write to IndexedDB
  try {
    const db = await openCacheDB();
    if (!db) return;

    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(data, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  } catch {
    // Ignore IDB write error
  }
}

/**
 * Enqueues a mutation performed while offline so it can be replayed when connectivity returns.
 */
export async function enqueueOfflineMutation(
  mutation: Omit<OfflineMutation, 'id' | 'createdAt'>
): Promise<void> {
  const existing = await readOfflineCache<OfflineMutation[]>('fluid_offline_queue', []);
  const next: OfflineMutation[] = [
    ...existing,
    {
      ...mutation,
      id: `mut_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: Date.now(),
    },
  ];
  await writeOfflineCache('fluid_offline_queue', next);
}

export async function consumeOfflineMutations(): Promise<OfflineMutation[]> {
  const queue = await readOfflineCache<OfflineMutation[]>('fluid_offline_queue', []);
  if (queue.length > 0) {
    await writeOfflineCache('fluid_offline_queue', []);
  }
  return queue;
}
