import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api, getStoredToken, getStoredUser, setAuthSession, clearAuthSession } from '../services/api';
import AuthModal from '../components/auth/AuthModal';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(() => getStoredUser());
  const [isLoading, setIsLoading] = useState(true);

  // Global Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('login');
  const [modalPrompt, setModalPrompt] = useState(null);
  const onAuthSuccessRef = useRef(null);

  // Initialize and verify session on load
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      const storedToken = getStoredToken();
      if (!storedToken) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const data = await api.getMe();
        if (isMounted && data.success && data.user) {
          setUser(data.user);
          setAuthSession(storedToken, data.user);
        }
      } catch (err) {
        console.warn('Session verification failed or token expired:', err.message);
        if (isMounted) {
          clearAuthSession();
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const openAuthModal = useCallback(({ tab = 'login', prompt = null, onSuccess = null } = {}) => {
    setModalTab(tab);
    setModalPrompt(prompt);
    onAuthSuccessRef.current = typeof onSuccess === 'function' ? onSuccess : null;
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setModalPrompt(null);
    onAuthSuccessRef.current = null;
  }, []);

  const handleAuthSuccess = useCallback((authedUser) => {
    if (onAuthSuccessRef.current) {
      try {
        onAuthSuccessRef.current(authedUser);
      } catch (err) {
        console.error('Error executing post-auth callback:', err);
      }
      onAuthSuccessRef.current = null;
    }
  }, []);

  // Listen for 401 session expiration from api.js
  useEffect(() => {
    function handleSessionExpired(event) {
      console.warn('401 session required intercepted:', event?.detail);
      clearAuthSession();
      setToken(null);
      setUser(null);
      openAuthModal({
        tab: 'login',
        prompt: event?.detail?.message || 'Your session has expired. Please log in to continue.',
      });
    }

    window.addEventListener('lifequest:auth-required', handleSessionExpired);
    return () => window.removeEventListener('lifequest:auth-required', handleSessionExpired);
  }, [openAuthModal]);

  const requireAuth = useCallback(
    (action, { prompt = 'Log in to continue your quest', tab = 'login' } = {}) => {
      if (token && user) {
        if (typeof action === 'function') action(user);
        return true;
      }
      openAuthModal({
        tab,
        prompt,
        onSuccess: (loggedUser) => {
          if (typeof action === 'function') action(loggedUser);
        },
      });
      return false;
    },
    [token, user, openAuthModal]
  );

  const login = useCallback(async (email, password) => {
    const data = await api.login({ email, password });
    if (data.success && data.token) {
      setAuthSession(data.token, data.user);
      setToken(data.token);
      setUser(data.user);
      return data;
    }
    throw new Error(data.message || 'Login failed');
  }, []);

  const signup = useCallback(async (userData) => {
    const data = await api.signup(userData);
    if (data.success && data.token) {
      setAuthSession(data.token, data.user);
      setToken(data.token);
      setUser(data.user);
      return data;
    }
    throw new Error(data.message || 'Signup failed');
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      clearAuthSession();
      setToken(null);
      setUser(null);
    }
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isLoading,
    login,
    signup,
    logout,
    openAuthModal,
    closeAuthModal,
    requireAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        initialTab={modalTab}
        prompt={modalPrompt}
        onAuthSuccess={handleAuthSuccess}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
