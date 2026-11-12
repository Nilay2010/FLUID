import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;
let firebaseAuth: Auth | null = null;
let isFirebaseConfigured = false;

// Check if valid Firebase credentials are provided
if (
  firebaseConfig &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== 'remixed-project-id' &&
  firebaseConfig.apiKey
) {
  try {
    firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
    try {
      firestoreDb = initializeFirestore(
        firebaseApp,
        {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
          }),
        },
        dbId
      );
    } catch {
      firestoreDb = getFirestore(firebaseApp, dbId);
    }
    firebaseAuth = getAuth(firebaseApp);
    isFirebaseConfigured = true;
    console.log('[Fluid] Firebase initialized with project:', firebaseConfig.projectId);
  } catch (err) {
    console.warn('[Fluid] Firebase init warning:', err);
    isFirebaseConfigured = false;
  }
} else {
  isFirebaseConfigured = false;
  console.log('[Fluid] Firebase not yet configured. Running in interactive sandbox mode with full mock persistence.');
}

export const app = firebaseApp;
export const db = firestoreDb;
export const auth = firebaseAuth;
export { isFirebaseConfigured };

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
