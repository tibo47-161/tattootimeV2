import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../services/firebase';
import { User as FirebaseUser, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { User } from '../types/index';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user: FirebaseUser | null) => {
      if (user) {
        try {
          const idTokenResult = await user.getIdTokenResult(true); // Force refresh to get latest claims
          setCurrentUser({
            id: user.uid,
            email: user.email || '',
            role: (idTokenResult.claims.admin ? 'admin' : 'user'),
            name: user.displayName || '',
          });
        } catch (error) {
          console.error("Error fetching user ID token result:", error);
          setCurrentUser({
            id: user.uid,
            email: user.email || '',
            role: 'user', // Fallback to user role on error
            name: user.displayName || '',
          });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    currentUser,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 