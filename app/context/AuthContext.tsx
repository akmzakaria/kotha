"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "@/lib/firebase";
import { createOrUpdateUserProfile, updateUserStatus } from "@/lib/chatService";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Create or update user profile in database when user signs in
        try {
          await createOrUpdateUserProfile(currentUser);
        } catch (error) {
          console.error("Error creating/updating user profile:", error);
        }
      } else if (user) {
        // User signed out - update status to offline
        try {
          await updateUserStatus(user.uid, "offline");
        } catch (error) {
          console.error("Error updating user status to offline:", error);
        }
      }
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      // User profile will be created by the onAuthStateChanged listener
      console.log("User signed in:", result.user.displayName);
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  };

  const logout = async () => {
    if (user) {
      try {
        await updateUserStatus(user.uid, "offline");
      } catch (error) {
        console.error("Error updating user status to offline:", error);
      }
    }

    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
