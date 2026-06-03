import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { checkAuth, verifyToken, logout as logoutService, AuthState } from '../services/authService';

interface AuthContextValue {
  isAuthenticated: boolean;
  isDemo: boolean;
  email: string | null;
  loading: boolean;
  enterDemo: () => void;
  exitDemo: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  isDemo: false,
  email: null,
  loading: true,
  enterDemo: () => {},
  exitDemo: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({ isAuthenticated: false, email: null, loading: true });
  const [isDemo, setIsDemo] = useState(false);

  // Check for magic link token in URL on mount
  useEffect(() => {
    const init = async () => {
      // Check URL for auth_token (magic link callback)
      const params = new URLSearchParams(window.location.search);
      const authToken = params.get('auth_token');

      if (authToken) {
        try {
          const result = await verifyToken(authToken);
          setAuthState({ isAuthenticated: true, email: result.email, loading: false });
          // Clean URL
          window.history.replaceState({}, '', window.location.pathname);
          return;
        } catch (err) {
          console.error('Token verification failed:', err);
          // Clean URL and continue to normal auth check
          window.history.replaceState({}, '', window.location.pathname);
        }
      }

      // Normal auth check
      const state = await checkAuth();
      setAuthState(state);
    };

    init();
  }, []);

  const enterDemo = useCallback(() => setIsDemo(true), []);
  const exitDemo = useCallback(() => setIsDemo(false), []);

  const logout = useCallback(() => {
    logoutService();
    setAuthState({ isAuthenticated: false, email: null, loading: false });
    setIsDemo(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: authState.isAuthenticated,
        isDemo,
        email: authState.email,
        loading: authState.loading,
        enterDemo,
        exitDemo,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
