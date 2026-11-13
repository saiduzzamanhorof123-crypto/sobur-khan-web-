import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  auth,
  firebaseConfig,
  googleProvider,
  testFirestoreConnection,
} from '../firebase';
import { registerAdminRecordInFirestore } from '../services/firestoreSync';

const OWNER_EMAILS = ['gpthorof@gmail.com', 'sobur@owner.com'];

interface FirebaseContextType {
  firebaseUser: FirebaseUser | null;
  firebaseReady: boolean;
  firestoreConnected: boolean;
  isFirebaseOwner: boolean;
  projectId: string;
  firestoreDatabaseId: string;
  signInWithGoogle: () => Promise<{ user: FirebaseUser; idToken: string }>;
  signOutFirebase: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [firestoreConnected, setFirestoreConnected] = useState(false);

  useEffect(() => {
    let active = true;
    testFirestoreConnection().then((ok) => {
      if (active) setFirestoreConnected(ok);
    });

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!active) return;
      setFirebaseUser(user);
      setFirebaseReady(true);

      if (
        user &&
        user.emailVerified &&
        user.email &&
        OWNER_EMAILS.includes(user.email.toLowerCase())
      ) {
        try {
          await registerAdminRecordInFirestore(user.uid, user.email);
        } catch {
          // Non-fatal on auth listener boot
        }
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, []);

  const isFirebaseOwner =
    !!firebaseUser &&
    firebaseUser.emailVerified &&
    !!firebaseUser.email &&
    OWNER_EMAILS.includes(firebaseUser.email.toLowerCase());

  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();
    if (
      result.user.emailVerified &&
      result.user.email &&
      OWNER_EMAILS.includes(result.user.email.toLowerCase())
    ) {
      await registerAdminRecordInFirestore(result.user.uid, result.user.email).catch(() => {});
    }
    return { user: result.user, idToken };
  };

  const signOutFirebase = async () => {
    await signOut(auth);
  };

  return (
    <FirebaseContext.Provider
      value={{
        firebaseUser,
        firebaseReady,
        firestoreConnected,
        isFirebaseOwner,
        projectId: firebaseConfig.projectId,
        firestoreDatabaseId: firebaseConfig.firestoreDatabaseId,
        signInWithGoogle,
        signOutFirebase,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseContextType => {
  const ctx = useContext(FirebaseContext);
  if (!ctx) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return ctx;
};
