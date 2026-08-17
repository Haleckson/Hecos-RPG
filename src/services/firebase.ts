import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
  onSnapshot,
  setLogLevel,
  Unsubscribe
} from 'firebase/firestore';

// User provided Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyAD8GaAn6EYNOzrMiGNiDG_MHfzsWx1QJE",
  authDomain: "hecosrpg-fba20.firebaseapp.com",
  databaseURL: "https://hecosrpg-fba20-default-rtdb.firebaseio.com",
  projectId: "hecosrpg-fba20",
  storageBucket: "hecosrpg-fba20.firebasestorage.app",
  messagingSenderId: "989906881758",
  appId: "1:989906881758:web:f51322a331ecdeb1dc464f",
  measurementId: "G-60XJCQ66PF"
};

let app: any = null;
let db: any = null;
let isFirebaseAvailable = false;

export type FirebaseConnectionStatus = 'connected' | 'connecting' | 'offline' | 'error';

interface ConnectionState {
  status: FirebaseConnectionStatus;
  isRealtimeActive: boolean;
  lastSyncedAt: string | null;
  lastError: string | null;
}

const connectionState: ConnectionState = {
  status: 'connecting',
  isRealtimeActive: false,
  lastSyncedAt: null,
  lastError: null
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

// Silence harmless backend unreachable info logs in offline/sandboxed mode
try {
  setLogLevel('error');
} catch {
  // ignore
}

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  // Use initializeFirestore with auto-detect long polling and ignoreUndefinedProperties
  try {
    db = initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
      ignoreUndefinedProperties: true
    });
  } catch {
    db = getFirestore(app);
  }

  isFirebaseAvailable = true;
  updateConnectionState({ status: 'connected', lastError: null });
} catch (error: any) {
  console.warn("Firebase initialization running in local-first mode:", error);
  isFirebaseAvailable = false;
  updateConnectionState({ status: 'offline', lastError: error?.message || 'Initialization failed' });
}

export { app, db, isFirebaseAvailable };

/**
 * Helper to race a promise against a timeout gracefully
 */
function withTimeout<T>(promise: Promise<T>, ms: number = 12000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Firebase operation timed out after ${ms}ms`)), ms)
    )
  ]);
}

/**
 * Real-time listener for 'hecos_entities' collection
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
    const colRef = collection(db, 'hecos_entities');
    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data());
        });
        updateConnectionState({
          status: 'connected',
          isRealtimeActive: true,
          lastSyncedAt: new Date().toISOString(),
          lastError: null
        });
        onUpdate(list);
      },
      (error) => {
        console.warn("Real-time listener error for hecos_entities:", error);
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
    console.warn("Failed to subscribe to realtime entities:", err);
    updateConnectionState({ isRealtimeActive: false, lastError: err?.message || 'Subscription failed' });
    return null;
  }
}

/**
 * Real-time listener for 'hecos_maps' collection
 */
export function subscribeToMapsRealtime(
  onUpdate: (maps: any[]) => void
): Unsubscribe | null {
  if (!isFirebaseAvailable || !db) return null;

  try {
    const colRef = collection(db, 'hecos_maps');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data());
        });
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
 * Saves or updates an entity to Firebase Firestore (collection 'hecos_entities')
 */
export async function syncEntityToFirebase(entity: any): Promise<boolean> {
  if (!isFirebaseAvailable || !db) return false;
  try {
    const entityRef = doc(db, 'hecos_entities', entity.id);
    await withTimeout(
      setDoc(entityRef, {
        ...entity,
        _syncedAt: new Date().toISOString()
      }, { merge: true }),
      15000
    );
    updateConnectionState({
      status: 'connected',
      lastSyncedAt: new Date().toISOString(),
      lastError: null
    });
    return true;
  } catch (err: any) {
    // If it's a network timeout, Firestore offline queue will still persist and sync later
    const isTimeout = err?.message?.includes('timed out');
    if (!isTimeout) {
      console.warn("Sync entity to Firebase info:", err?.message || err);
    }
    updateConnectionState({
      lastError: isTimeout ? 'Sincronização em segundo plano' : (err?.message || 'Sync failed')
    });
    return false;
  }
}

/**
 * Deletes an entity from Firebase Firestore
 */
export async function deleteEntityFromFirebase(entityId: string): Promise<boolean> {
  if (!isFirebaseAvailable || !db) return false;
  try {
    const entityRef = doc(db, 'hecos_entities', entityId);
    await withTimeout(deleteDoc(entityRef), 15000);
    updateConnectionState({
      status: 'connected',
      lastSyncedAt: new Date().toISOString()
    });
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Loads all entities from Firebase Firestore with a graceful timeout
 */
export async function loadEntitiesFromFirebase(): Promise<any[] | null> {
  if (!isFirebaseAvailable || !db) return null;
  try {
    const querySnapshot = await withTimeout(
      getDocs(collection(db, 'hecos_entities')),
      10000
    );
    const list: any[] = [];
    querySnapshot.forEach((docSnap) => {
      list.push(docSnap.data());
    });
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
    const isTimeout = err?.message?.includes('timed out');
    if (!isTimeout) {
      console.warn("Load entities from Firebase info:", err?.message || err);
    }
    updateConnectionState({
      lastError: isTimeout ? 'Usando dados locais (offline)' : (err?.message || 'Failed to load entities')
    });
    return null;
  }
}

/**
 * Save map to Firebase
 */
export async function syncMapToFirebase(mapData: any): Promise<boolean> {
  if (!isFirebaseAvailable || !db) return false;
  try {
    const mapRef = doc(db, 'hecos_maps', mapData.id);
    await withTimeout(setDoc(mapRef, mapData, { merge: true }), 4000);
    return true;
  } catch {
    return false;
  }
}

/**
 * Load maps from Firebase
 */
export async function loadMapsFromFirebase(): Promise<any[] | null> {
  if (!isFirebaseAvailable || !db) return null;
  try {
    const snap = await withTimeout(getDocs(collection(db, 'hecos_maps')), 4000);
    const list: any[] = [];
    snap.forEach(d => list.push(d.data()));
    return list.length > 0 ? list : null;
  } catch {
    return null;
  }
}



