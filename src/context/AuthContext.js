import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { onAuthChanged } from '../services/auth.service';
import * as authService from '../services/auth.service';
import { initializeAppForUser } from '../services/user.bootstrap.service';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastUserIdRef = useRef(null);

  const userId = user?.uid || null;
  const isAuthenticated = !!user;

  useEffect(() => {
    const unsubscribe = onAuthChanged((firebaseUser) => {
      setUser(firebaseUser);
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (user && user.uid !== lastUserIdRef.current) {
      lastUserIdRef.current = user.uid;
      initializeAppForUser(user.uid, user.email);
    }
    if (!user) {
      lastUserIdRef.current = null;
    }
  }, [user]);

  const login = useCallback(async (email, password) => {
    const result = await authService.login(email, password);
    return result;
  }, []);

  const register = useCallback(async (email, password) => {
    const result = await authService.registerUser(email, password);
    return result;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    await authService.changePassword(currentPassword, newPassword);
  }, []);

  const resetPassword = useCallback(async (email) => {
    await authService.resetPassword(email);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        userId,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        resetPassword,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
