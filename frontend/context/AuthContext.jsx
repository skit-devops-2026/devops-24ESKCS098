import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('lifequest_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('lifequest_token') || null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [authModalConfig, setAuthModalConfig] = useState({ isOpen: false, tab: 'login' });

  // On mount, verify existing session if token exists
  useEffect(() => {
    let mounted = true;
    async function verifySession() {
      const storedToken = localStorage.getItem('lifequest_token');
      if (!storedToken) {
        if (mounted) setIsLoading(false);
        return;
      }

      try {
        const res = await api.getMe();
        if (mounted && res && res.success && res.user) {
          setCurrentUser(res.user);
          localStorage.setItem('lifequest_user', JSON.stringify(res.user));
        }
      } catch (err) {
        console.warn('[LifeQuest Auth] Session expired or invalid, clearing credentials:', err.message);
        if (mounted) {
          localStorage.removeItem('lifequest_token');
          localStorage.removeItem('lifequest_user');
          setToken(null);
          setCurrentUser(null);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    verifySession();
    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    if (res && res.success && res.token) {
      localStorage.setItem('lifequest_token', res.token);
      localStorage.setItem('lifequest_user', JSON.stringify(res.user));
      setToken(res.token);
      setCurrentUser(res.user);
      return res.user;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (name, email, password, vibe) => {
    const res = await api.register({ name, email, password, vibe });
    if (res && res.success && res.token) {
      localStorage.setItem('lifequest_token', res.token);
      localStorage.setItem('lifequest_user', JSON.stringify(res.user));
      setToken(res.token);
      setCurrentUser(res.user);
      return res.user;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('lifequest_token');
    localStorage.removeItem('lifequest_user');
    setToken(null);
    setCurrentUser(null);
  };

  const openAuthModal = (tab = 'login') => {
    setAuthModalConfig({ isOpen: true, tab });
  };

  const closeAuthModal = () => {
    setAuthModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  const value = {
    currentUser,
    token,
    isAuthenticated: Boolean(token && currentUser),
    isLoading,
    login,
    register,
    logout,
    isAuthModalOpen: authModalConfig.isOpen,
    authModalTab: authModalConfig.tab,
    openAuthModal,
    closeAuthModal,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
