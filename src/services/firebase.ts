import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  User,
  Auth
} from 'firebase/auth';
import {
  getDatabase,
  ref,
  set,
  get,
  remove,
  update,
  onValue,
  Database,
  Unsubscribe
} from 'firebase/database';

// Firebase configuration provided by user
export const firebaseConfig = {
  apiKey: "AIzaSyCQY1Zl2_bLEHFm5td7t_bBfC678k1Qz0I",
  authDomain: "hecosrpg-c2563.firebaseapp.com",
  databaseURL: "https://hecosrpg-c2563-default-rtdb.firebaseio.com",
  projectId: "hecosrpg-c2563",
  storageBucket: "hecosrpg-c2563.firebasestorage.app",
  messagingSenderId: "839841482829",
  appId: "1:839841482829:web:de7de2a2c1185bf9f67404",
  measurementId: "G-S73XMX6JD7"
};

let app: any = null;
let db: Database | null = null;
let auth: Auth | null = null;
let analytics: Analytics | null = null;
let isFirebaseAvailable = false;

export type FirebaseConnectionStatus = 'connected' | 'connecting' | 'offline' | 'error';
export type FirebaseAuthStatus = 'authenticated' | 'anonymous' | 'unauthenticated' | 'error' | 'initializing';

export interface ConnectionState {
  status: FirebaseConnectionStatus;
  isRealtimeActive: boolean;
  lastSyncedAt: string | null;
  lastError: string | null;
  projectId?: string;
  databaseURL?: string;
  authStatus: FirebaseAuthStatus;
  authUid: string | null;
  isAnonymous: boolean;
}

const connectionState: ConnectionState = {
  status: 'connecting',
  isRealtimeActive: false,
  lastSyncedAt: null,
  lastError: null,
  projectId: firebaseConfig.projectId,
  databaseURL: firebaseConfig.databaseURL,
  authStatus: 'initializing',
  authUid: null,
  isAnonymous: false
};

const statusListeners = new Set<(state: ConnectionState) => void>();

function updateConnectionState(partial: Partial<ConnectionState>) {
  Object.assign(connectionState, partial);
  statusListeners.forEach((listener) => {
    try {
      listener({ ...connectionState });
    } catch (e) {
      console.warn("Error in connection status listener:", e);
    }
  });
}

export function subscribeFirebaseStatus(listener: (state: ConnectionState) => void): () => void {
  listener({ ...connectionState });
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
}

export function getFirebaseConnectionState(): ConnectionState {
  return { ...connectionState };
}

/**
 * Initialize Firebase Realtime Database & Authentication
 */
try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  // Initialize Realtime Database with explicit database URL
  db = getDatabase(app, firebaseConfig.databaseURL);
  isFirebaseAvailable = true;

  // Initialize Auth
  try {
    auth = getAuth(app);
    let isSigningIn = false;
    onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        updateConnectionState({
          authStatus: user.isAnonymous ? 'anonymous' : 'authenticated',
          authUid: user.uid,
          isAnonymous: user.isAnonymous
        });
      } else {
        updateConnectionState({
          authStatus: 'unauthenticated',
          authUid: null,
          isAnonymous: false
        });
        // Auto sign-in anonymously in the background so that security rules requiring `auth != null` succeed seamlessly
        if (auth && !isSigningIn) {
          isSigningIn = true;
          signInAnonymously(auth)
            .catch(() => {
              updateConnectionState({
                authStatus: 'unauthenticated'
              });
            })
            .finally(() => {
              isSigningIn = false;
            });
        }
      }
    });
  } catch (_authErr) {
    // Auth initialization fallback
  }

  // Initialize Analytics if running in supported browser environment
  if (typeof window !== 'undefined') {
    isSupported()
      .then((supported) => {
        if (supported && app) {
          analytics = getAnalytics(app);
        }
      })
      .catch(() => {});
  }

  // Monitor real-time connection status via Firebase RTDB's native /.info/connected
  try {
    const connectedRef = ref(db, '.info/connected');
    onValue(connectedRef, (snap) => {
      const isConnected = snap.val() === true;
      if (isConnected) {
        updateConnectionState({
          status: 'connected',
          isRealtimeActive: true,
          lastSyncedAt: new Date().toISOString(),
          lastError: null
        });
      } else {
        updateConnectionState({
          status: 'connecting',
          isRealtimeActive: false
        });
      }
    });
  } catch (err: any) {
    console.warn("Failed to attach .info/connected listener:", err);
  }
} catch (error: any) {
  console.warn("Firebase RTDB initialization fallback to local-first mode:", error);
  isFirebaseAvailable = false;
  db = null;
  auth = null;
  updateConnectionState({
    status: 'offline',
    isRealtimeActive: false,
    lastError: error?.message || 'Realtime Database initialization failed',
    authStatus: 'error'
  });
}

export { app, db, auth, analytics, isFirebaseAvailable };

/**
 * Convert any string key to a safe Firebase Realtime Database key.
 * Firebase RTDB prohibits: . # $ [ ] /
 */
export function toSafeKey(key: string): string {
  if (!key) return 'item_' + Date.now();
  return String(key).replace(/[.#$[\]/]/g, '_');
}

/**
 * Recursively remove `undefined` values and sanitize objects for Firebase Realtime Database
 */
export function cleanForFirebase(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }
  if (typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => cleanForFirebase(item)).filter((item) => item !== undefined);
  }
  const cleaned: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      cleaned[k] = cleanForFirebase(v);
    }
  }
  return cleaned;
}

/**
 * Check if an error is a Firebase permission_denied error
 */
export function isPermissionDeniedError(err: any): boolean {
  if (!err) return false;
  const msg = String(err?.message || err?.code || err || '').toLowerCase();
  return msg.includes('permission_denied') || msg.includes('permission denied');
}

/**
 * Helper to race a promise against a timeout (Aumentado para 20s para evitar falso timeout em redes lentas)
 */
