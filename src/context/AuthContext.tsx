import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { UserProfile, InteractionSignal } from '../types';
import { auth, db, isFirebaseConfigured, handleFirestoreError, OperationType } from '../services/firebase';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';

interface AuthContextType {
  currentUser: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  needsOnboarding: boolean;
  isAuthenticated: boolean;
  isFirebaseActive: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  completeOnboarding: (params: {
    username: string;
    displayName: string;
    bio?: string;
    avatarUrl?: string;
    interests?: string[];
    preferredSources?: ('news' | 'x' | 'instagram' | 'facebook')[];
  }) => Promise<void>;
  checkUsernameAvailable: (candidate: string) => Promise<{ available: boolean; reason?: string }>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
  searchRegisteredUsers: (search: string) => Promise<UserProfile[]>;
  recordSignal: (
    type: 'like' | 'comment' | 'bookmark' | 'pulse_click',
    targetId: string,
    tags?: string[]
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('fluid_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync current user to localStorage
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('fluid_auth_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('fluid_auth_user');
      }
    } catch {
      // ignore
    }
  }, [currentUser]);

  // Sync Firebase Auth state in real time
  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        if (db) {
          try {
            const userDocRef = doc(db, 'users', user.uid);
            const snap = await getDoc(userDocRef);

            if (snap.exists() && snap.data()?.username) {
              const data = snap.data() as UserProfile;
              setCurrentUser(data);
              setNeedsOnboarding(false);
            } else {
              // Real authenticated user, prompt for User ID handle and interests
              setCurrentUser(null);
              setNeedsOnboarding(true);
            }
          } catch (err) {
            console.warn('[Fluid Auth] Firestore check error:', err);
            const saved = localStorage.getItem('fluid_auth_user');
            if (saved) {
              const parsed = JSON.parse(saved);
              if (parsed.uid === user.uid && parsed.username) {
                setCurrentUser(parsed);
                setNeedsOnboarding(false);
                setIsLoading(false);
                return;
              }
            }
            setNeedsOnboarding(true);
          }
        } else {
          setNeedsOnboarding(true);
        }
      } else {
        setCurrentUser(null);
        setNeedsOnboarding(false);
        localStorage.removeItem('fluid_auth_user');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    if (!auth) {
      throw new Error('Firebase Auth is not available.');
    }
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithPopup(auth, provider);
  };

  const loginWithEmail = async (email: string, pass: string) => {
    if (!auth) {
      throw new Error('Firebase Auth is not available.');
    }
    await signInWithEmailAndPassword(auth, email.trim(), pass);
  };

  const signupWithEmail = async (email: string, pass: string, displayName: string) => {
    if (!auth) {
      throw new Error('Firebase Auth is not available.');
    }
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
    if (displayName && cred.user) {
      await updateProfile(cred.user, { displayName });
    }
  };

  const logout = async () => {
    if (auth) {
      await signOut(auth);
    }
    setCurrentUser(null);
    setFirebaseUser(null);
    setNeedsOnboarding(false);
    localStorage.removeItem('fluid_auth_user');
  };

  const checkUsernameAvailable = useCallback(
    async (rawCandidate: string): Promise<{ available: boolean; reason?: string }> => {
      const candidate = rawCandidate.trim().toLowerCase();

      if (!candidate) {
        return { available: false, reason: 'User ID cannot be empty' };
      }
      if (candidate.length < 3) {
        return { available: false, reason: 'Must be at least 3 characters' };
      }
      if (candidate.length > 20) {
        return { available: false, reason: 'Cannot exceed 20 characters' };
      }
      if (!/^[a-z0-9_.]+$/.test(candidate)) {
        return { available: false, reason: 'Only lowercase letters, numbers, underscores, and periods' };
      }
      if (candidate.startsWith('.') || candidate.endsWith('.')) {
        return { available: false, reason: 'Cannot start or end with a period' };
      }
      if (candidate.includes('..')) {
        return { available: false, reason: 'Cannot contain consecutive periods' };
      }

      const reserved = ['admin', 'root', 'fluid', 'echo', 'support', 'help', 'explore', 'api', 'system'];
      if (reserved.includes(candidate)) {
        return { available: false, reason: 'This User ID is reserved' };
      }

      if (db && auth?.currentUser) {
        try {
          const usersCol = collection(db, 'users');
          const q = query(usersCol, where('username', '==', candidate), limit(1));
          const snapshot = await getDocs(q);

          if (!snapshot.empty) {
            const foundDoc = snapshot.docs[0];
            if (foundDoc.id === auth.currentUser.uid) {
              return { available: true };
            }
            return { available: false, reason: 'User ID is already taken' };
          }
        } catch (err) {
          console.warn('[Fluid Auth] Error querying username availability in Firestore:', err);
        }
      }

      return { available: true };
    },
    []
  );

  const completeOnboarding = async (params: {
    username: string;
    displayName: string;
    bio?: string;
    avatarUrl?: string;
    interests?: string[];
    preferredSources?: ('news' | 'x' | 'instagram' | 'facebook')[];
  }) => {
    const activeFirebaseUser = auth?.currentUser || firebaseUser;
    if (!activeFirebaseUser) {
      throw new Error('No authenticated user found. Please authenticate first.');
    }

    const cleanUsername = params.username.trim().toLowerCase();
    const cleanDisplayName = params.displayName.trim() || cleanUsername;
    const cleanAvatar =
      params.avatarUrl ||
      activeFirebaseUser.photoURL ||
      `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80`;
    const cleanBio = params.bio?.trim() || 'Visual creator on Fluid · ECHO Intelligence';

    const newProfile: UserProfile = {
      uid: activeFirebaseUser.uid,
      username: cleanUsername,
      displayName: cleanDisplayName,
      avatarUrl: cleanAvatar,
      bio: cleanBio,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      isVerified: false,
      interests: params.interests || ['Technology', 'Design', 'Architecture'],
      preferredSources: params.preferredSources || ['news', 'x', 'instagram', 'facebook'],
      affinityScores: {},
      connectedAccounts: {
        x: { connected: false, handle: '' },
        instagram: { connected: false, handle: '' },
        facebook: { connected: false, handle: '' },
      },
      createdAt: new Date().toISOString(),
    };

    if (db) {
      try {
        const userDocRef = doc(db, 'users', activeFirebaseUser.uid);
        await setDoc(userDocRef, newProfile);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${activeFirebaseUser.uid}`);
      }
    }

    setCurrentUser(newProfile);
    setNeedsOnboarding(false);
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);

    if (db && auth?.currentUser) {
      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await setDoc(userRef, updates, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${auth.currentUser.uid}`);
      }
    }
  };

  // Interaction Telemetry: Record signal and update user's affinity scores
  const recordSignal = async (
    type: 'like' | 'comment' | 'bookmark' | 'pulse_click',
    targetId: string,
    tags: string[] = []
  ) => {
    if (!currentUser || !auth?.currentUser) return;

    const weights: Record<string, number> = {
      like: 5,
      comment: 8,
      bookmark: 10,
      pulse_click: 3,
    };
    const weight = weights[type] || 3;

    // Calculate updated affinityScores map
    const existingScores = { ...(currentUser.affinityScores || {}) };
    tags.forEach((tag) => {
      const cleanTag = tag.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (cleanTag) {
        existingScores[cleanTag] = (existingScores[cleanTag] || 0) + weight;
      }
    });

    // Optimistically update local profile
    const updatedUser: UserProfile = {
      ...currentUser,
      affinityScores: existingScores,
    };
    setCurrentUser(updatedUser);

    if (db && auth?.currentUser) {
      try {
        const signalDocId = `sig_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const signalRef = doc(db, 'users', auth.currentUser.uid, 'signals', signalDocId);
        const signalData: InteractionSignal = {
          id: signalDocId,
          userId: auth.currentUser.uid,
          type,
          targetId,
          tags,
          weight,
          createdAt: new Date().toISOString(),
        };

        // Write signal record
        setDoc(signalRef, signalData).catch((err) => {
          console.warn('Telemetry signal write error:', err);
        });

        // Update user's affinity scores in profile document
        const userRef = doc(db, 'users', auth.currentUser.uid);
        setDoc(userRef, { affinityScores: existingScores }, { merge: true }).catch((err) => {
          console.warn('User affinityScores update error:', err);
        });
      } catch (err) {
        console.warn('Interaction signal dispatch error:', err);
      }
    }
  };

  const searchRegisteredUsers = async (search: string): Promise<UserProfile[]> => {
    if (!db || !auth?.currentUser || !search.trim()) return [];
    try {
      const currentUid = auth.currentUser.uid;
      const usersCol = collection(db, 'users');
      const q = query(usersCol, limit(30));
      const snapshot = await getDocs(q);
      const term = search.toLowerCase().trim();
      const results: UserProfile[] = [];

      snapshot.forEach((docSnap) => {
        const user = docSnap.data() as UserProfile;
        if (
          user.uid !== currentUid &&
          (user.username.toLowerCase().includes(term) ||
            user.displayName.toLowerCase().includes(term) ||
            (user.interests && user.interests.some((i) => i.toLowerCase().includes(term))))
        ) {
          results.push(user);
        }
      });
      return results;
    } catch (err) {
      console.warn('Error searching registered users in Firestore:', err);
      return [];
    }
  };

  const value = useMemo(
    () => ({
      currentUser,
      firebaseUser,
      isLoading,
      needsOnboarding,
      isAuthenticated: !!currentUser,
      isFirebaseActive: isFirebaseConfigured,
      loginWithGoogle,
      loginWithEmail,
      signupWithEmail,
      logout,
      completeOnboarding,
      checkUsernameAvailable,
      updateUserProfile,
      searchRegisteredUsers,
      recordSignal,
    }),
    [
      currentUser,
      firebaseUser,
      isLoading,
      needsOnboarding,
      isFirebaseConfigured,
      loginWithGoogle,
      loginWithEmail,
      signupWithEmail,
      logout,
      completeOnboarding,
      checkUsernameAvailable,
      updateUserProfile,
      searchRegisteredUsers,
      recordSignal,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
