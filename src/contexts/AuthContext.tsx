import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db, app } from '../firebase'; // Import the Firebase app instance (app) and Firestore instance (db)
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile // Import updateProfile to update display name directly
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"; // Import Firestore functions

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'therapist' | 'admin';
  avatar?: string; // This will now typically come from photoURL
  profession?: string;
  dateOfBirth?: string;
  photoURL?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  register: (name: string, email: string, password: string, profession: string, dateOfBirth: string) => Promise<boolean>;
  logout: () => void;
  updateUserProfile: (profileUpdates: Partial<User>) => Promise<boolean>; // New function to update user profile
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userRef);

        let userData: Partial<User> = {};
        if (userDoc.exists()) {
          userData = userDoc.data() as User;
        } else {
          // Create a new profile if it doesn't exist
          userData = {
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'New User',
            email: firebaseUser.email || '',
            profession: '',
            dateOfBirth: '',
            photoURL: firebaseUser.photoURL || null,
            role: 'user', // Default role
          };
          await setDoc(userRef, userData, { merge: true });
        }

        const idTokenResult = await firebaseUser.getIdTokenResult();
        const userRole = (idTokenResult.claims.role || userData.role || 'user') as 'user' | 'therapist' | 'admin';

        setUser({
          id: firebaseUser.uid,
          name: userData.name || firebaseUser.displayName || firebaseUser.email || 'User',
          email: userData.email || firebaseUser.email || '',
          role: userRole,
          avatar: userData.photoURL || firebaseUser.photoURL || null, // Prioritize Firestore photoURL
          profession: userData.profession || '',
          dateOfBirth: userData.dateOfBirth || '',
          photoURL: userData.photoURL || firebaseUser.photoURL || null,
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // Profile creation/fetching logic is now handled in onAuthStateChanged
      return true;
    } catch (error) {
      console.error("Google login failed:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, profession: string, dateOfBirth: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      await updateProfile(firebaseUser, { displayName: name });
      
      // Create user profile in Firestore
      const userRef = doc(db, "users", firebaseUser.uid);
      const userProfile: Partial<User> = {
        name: name,
        email: email,
        profession: profession,
        dateOfBirth: dateOfBirth,
        photoURL: null, // No photo on initial registration, use null
        role: 'user',
      };
      await setDoc(userRef, userProfile, { merge: true });

      // Force re-fetch user data to include new profile fields
      await firebaseUser.reload();
      // onAuthStateChanged will be triggered, setting the full user object

      return true;
    } catch (error) {
      console.error("Registration failed:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (profileUpdates: Partial<User>): Promise<boolean> => {
    if (!user || !auth.currentUser) {
      console.error("No user logged in to update profile.");
      return false;
    }

    setIsLoading(true);
    try {
      const userRef = doc(db, "users", user.id);
      
      // Filter out undefined values before sending to Firestore
      const filteredProfileUpdates = Object.fromEntries(
        Object.entries(profileUpdates).filter(([, value]) => value !== undefined)
      );
      await updateDoc(userRef, filteredProfileUpdates);

      // Update the local user state
      setUser(prevUser => {
        if (!prevUser) return null;
        return { ...prevUser, ...profileUpdates };
      });

      // If display name or photoURL are updated, also update Firebase Auth profile
      if (profileUpdates.name || profileUpdates.photoURL) {
        await updateProfile(auth.currentUser, {
          displayName: profileUpdates.name || auth.currentUser.displayName, // Ensure a value is always passed
          photoURL: profileUpdates.photoURL || auth.currentUser.photoURL,   // Ensure a value is always passed
        });
      }

      return true;
    } catch (error) {
      console.error("Failed to update user profile:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      setUser(null); // Explicitly clear user on logout
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    login,
    loginWithGoogle,
    register,
    logout,
    updateUserProfile,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}