function withTimeout<T>(promise: Promise<T>, ms: number = 20000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Realtime Database timeout após ${ms}ms`)), ms)
    )
  ]);
}

/**
 * Real-time listener for 'hecos_entities'
 */
export function subscribeToEntitiesRealtime(
  onUpdate: (entities: any[]) => void,
  onError?: (error: any) => void
): Unsubscribe | null {
  if (!isFirebaseAvailable || !db) {
    updateConnectionState({ isRealtimeActive: false, status: 'offline' });
    return null;
  }

  try {
    const entitiesRef = ref(db, 'hecos_entities');
    const unsubscribe = onValue(
      entitiesRef,
      (snapshot) => {
        const val = snapshot.val();
        const list: any[] = [];
        if (val) {
          if (Array.isArray(val)) {
            val.forEach((item) => {
              if (item && item.id) list.push(item);
            });
          } else if (typeof val === 'object') {
            Object.values(val).forEach((item: any) => {
              if (item && item.id) list.push(item);
            });
          }
        }
        updateConnectionState({
          status: 'connected',
          isRealtimeActive: true,
          lastSyncedAt: new Date().toISOString(),
          lastError: null
        });
        onUpdate(list);
      },
      (error) => {
        if (!isPermissionDeniedError(error)) {
          console.warn("Real-time entities listener error:", error);
        } else {
          console.info("[Firebase] Permissão restrita no RTDB para entidades. Operando em cache offline.");
        }
        updateConnectionState({
          isRealtimeActive: false,
          lastError: error.message || 'Realtime subscription error'
        });
        if (onError) onError(error);
      }
    );

    updateConnectionState({ isRealtimeActive: true, status: 'connected' });
    return unsubscribe;
  } catch (err: any) {
    if (!isPermissionDeniedError(err)) {
      console.warn("Failed to subscribe to realtime entities:", err);
    }
    updateConnectionState({ isRealtimeActive: false, lastError: err?.message || 'Subscription failed' });
    return null;
  }
}

/**
 * Real-time listener for 'hecos_trash'
 */
export function subscribeToTrashRealtime(
  onUpdate: (trash: any[]) => void
): Unsubscribe | null {
  if (!isFirebaseAvailable || !db) return null;

  try {
    const trashRef = ref(db, 'hecos_trash');
    return onValue(
      trashRef,
      (snapshot) => {
        const val = snapshot.val();
        const list: any[] = [];
        if (val) {
          if (Array.isArray(val)) {
            val.forEach((t) => { if (t && t.entity && t.entity.id) list.push(t); });
          } else if (typeof val === 'object') {
            Object.values(val).forEach((t: any) => { if (t && t.entity && t.entity.id) list.push(t); });
          }
        }
        onUpdate(list);
      },
      (error) => {
        if (!isPermissionDeniedError(error)) {
          console.warn("Real-time trash error:", error);
        }
      }
    );
  } catch (err) {
    return null;
  }
}

/**
 * Sync entire trash array to Firebase Realtime Database
 */
export async function syncTrashToFirebase(trash: any[]): Promise<boolean> {
  if (!isFirebaseAvailable || !db || !trash) return false;
  try {
    const trashRef = ref(db, 'hecos_trash');
    const payload = cleanForFirebase(trash);
    await withTimeout(set(trashRef, payload), 15000);
    return true;
  } catch (err: any) {
    console.warn("Sync trash to Firebase notice:", err?.message || err);
    return false;
  }
}

/**
 * Loads trash from Firebase Realtime Database
 */
export async function loadTrashFromFirebase(): Promise<any[] | null> {
  if (!isFirebaseAvailable || !db) return null;
  try {
    const trashRef = ref(db, 'hecos_trash');
    const snap = await withTimeout(get(trashRef), 15000);
    if (!snap.exists()) return [];
    const val = snap.val();
    const list: any[] = [];
    if (Array.isArray(val)) {
      val.forEach((t) => { if (t && t.entity && t.entity.id) list.push(t); });
    } else if (typeof val === 'object') {
      Object.values(val).forEach((t: any) => { if (t && t.entity && t.entity.id) list.push(t); });
    }
    return list;
  } catch (err: any) {
    console.warn("Load trash from Firebase notice:", err?.message || err);
    return null;
  }
}

/**
 * Real-time listener for 'hecos_deleted_entities'
 */
export function subscribeToDeletedEntitiesRealtime(
  onUpdate: (deletedMap: Record<string, { id: string; deletedAt: string }>) => void
): Unsubscribe | null {
  if (!isFirebaseAvailable || !db) return null;

  try {
    const deletedRef = ref(db, 'hecos_deleted_entities');
    return onValue(deletedRef, (snapshot) => {
      const val = snapshot.val();
      if (val && typeof val === 'object') {
        onUpdate(val);
      } else {
        onUpdate({});
      }
    });
  } catch (err) {
    return null;
  }
}

/**
 * Real-time listener for 'hecos_maps'
 */
export function subscribeToMapsRealtime(
  onUpdate: (maps: any[]) => void
): Unsubscribe | null {
  if (!isFirebaseAvailable || !db) return null;

  try {
    const mapsRef = ref(db, 'hecos_maps');
    return onValue(
      mapsRef,
      (snapshot) => {
        const val = snapshot.val();
        const list: any[] = [];
        if (val) {
          if (Array.isArray(val)) {
            val.forEach((m) => { if (m && m.id) list.push(m); });
          } else if (typeof val === 'object') {
            Object.values(val).forEach((m: any) => { if (m && m.id) list.push(m); });
          }
        }
        if (list.length > 0) {
          onUpdate(list);
        }
      },
      (error) => {
        console.warn("Real-time maps error:", error);
      }
    );
  } catch (err) {
    return null;
  }
}

/**
 * Real-time listener for 'hecos_feat_categories'
 */
export function subscribeToFeatCategoriesRealtime(
  onUpdate: (categories: Record<string, string[]>) => void
): Unsubscribe | null {
  if (!isFirebaseAvailable || !db) return null;

  try {
    const categoriesRef = ref(db, 'hecos_feat_categories');
    return onValue(
      categoriesRef,
      (snapshot) => {
        const val = snapshot.val();
        if (val && typeof val === 'object') {
          onUpdate(val);
        } else {
          onUpdate({});
        }
      },
      (error) => {
        if (!isPermissionDeniedError(error)) {
          console.warn("Real-time feat categories error:", error);
        } else {
          console.info("[Firebase] Categorias de talentos operando em modo local.");
        }
      }
    );
  } catch (err) {
    return null;
  }
}

/**
 * Save feat categories config to Firebase Realtime Database
 */
export async function syncFeatCategoriesToFirebase(config: Record<string, string[]>): Promise<boolean> {
  if (!isFirebaseAvailable || !db || !config) return false;
  try {
    const categoriesRef = ref(db, 'hecos_feat_categories');
    const payload = cleanForFirebase(config);
    await withTimeout(set(categoriesRef, payload), 15000);
    return true;
  } catch (err: any) {
    if (!isPermissionDeniedError(err)) {
      console.warn("Sync feat categories notice:", err?.message || err);
    }
    return false;
  }
}

/**
 * Real-time listener for 'hecos_spell_categories'
 */
export function subscribeToSpellCategoriesRealtime(
  onUpdate: (categories: Record<string, string[]>) => void
): Unsubscribe | null {
  if (!isFirebaseAvailable || !db) return null;

  try {
    const categoriesRef = ref(db, 'hecos_spell_categories');
    return onValue(
      categoriesRef,
      (snapshot) => {
        const val = snapshot.val();
        if (val && typeof val === 'object') {
          onUpdate(val);
        } else {
          onUpdate({});
        }
      },
      (error) => {
        if (!isPermissionDeniedError(error)) {
          console.warn("Real-time spell categories error:", error);
        } else {
          console.info("[Firebase] Categorias de magias operando em modo local.");
        }
      }
    );
  } catch (err) {
    return null;
  }
}

/**
 * Save spell categories config to Firebase Realtime Database
 */
export async function syncSpellCategoriesToFirebase(config: Record<string, string[]>): Promise<boolean> {
  if (!isFirebaseAvailable || !db || !config) return false;
  try {
    const categoriesRef = ref(db, 'hecos_spell_categories');
    const payload = cleanForFirebase(config);
    await withTimeout(set(categoriesRef, payload), 15000);
    return true;
  } catch (err: any) {
    if (!isPermissionDeniedError(err)) {
      console.warn("Sync spell categories notice:", err?.message || err);
    }
    return false;
  }
}

/**
 * Real-time listener for generic scope categories (e.g. 'hecos_item_categories', etc.)
 */
export function subscribeToScopeCategoriesRealtime(
  scope: string,
  onUpdate: (categories: Record<string, string[]>) => void
): Unsubscribe | null {
  if (!isFirebaseAvailable || !db || !scope) return null;

  try {
    const categoriesRef = ref(db, `hecos_${scope}_categories`);
    return onValue(
      categoriesRef,
      (snapshot) => {
        const val = snapshot.val();
        if (val && typeof val === 'object') {
          onUpdate(val);
        } else {
          onUpdate({});
        }
      },
      (error) => {
        if (!isPermissionDeniedError(error)) {
          console.warn(`Real-time ${scope} categories error:`, error);
        } else {
          console.info(`[Firebase] Categorias de ${scope} operando em modo local com fallback.`);
        }
      }
    );
  } catch (err) {
    return null;
  }
}

/**
 * Save generic scope categories config to Firebase Realtime Database
 */
export async function syncScopeCategoriesToFirebase(scope: string, config: Record<string, string[]>): Promise<boolean> {
  if (!isFirebaseAvailable || !db || !config || !scope) return false;
  try {
    const categoriesRef = ref(db, `hecos_${scope}_categories`);
    const payload = cleanForFirebase(config);
    await withTimeout(set(categoriesRef, payload), 15000);
    return true;
  } catch (err: any) {
    if (!isPermissionDeniedError(err)) {
      console.warn(`Sync ${scope} categories notice:`, err?.message || err);
    }
    return false;
  }
}

/**
 * Real-time listener for 'hecos_public_folders' (revealed folders)
 */
export function subscribeToPublicFoldersRealtime(
  onUpdate: (folders: string[]) => void
): Unsubscribe | null {
  if (!isFirebaseAvailable || !db) return null;

  try {
    const publicRef = ref(db, 'hecos_public_folders');
    return onValue(
      publicRef,
      (snapshot) => {
        const val = snapshot.val();
        if (Array.isArray(val)) {
          onUpdate(val);
        } else if (val && typeof val === 'object') {
          onUpdate(Object.keys(val));
        } else {
          onUpdate([]);
        }
      },
      (error) => {
        if (!isPermissionDeniedError(error)) {
          console.warn("Real-time public folders error:", error);
        }
      }
    );
  } catch (err) {
    return null;
  }
}

/**
 * Save public (revealed) folders set to Firebase Realtime Database
 */
export async function syncPublicFoldersToFirebase(folders: string[]): Promise<boolean> {
  if (!isFirebaseAvailable || !db || !folders) return false;
  try {
    const publicRef = ref(db, 'hecos_public_folders');
    await withTimeout(set(publicRef, folders), 15000);
    return true;
  } catch (err: any) {
    if (!isPermissionDeniedError(err)) {
      console.warn("Sync public folders notice:", err?.message || err);
    }
    return false;
  }
}

/**
 * Real-time listener for 'hecos_secret_folders'
 */
export function subscribeToSecretFoldersRealtime(
  onUpdate: (folders: string[]) => void
): Unsubscribe | null {
  if (!isFirebaseAvailable || !db) return null;

  try {
    const secretsRef = ref(db, 'hecos_secret_folders');
    return onValue(
      secretsRef,
      (snapshot) => {
        const val = snapshot.val();
        if (Array.isArray(val)) {
          onUpdate(val);
        } else if (val && typeof val === 'object') {
          onUpdate(Object.keys(val));
        } else {
          onUpdate([]);
        }
      },
      (error) => {
        if (!isPermissionDeniedError(error)) {
          console.warn("Real-time secret folders error:", error);
        }
      }
    );
  } catch (err) {
    return null;
  }
}

/**
 * Save secret folders set to Firebase Realtime Database
 */
export async function syncSecretFoldersToFirebase(folders: string[]): Promise<boolean> {
  if (!isFirebaseAvailable || !db || !folders) return false;
  try {
    const secretsRef = ref(db, 'hecos_secret_folders');
    await withTimeout(set(secretsRef, folders), 15000);
    return true;
  } catch (err: any) {
    if (!isPermissionDeniedError(err)) {
      console.warn("Sync secret folders notice:", err?.message || err);
    }
    return false;
  }
}

/**
 * Real-time listener for 'hecos_deleted_folders'
 */
export function subscribeToDeletedFoldersRealtime(
  onUpdate: (deletedMap: Record<string, { name: string; deletedAt?: string } | boolean>) => void
): Unsubscribe | null {
  if (!isFirebaseAvailable || !db) return null;

  try {
    const deletedRef = ref(db, 'hecos_deleted_folders');
    return onValue(
      deletedRef,
      (snapshot) => {
        const val = snapshot.val();
        if (val && typeof val === 'object') {
          onUpdate(val);
        } else {
          onUpdate({});
        }
      },
      (error) => {
        if (!isPermissionDeniedError(error)) {
          console.warn("Real-time deleted folders error:", error);
        }
      }
    );
  } catch (err) {
    return null;
  }
}

/**
 * Records a deleted folder in Firebase Realtime Database
 */
export async function syncDeletedFolderToFirebase(folderName: string): Promise<boolean> {
  if (!isFirebaseAvailable || !db || !folderName) return false;
  try {
    const trimmed = folderName.trim();
    if (!trimmed) return false;
    const safeKey = toSafeKey(trimmed);
    const folderRef = ref(db, `hecos_deleted_folders/${safeKey}`);
    await withTimeout(set(folderRef, {
      name: trimmed,
      deletedAt: new Date().toISOString()
    }), 15000);
    return true;
  } catch (err: any) {
    if (!isPermissionDeniedError(err)) {
      console.warn("Sync deleted folder to RTDB notice:", err?.message || err);
    }
    return false;
  }
}

/**
 * Removes a folder from the deleted list in Firebase Realtime Database (e.g. when user explicitly recreates it)
 */
export async function deleteDeletedFolderFromFirebase(folderName: string): Promise<boolean> {
  if (!isFirebaseAvailable || !db || !folderName) return false;
  try {
    const trimmed = folderName.trim();
    if (!trimmed) return false;
    const safeKey = toSafeKey(trimmed);
    const folderRef = ref(db, `hecos_deleted_folders/${safeKey}`);
    await withTimeout(remove(folderRef), 15000);
    return true;
  } catch (err: any) {
    if (!isPermissionDeniedError(err)) {
      console.warn("Remove deleted folder from RTDB notice:", err?.message || err);
    }
    return false;
  }
}

/**
 * Fetches deleted folders once from Firebase Realtime Database
 */
export async function loadDeletedFoldersFromFirebase(): Promise<string[]> {
  if (!isFirebaseAvailable || !db) return [];
  try {
    const deletedRef = ref(db, 'hecos_deleted_folders');
    const snap = await withTimeout(get(deletedRef), 15000);
    if (snap.exists()) {
      const val = snap.val();
      if (val && typeof val === 'object') {
        const names: string[] = [];
        Object.entries(val).forEach(([key, info]: [string, any]) => {
          const name = (typeof info === 'object' && info && 'name' in info) ? info.name : key;
          if (name && typeof name === 'string' && name.trim()) {
            names.push(name.trim());
          }
        });
        return names;
      }
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Saves or updates an entity to Firebase Realtime Database (node 'hecos_entities/<safeId>')
 */
export async function syncEntityToFirebase(entity: any): Promise<boolean> {
  if (!isFirebaseAvailable || !db || !entity || !entity.id) return false;
  try {
    const safeKey = toSafeKey(entity.id);
    const entityRef = ref(db, `hecos_entities/${safeKey}`);
    const deletedRef = ref(db, `hecos_deleted_entities/${safeKey}`);

    const payload = cleanForFirebase({
      ...entity,
      _syncedAt: new Date().toISOString()
    });

    // Save to RTDB
    await withTimeout(set(entityRef, payload), 20000);

    // Unmark from deleted if it was previously marked as deleted
    try {
      await remove(deletedRef);
    } catch {
      // ignore
    }

    updateConnectionState({
      status: 'connected',
      lastSyncedAt: new Date().toISOString(),
      lastError: null
    });
    return true;
  } catch (err: any) {
    console.warn("Sync entity to Realtime Database notice:", err?.message || err);
    updateConnectionState({
      lastError: err?.message || 'Sync failed'
    });
    return false;
  }
}

/**
 * Deletes an entity from Firebase Realtime Database
 */
export async function deleteEntityFromFirebase(entityId: string): Promise<boolean> {
  if (!isFirebaseAvailable || !db || !entityId) return false;
  try {
    const safeKey = toSafeKey(entityId);
    const entityRef = ref(db, `hecos_entities/${safeKey}`);
    const deletedRef = ref(db, `hecos_deleted_entities/${safeKey}`);

    // Remove entity from RTDB
    await withTimeout(remove(entityRef), 20000);

    // Record in deleted entities so other clients stay in sync
    try {
      await set(deletedRef, {
        id: entityId,
        deletedAt: new Date().toISOString()
      });
    } catch {
      // ignore
    }

    updateConnectionState({
      status: 'connected',
      lastSyncedAt: new Date().toISOString()
    });
    return true;
  } catch (err: any) {
    console.warn("Delete entity from RTDB notice:", err?.message || err);
    return false;
  }
}

/**
 * Loads all entities from Firebase Realtime Database with a graceful timeout
 */
export async function loadEntitiesFromFirebase(): Promise<any[] | null> {
  if (!isFirebaseAvailable || !db) return null;
  try {
    const entitiesRef = ref(db, 'hecos_entities');
    const snapshot = await withTimeout(get(entitiesRef), 20000);
    if (!snapshot.exists()) return null;

    const val = snapshot.val();
    const list: any[] = [];
    if (Array.isArray(val)) {
      val.forEach((item) => {
        if (item && item.id) list.push(item);
      });
    } else if (typeof val === 'object') {
      Object.values(val).forEach((item: any) => {
        if (item && item.id) list.push(item);
      });
    }

    if (list.length > 0) {
      updateConnectionState({
        status: 'connected',
        lastSyncedAt: new Date().toISOString(),
        lastError: null
      });
      return list;
    }
    return null;
  } catch (err: any) {
    console.warn("Load entities from Realtime Database info:", err?.message || err);
    updateConnectionState({
      lastError: err?.message || 'Falha ao ler dados do Realtime Database'
    });
    return null;
  }
}

/**
 * Save map to Firebase Realtime Database
 */
export async function syncMapToFirebase(mapData: any): Promise<boolean> {
  if (!isFirebaseAvailable || !db || !mapData || !mapData.id) return false;
  try {
    const safeKey = toSafeKey(mapData.id);
    const mapRef = ref(db, `hecos_maps/${safeKey}`);
    const payload = cleanForFirebase(mapData);
    await withTimeout(set(mapRef, payload), 15000);
    return true;
  } catch (err: any) {
    console.warn("Sync map to Firebase notice:", err?.message || err);
    return false;
  }
}

/**
 * Delete a map from Firebase Realtime Database
 */
export async function deleteMapFromFirebase(mapId: string): Promise<boolean> {
  if (!isFirebaseAvailable || !db || !mapId) return false;
  try {
    const safeKey = toSafeKey(mapId);
    const mapRef = ref(db, `hecos_maps/${safeKey}`);
    await withTimeout(remove(mapRef), 15000);
    return true;
  } catch (err: any) {
    console.warn("Delete map from Firebase notice:", err?.message || err);
    return false;
  }
}

/**
 * Sync entire array of maps to Firebase Realtime Database
 */
export async function syncAllMapsToFirebase(maps: any[]): Promise<boolean> {
  if (!isFirebaseAvailable || !db || !Array.isArray(maps)) return false;
  try {
    const mapsRef = ref(db, 'hecos_maps');
    const batch: Record<string, any> = {};
    maps.forEach((m) => {
      if (m && m.id) {
        batch[toSafeKey(m.id)] = cleanForFirebase(m);
      }
    });
    await withTimeout(set(mapsRef, batch), 15000);
    return true;
  } catch (err: any) {
    console.warn("Sync all maps to Firebase notice:", err?.message || err);
    return false;
  }
}

/**
 * Load maps from Firebase Realtime Database
 */
export async function loadMapsFromFirebase(): Promise<any[] | null> {
  if (!isFirebaseAvailable || !db) return null;
  try {
    const mapsRef = ref(db, 'hecos_maps');
    const snap = await withTimeout(get(mapsRef), 15000);
    if (!snap.exists()) return null;
    const val = snap.val();
    const list: any[] = [];
    if (Array.isArray(val)) {
      val.forEach(d => { if (d && d.id) list.push(d); });
    } else if (typeof val === 'object') {
      Object.values(val).forEach((d: any) => { if (d && d.id) list.push(d); });
    }
    return list.length > 0 ? list : null;
  } catch {
    return null;
  }
}

/**
 * Sync YouTube tracks to Firebase Realtime Database
 */
export async function syncTracksToFirebase(tracks: any[]): Promise<boolean> {
  if (!isFirebaseAvailable || !db || !Array.isArray(tracks)) return false;
  try {
    const tracksRef = ref(db, 'hecos_youtube_tracks');
    const batch: Record<string, any> = {};
    tracks.forEach((t) => {
      if (t && t.id) {
        batch[toSafeKey(t.id)] = cleanForFirebase(t);
      }
    });
    await withTimeout(set(tracksRef, batch), 15000);
    return true;
  } catch (err: any) {
    console.warn("Sync tracks to Firebase notice:", err?.message || err);
    return false;
  }
}

/**
 * Load YouTube tracks from Firebase Realtime Database
 */
export async function loadTracksFromFirebase(): Promise<any[] | null> {
  if (!isFirebaseAvailable || !db) return null;
  try {
    const tracksRef = ref(db, 'hecos_youtube_tracks');
    const snap = await withTimeout(get(tracksRef), 15000);
    if (!snap.exists()) return null;
    const val = snap.val();
    const list: any[] = [];
    if (Array.isArray(val)) {
      val.forEach(t => { if (t && t.id) list.push(t); });
    } else if (typeof val === 'object') {
      Object.values(val).forEach((t: any) => { if (t && t.id) list.push(t); });
    }
    return list.length > 0 ? list : null;
  } catch {
    return null;
  }
}

/**
 * Subscribe to YouTube tracks in Realtime
 */
export function subscribeToTracksRealtime(callback: (tracks: any[]) => void): Unsubscribe {
  if (!isFirebaseAvailable || !db) return () => {};
  try {
    const tracksRef = ref(db, 'hecos_youtube_tracks');
    return onValue(tracksRef, (snap) => {
      if (!snap.exists()) return;
      const val = snap.val();
      const list: any[] = [];
      if (Array.isArray(val)) {
        val.forEach(t => { if (t && t.id) list.push(t); });
      } else if (typeof val === 'object') {
        Object.values(val).forEach((t: any) => { if (t && t.id) list.push(t); });
      }
      if (list.length > 0) {
        callback(list);
      }
    }, (error) => {
      if (!isPermissionDeniedError(error)) {
        console.warn("Real-time tracks error:", error);
      }
    });
  } catch {
    return () => {};
  }
}

/**
 * Delete a track from Firebase Realtime Database
 */
export async function deleteTrackFromFirebase(trackId: string): Promise<boolean> {
  if (!isFirebaseAvailable || !db || !trackId) return false;
  try {
    const safeKey = toSafeKey(trackId);
    const trackRef = ref(db, `hecos_youtube_tracks/${safeKey}`);
    await withTimeout(remove(trackRef), 15000);
    return true;
  } catch (err: any) {
    if (!isPermissionDeniedError(err)) {
      console.warn("Delete track from Firebase notice:", err?.message || err);
    }
    return false;
  }
}

/**
 * Sync Google Drive resources to Firebase Realtime Database
 */
export async function syncDriveResourcesToFirebase(resources: any[]): Promise<boolean> {
  if (!isFirebaseAvailable || !db || !Array.isArray(resources)) return false;
  try {
    const driveRef = ref(db, 'hecos_drive_resources');
    const batch: Record<string, any> = {};
    resources.forEach((r) => {
      if (r && r.id) {
        batch[toSafeKey(r.id)] = cleanForFirebase(r);
      }
    });
    await withTimeout(set(driveRef, batch), 15000);
    return true;
  } catch (err: any) {
    if (!isPermissionDeniedError(err)) {
      console.warn("Sync drive resources to Firebase notice:", err?.message || err);
    }
    return false;
  }
}

/**
 * Load Google Drive resources from Firebase Realtime Database
 */
export async function loadDriveResourcesFromFirebase(): Promise<any[] | null> {
  if (!isFirebaseAvailable || !db) return null;
  try {
    const driveRef = ref(db, 'hecos_drive_resources');
    const snap = await withTimeout(get(driveRef), 15000);
    if (!snap.exists()) return null;
    const val = snap.val();
    const list: any[] = [];
    if (Array.isArray(val)) {
      val.forEach(r => { if (r && r.id) list.push(r); });
    } else if (typeof val === 'object') {
      Object.values(val).forEach((r: any) => { if (r && r.id) list.push(r); });
    }
    return list.length > 0 ? list : null;
  } catch {
    return null;
  }
}

/**
 * Subscribe to Google Drive resources in Realtime
 */
export function subscribeToDriveResourcesRealtime(callback: (resources: any[]) => void): Unsubscribe {
  if (!isFirebaseAvailable || !db) return () => {};
  try {
    const driveRef = ref(db, 'hecos_drive_resources');
    return onValue(driveRef, (snap) => {
      if (!snap.exists()) return;
      const val = snap.val();
      const list: any[] = [];
      if (Array.isArray(val)) {
        val.forEach(r => { if (r && r.id) list.push(r); });
      } else if (typeof val === 'object') {
        Object.values(val).forEach((r: any) => { if (r && r.id) list.push(r); });
      }
      if (list.length > 0) {
        callback(list);
      }
    }, (error) => {
      if (!isPermissionDeniedError(error)) {
        console.warn("Real-time drive resources error:", error);
      }
    });
  } catch {
    return () => {};
  }
}

/**
 * Delete a Google Drive resource from Firebase Realtime Database
 */
export async function deleteDriveResourceFromFirebase(resourceId: string): Promise<boolean> {
  if (!isFirebaseAvailable || !db || !resourceId) return false;
  try {
    const safeKey = toSafeKey(resourceId);
    const resourceRef = ref(db, `hecos_drive_resources/${safeKey}`);
    await withTimeout(remove(resourceRef), 15000);
    return true;
  } catch (err: any) {
    if (!isPermissionDeniedError(err)) {
      console.warn("Delete drive resource notice:", err?.message || err);
    }
    return false;
  }
}

/**
 * Delete a user from Firebase Realtime Database
 */
export async function deleteUserFromFirebase(userId: string): Promise<boolean> {
  if (!isFirebaseAvailable || !db || !userId) return false;
  try {
    const safeKey = toSafeKey(userId);
    const userRef = ref(db, `hecos_users/${safeKey}`);
    await withTimeout(remove(userRef), 15000);
    return true;
  } catch (err: any) {
    if (!isPermissionDeniedError(err)) {
      console.warn("Delete user notice:", err?.message || err);
    }
    return false;
  }
}

/**
 * Sync Users to Firebase Realtime Database
 */
export async function syncUsersToFirebase(users: any[]): Promise<boolean> {
  if (!isFirebaseAvailable || !db) return false;
  try {
    const usersRef = ref(db, 'hecos_users');
    const batch: Record<string, any> = {};
    users.forEach((u) => {
      if (u && u.id) {
        batch[toSafeKey(u.id)] = cleanForFirebase(u);
      }
    });
    await withTimeout(set(usersRef, batch), 15000);
    return true;
  } catch (err: any) {
    if (!isPermissionDeniedError(err)) {
      console.warn("Sync users notice:", err?.message || err);
    }
    return false;
  }
}

/**
 * Load Users from Firebase
 */
export async function loadUsersFromFirebase(): Promise<any[] | null> {
  if (!isFirebaseAvailable || !db) return null;
  try {
    const usersRef = ref(db, 'hecos_users');
    const snap = await withTimeout(get(usersRef), 15000);
    if (!snap.exists()) return null;
    const val = snap.val();
    const list: any[] = [];
    if (Array.isArray(val)) {
      val.forEach(u => { if (u && u.id) list.push(u); });
    } else if (typeof val === 'object') {
      Object.values(val).forEach((u: any) => { if (u && u.id) list.push(u); });
    }
    return list.length > 0 ? list : null;
  } catch {
    return null;
  }
}

/**
 * Subscribe to Users in Realtime (Corrigido unsubscribe do SDK v9/v10)
 */
export function subscribeToUsersRealtime(callback: (users: any[]) => void): Unsubscribe {
  if (!isFirebaseAvailable || !db) return () => {};
  try {
    const usersRef = ref(db, 'hecos_users');
    return onValue(usersRef, (snap) => {
      if (!snap.exists()) return;
      const val = snap.val();
      const list: any[] = [];
      if (Array.isArray(val)) {
        val.forEach(u => { if (u && u.id) list.push(u); });
      } else if (typeof val === 'object') {
        Object.values(val).forEach((u: any) => { if (u && u.id) list.push(u); });
      }
      callback(list);
    }, (error) => {
      if (!isPermissionDeniedError(error)) {
        console.warn("Real-time users error:", error);
      }
    });
  } catch {
    return () => {};
  }
}

/**
 * Sync Folder Permissions to Firebase Realtime Database
 */
export async function syncFolderPermissionsToFirebase(permissions: Record<string, any>): Promise<boolean> {
  if (!isFirebaseAvailable || !db) return false;
  try {
    const permsRef = ref(db, 'hecos_folder_permissions');
    await withTimeout(set(permsRef, cleanForFirebase(permissions)), 15000);
    return true;
  } catch (err: any) {
    if (!isPermissionDeniedError(err)) {
      console.warn("Sync folder permissions notice:", err?.message || err);
    }
    return false;
  }
}

/**
 * Load Folder Permissions from Firebase
 */
export async function loadFolderPermissionsFromFirebase(): Promise<Record<string, any> | null> {
  if (!isFirebaseAvailable || !db) return null;
  try {
    const permsRef = ref(db, 'hecos_folder_permissions');
    const snap = await withTimeout(get(permsRef), 15000);
    if (!snap.exists()) return null;
    return snap.val();
  } catch {
    return null;
  }
}

/**
 * Subscribe to Folder Permissions in Realtime (Corrigido unsubscribe do SDK v9/v10)
 */
export function subscribeToFolderPermissionsRealtime(callback: (perms: Record<string, any>) => void): Unsubscribe {
  if (!isFirebaseAvailable || !db) return () => {};
  try {
    const permsRef = ref(db, 'hecos_folder_permissions');
    return onValue(permsRef, (snap) => {
      if (!snap.exists()) return;
      callback(snap.val() || {});
    }, (error) => {
      if (!isPermissionDeniedError(error)) {
        console.warn("Real-time folder permissions error:", error);
      }
    });
  } catch {
    return () => {};
  }
}

/**
 * Sync Image Adjustments to Firebase Realtime Database
 */
export async function syncImageAdjustmentsToFirebase(adjustments: Record<string, any>): Promise<boolean> {
  if (!isFirebaseAvailable || !db) return false;
  try {
    const adjRef = ref(db, 'hecos_image_adjustments');
    const safeObj: Record<string, any> = {};
    for (const [key, val] of Object.entries(adjustments)) {
      safeObj[toSafeKey(key)] = cleanForFirebase({ key, ...val });
    }
    await withTimeout(set(adjRef, safeObj), 15000);
    return true;
  } catch (err: any) {
    if (!isPermissionDeniedError(err)) {
      console.warn("Sync image adjustments notice:", err?.message || err);
    }
    return false;
  }
}

/**
 * Load Image Adjustments from Firebase
 */
export async function loadImageAdjustmentsFromFirebase(): Promise<Record<string, any> | null> {
  if (!isFirebaseAvailable || !db) return null;
  try {
    const adjRef = ref(db, 'hecos_image_adjustments');
    const snap = await withTimeout(get(adjRef), 15000);
    if (!snap.exists()) return null;
    const raw = snap.val();
    const result: Record<string, any> = {};
    for (const item of Object.values(raw || {})) {
      if (item && typeof item === 'object' && (item as any).key) {
        const { key, ...rest } = item as any;
        result[key] = rest;
      }
    }
    return result;
  } catch {
    return null;
  }
}

/**
 * Subscribe to Image Adjustments in Realtime
 */
export function subscribeToImageAdjustmentsRealtime(callback: (adjustments: Record<string, any>) => void): Unsubscribe {
  if (!isFirebaseAvailable || !db) return () => {};
  try {
    const adjRef = ref(db, 'hecos_image_adjustments');
    return onValue(adjRef, (snap) => {
      if (!snap.exists()) return;
      const raw = snap.val() || {};
      const result: Record<string, any> = {};
      for (const item of Object.values(raw)) {
        if (item && typeof item === 'object' && (item as any).key) {
          const { key, ...rest } = item as any;
          result[key] = rest;
        }
      }
      callback(result);
    }, (error) => {
      if (!isPermissionDeniedError(error)) {
        console.warn("Real-time image adjustments error:", error);
      }
    });
  } catch {
    return () => {};
  }
}

/**
 * Sync Custom Traits to Firebase Realtime Database
 */
export async function syncCustomTraitsToFirebase(traits: Record<string, any>): Promise<boolean> {
  if (!isFirebaseAvailable || !db) return false;
  try {
    const traitsRef = ref(db, 'hecos_custom_traits');
    const safeObj: Record<string, any> = {};
    for (const [key, val] of Object.entries(traits)) {
      safeObj[toSafeKey(key)] = cleanForFirebase({ key, ...val });
    }
    await withTimeout(set(traitsRef, safeObj), 15000);
    return true;
  } catch (err: any) {
    if (!isPermissionDeniedError(err)) {
      console.warn("Sync custom traits notice:", err?.message || err);
    }
    return false;
  }
}

/**
 * Load Custom Traits from Firebase
 */
export async function loadCustomTraitsFromFirebase(): Promise<Record<string, any> | null> {
  if (!isFirebaseAvailable || !db) return null;
  try {
    const traitsRef = ref(db, 'hecos_custom_traits');
    const snap = await withTimeout(get(traitsRef), 15000);
    if (!snap.exists()) return null;
    const raw = snap.val();
    const result: Record<string, any> = {};
    for (const item of Object.values(raw || {})) {
      if (item && typeof item === 'object' && (item as any).key) {
        const { key, ...rest } = item as any;
        result[key] = rest;
      }
    }
    return result;
  } catch {
    return null;
  }
}

/**
 * Subscribe to Custom Traits in Realtime
 */
export function subscribeToCustomTraitsRealtime(callback: (traits: Record<string, any>) => void): Unsubscribe {
  if (!isFirebaseAvailable || !db) return () => {};
  try {
    const traitsRef = ref(db, 'hecos_custom_traits');
    return onValue(traitsRef, (snap) => {
      if (!snap.exists()) return;
      const raw = snap.val() || {};
      const result: Record<string, any> = {};
      for (const item of Object.values(raw)) {
        if (item && typeof item === 'object' && (item as any).key) {
          const { key, ...rest } = item as any;
          result[key] = rest;
        }
      }
      callback(result);
    }, (error) => {
      if (!isPermissionDeniedError(error)) {
        console.warn("Real-time custom traits error:", error);
      }
    });
  } catch {
    return () => {};
  }
}

/**
 * Sync Custom Tags to Firebase Realtime Database
 */
export async function syncCustomTagsToFirebase(tags: Record<string, any>): Promise<boolean> {
  if (!isFirebaseAvailable || !db) return false;
  try {
    const tagsRef = ref(db, 'hecos_custom_tags');
    const safeObj: Record<string, any> = {};
    for (const [key, val] of Object.entries(tags)) {
      safeObj[toSafeKey(key)] = cleanForFirebase({ key, ...val });
    }
    await withTimeout(set(tagsRef, safeObj), 15000);
    return true;
  } catch (err: any) {
    if (!isPermissionDeniedError(err)) {
      console.warn("Sync custom tags notice:", err?.message || err);
    }
    return false;
  }
}

/**
 * Load Custom Tags from Firebase
 */
export async function loadCustomTagsFromFirebase(): Promise<Record<string, any> | null> {
  if (!isFirebaseAvailable || !db) return null;
  try {
    const tagsRef = ref(db, 'hecos_custom_tags');
    const snap = await withTimeout(get(tagsRef), 15000);
    if (!snap.exists()) return null;
    const raw = snap.val();
    const result: Record<string, any> = {};
    for (const item of Object.values(raw || {})) {
      if (item && typeof item === 'object' && (item as any).key) {
        const { key, ...rest } = item as any;
        result[key] = rest;
      }
    }
    return result;
  } catch {
    return null;
  }
}

/**
 * Subscribe to Custom Tags in Realtime
 */
export function subscribeToCustomTagsRealtime(callback: (tags: Record<string, any>) => void): Unsubscribe {
  if (!isFirebaseAvailable || !db) return () => {};
  try {
    const tagsRef = ref(db, 'hecos_custom_tags');
    return onValue(tagsRef, (snap) => {
      if (!snap.exists()) return;
      const raw = snap.val() || {};
      const result: Record<string, any> = {};
      for (const item of Object.values(raw)) {
        if (item && typeof item === 'object' && (item as any).key) {
          const { key, ...rest } = item as any;
          result[key] = rest;
        }
      }
      callback(result);
    }, (error) => {
      if (!isPermissionDeniedError(error)) {
        console.warn("Real-time custom tags error:", error);
      }
    });
  } catch {
    return () => {};
  }
}

/**
 * Seed initial database if completely empty
 */
export async function seedDatabaseIfEmpty(
  initialEntities: any[],
  initialMaps?: any[],
  initialTracks?: any[],
  initialDriveResources?: any[]
): Promise<boolean> {
  if (!isFirebaseAvailable || !db) return false;
  try {
    const entitiesRef = ref(db, 'hecos_entities');
    const snap = await withTimeout(get(entitiesRef), 15000);
    if (!snap.exists() || !snap.val() || Object.keys(snap.val()).length === 0) {
      console.info("Firebase Realtime Database is empty. Seeding initial world data...");
      const batchObj: Record<string, any> = {};
      initialEntities.forEach((ent) => {
        const safeKey = toSafeKey(ent.id);
        batchObj[safeKey] = cleanForFirebase(ent);
      });
      await set(entitiesRef, batchObj);
    }
    if (initialMaps && initialMaps.length > 0) {
      const mapsRef = ref(db, 'hecos_maps');
      const mapsSnap = await withTimeout(get(mapsRef), 10000).catch(() => null);
      if (!mapsSnap || !mapsSnap.exists() || Object.keys(mapsSnap.val() || {}).length === 0) {
        const mapsBatch: Record<string, any> = {};
        initialMaps.forEach((m) => {
          if (m && m.id) mapsBatch[toSafeKey(m.id)] = cleanForFirebase(m);
        });
        await set(mapsRef, mapsBatch).catch(() => {});
      }
    }
    if (initialTracks && initialTracks.length > 0) {
      const tracksRef = ref(db, 'hecos_youtube_tracks');
      const tracksSnap = await withTimeout(get(tracksRef), 10000).catch(() => null);
      if (!tracksSnap || !tracksSnap.exists() || Object.keys(tracksSnap.val() || {}).length === 0) {
        const tracksBatch: Record<string, any> = {};
        initialTracks.forEach((t) => {
          if (t && t.id) tracksBatch[toSafeKey(t.id)] = cleanForFirebase(t);
        });
        await set(tracksRef, tracksBatch).catch(() => {});
      }
    }
    if (initialDriveResources && initialDriveResources.length > 0) {
      const driveRef = ref(db, 'hecos_drive_resources');
      const driveSnap = await withTimeout(get(driveRef), 10000).catch(() => null);
      if (!driveSnap || !driveSnap.exists() || Object.keys(driveSnap.val() || {}).length === 0) {
        const driveBatch: Record<string, any> = {};
        initialDriveResources.forEach((r) => {
          if (r && r.id) driveBatch[toSafeKey(r.id)] = cleanForFirebase(r);
        });
        await set(driveRef, driveBatch).catch(() => {});
      }
    }
    return true;
  } catch (e) {
    console.warn("Could not seed RTDB:", e);
    return false;
  }
}

/**
 * Diagnostic helper to test read and write permissions against current security rules
 */
export async function testRealtimeDatabasePermissions(): Promise<{
  readOk: boolean;
  writeOk: boolean;
  latencyMs: number;
  authUid: string | null;
  message: string;
}> {
  if (!isFirebaseAvailable || !db) {
    return {
      readOk: false,
      writeOk: false,
      latencyMs: 0,
      authUid: null,
      message: 'Firebase Database não está inicializado no momento.'
    };
  }

  const startTime = performance.now();
  let readOk = false;
  let writeOk = false;

  try {
    // 1. Test Read
    const entitiesRef = ref(db, 'hecos_entities');
    await withTimeout(get(entitiesRef), 10000);
    readOk = true;

    // 2. Test Write on test path
    const testKey = `test_perm_${Date.now()}`;
    const testRef = ref(db, `hecos_custom_tags/${testKey}`);
    await withTimeout(set(testRef, { key: testKey, label: 'Teste de Permissão', test: true, timestamp: Date.now() }), 10000);
    writeOk = true;

    // Clean up test entry
    await remove(testRef).catch(() => {});

    const latency = Math.round(performance.now() - startTime);

    return {
      readOk: true,
      writeOk: true,
      latencyMs: latency,
      authUid: connectionState.authUid,
      message: 'Acesso de Leitura e Gravação 100% autorizado pelas Regras do Firebase!'
    };
  } catch (err: any) {
    const latency = Math.round(performance.now() - startTime);
    return {
      readOk,
      writeOk,
      latencyMs: latency,
      authUid: connectionState.authUid,
      message: err?.message || 'Erro ao validar regras de segurança.'
    };
  }
}

