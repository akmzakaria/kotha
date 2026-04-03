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
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from "@/lib/firebase";
import { createOrUpdateUserProfile, updateUserStatus } from "@/lib/chatService";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
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
          await updateUserStatus(currentUser.uid, "online");
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

  // Handle page visibility for online status
  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        await updateUserStatus(user.uid, "away");
      } else {
        await updateUserStatus(user.uid, "online");
      }
    };

    const handleBeforeUnload = async () => {
      await updateUserStatus(user.uid, "offline");
    };

    const handleUnload = () => {
      // Use sendBeacon for reliable offline status on page close
      const data = JSON.stringify({ status: "offline" });
      navigator.sendBeacon(`/api/users/${user.uid}`, data);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("unload", handleUnload);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("unload", handleUnload);
    };
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

  const signUpWithEmail = async (email: string, password: string, displayName: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName });
      await sendEmailVerification(result.user);
      // Sign out immediately after signup - user must verify email first
      await signOut(auth);
    } catch (error: any) {
      console.error("Sign up error:", error);
      throw new Error(error.code === "auth/email-already-in-use" ? "Email already in use" : "Sign up failed");
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      if (!result.user.emailVerified) {
        await signOut(auth);
        throw new Error("Please verify your email before signing in. Check your inbox or spam folder.");
      }
    } catch (error: any) {
      console.error("Sign in error:", error);
      if (error.message.includes("verify your email")) throw error;
      throw new Error(error.code === "auth/invalid-credential" ? "Invalid email or password" : "Sign in failed");
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
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, logout }}>
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
