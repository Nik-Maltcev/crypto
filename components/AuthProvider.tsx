import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { checkAuth, verifyToken, logout as logoutService, AuthState, getSessionToken } from '../services/authService';
import { checkSubscription } from '../services/paymentService';

interface AuthContextValue {
  isAuthenticated: boolean;
  isDemo: boolean;
  hasSubscription: boolean;
  subscriptionPlan: string | null;
  subscriptionExpires: string | null;
  email: string | null;
  loading: boolean;
  enterDemo: () => void;
  exitDemo: () => void;
  logout: () => void;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  isDemo: false,
  hasSubscription: false,
  subscriptionPlan: null,
  subscriptionExpires: null,
  email: null,
  loading: true,
  enterDemo: () => {},
  exitDemo: () => {},
  logout: () => {},
  refreshSubscription: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({ isAuthenticated: false, email: null, loading: true });
  const [isDemo, setIsDemo] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);
  const [subscriptionExpires, setSubscriptionExpires] = useState<string | null>(null);

  const refreshSubscription = useCallback(async () => {
    const token = getSessionToken();
    if (!token) {
      setHasSubscription(false);
      return;
    }
    try {
      const status = await checkSubscription(token);
      setHasSubscription(status.has_subscription);
      setSubscriptionPlan(status.plan || null);
      setSubscriptionExpires(status.expires_at || null);
    } catch {
      setHasSubscription(false);
    }
  }, []);

  // Check for magic link token in URL on mount
  useEffect(() => {
    const init = async () => {
      // Admin bypass: if admin flag is set, skip all auth
      if (localStorage.getItem('cryptopulse_admin') === '1') {
        setAuthState({ isAuthenticated: true, email: 'admin@dexflow.xyz', loading: false });
        setHasSubscription(true);
        return;
      }

      // Check URL for auth_token (magic link callback)
      const params = new URLSearchParams(window.location.search);
      const authToken = params.get('auth_token');

      if (authToken) {
        try {
          const result = await verifyToken(authToken);
          setAuthState({ isAuthenticated: true, email: result.email, loading: false });
          // Clean URL
          window.history.replaceState({}, '', window.location.pathname);
          // Check subscription
          setTimeout(refreshSubscription, 500);
          return;
        } catch (err) {
          console.error('Token verification failed:', err);
          window.history.replaceState({}, '', window.location.pathname);
        }
      }

      // Check for payment result in URL
      const paymentResult = params.get('payment');
      if (paymentResult) {
        window.history.replaceState({}, '', window.location.pathname);
      }

      // Normal auth check
      const state = await checkAuth();
      setAuthState(state);

      // If authenticated, check subscription
      if (state.isAuthenticated) {
        const token = getSessionToken();
        if (token) {
          try {
            const status = await checkSubscription(token);
            setHasSubscription(status.has_subscription);
            setSubscriptionPlan(status.plan || null);
            setSubscriptionExpires(status.expires_at || null);
          } catch {}
        }
      }
    };

    init();
  }, []);

  const enterDemo = useCallback(() => setIsDemo(true), []);
  const exitDemo = useCallback(() => setIsDemo(false), []);

  const logout = useCallback(() => {
    logoutService();
    localStorage.removeItem('cryptopulse_admin');
    setAuthState({ isAuthenticated: false, email: null, loading: false });
    setIsDemo(false);
    setHasSubscription(false);
    setSubscriptionPlan(null);
    setSubscriptionExpires(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: authState.isAuthenticated,
        isDemo,
        hasSubscription,
        subscriptionPlan,
        subscriptionExpires,
        email: authState.email,
        loading: authState.loading,
        enterDemo,
        exitDemo,
        logout,
        refreshSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
