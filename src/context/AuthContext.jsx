import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAuthToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('algoboostx_user');
    return saved
      ? JSON.parse(saved)
      : {
          id: 'usr_demo_882',
          name: 'Alex Rivera',
          email: 'quant.alex@algoboostx.ai',
          role: 'Quantitative Trader',
          tier: 'Pro Enterprise (AI Enabled)',
          joined: '2026-03-15',
          isDemo: true,
        };
  });

  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [backendStatus, setBackendStatus] = useState({
    checked: false,
    connected: false,
    url: api.health ? 'http://localhost:5000/api' : '',
  });

  // Verify backend connectivity on mount
  useEffect(() => {
    let isMounted = true;
    api.health.check().then((res) => {
      if (isMounted) {
        setBackendStatus({
          checked: true,
          connected: res.connected,
          url: res.url,
          status: res.status,
        });
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password) => {
    // Attempt backend first if available
    const backendRes = await api.auth.login({ email, password });
    if (backendRes && backendRes.token) {
      setAuthToken(backendRes.token);
      setUser(backendRes.user);
      setIsAuthenticated(true);
      localStorage.setItem('algoboostx_user', JSON.stringify(backendRes.user));
      return { success: true, backend: true };
    }

    // Frontend demo fallback
    const demoUser = {
      id: 'usr_demo_' + Math.floor(Math.random() * 1000),
      name: email.split('@')[0] || 'Demo Trader',
      email: email,
      role: 'Algorithmic Trader',
      tier: 'Pro Tier (Demo Mode)',
      joined: new Date().toISOString().split('T')[0],
      isDemo: true,
    };
    setUser(demoUser);
    setIsAuthenticated(true);
    localStorage.setItem('algoboostx_user', JSON.stringify(demoUser));
    return { success: true, backend: false };
  };

  const signup = async (name, email, password) => {
    const backendRes = await api.auth.signup({ name, email, password });
    if (backendRes && backendRes.token) {
      setAuthToken(backendRes.token);
      setUser(backendRes.user);
      setIsAuthenticated(true);
      localStorage.setItem('algoboostx_user', JSON.stringify(backendRes.user));
      return { success: true, backend: true };
    }

    const demoUser = {
      id: 'usr_demo_' + Math.floor(Math.random() * 1000),
      name: name || 'Demo Trader',
      email: email,
      role: 'Algorithmic Trader',
      tier: 'Pro Tier (Demo Mode)',
      joined: new Date().toISOString().split('T')[0],
      isDemo: true,
    };
    setUser(demoUser);
    setIsAuthenticated(true);
    localStorage.setItem('algoboostx_user', JSON.stringify(demoUser));
    return { success: true, backend: false };
  };

  const logout = () => {
    api.auth.logout();
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('algoboostx_user');
  };

  const checkBackendNow = async () => {
    const res = await api.health.check();
    setBackendStatus({
      checked: true,
      connected: res.connected,
      url: res.url,
      status: res.status,
    });
    return res;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        backendStatus,
        login,
        signup,
        logout,
        checkBackendNow,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
