import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

// Role hierarchy and permissions
export const ROLES = {
  admin: { label: 'Admin', level: 4, home: '/' },
  manager: { label: 'Manager', level: 3, home: '/' },
  security: { label: 'Security', level: 2, home: '/incidents' },
  vendor: { label: 'Vendor', level: 1, home: '/orders' },
  attendee: { label: 'Attendee', level: 0, home: '/orders' },
};

// Pages each role can access (undefined = all roles)
export const ROLE_ACCESS = {
  '/':              ['admin', 'manager'],
  '/events':        ['admin', 'manager'],
  '/wait-times':    ['admin', 'manager', 'security'],
  '/crowd-density': ['admin', 'manager', 'security'],
  '/orders':        ['admin', 'manager', 'vendor', 'attendee'],
  '/incidents':     ['admin', 'manager', 'security'],
  '/staff':         ['admin', 'manager'],
  '/analytics':     ['admin', 'manager'],
};

export function canAccess(userRole, path) {
  const allowed = ROLE_ACCESS[path];
  if (!allowed) return true;
  return allowed.includes(userRole);
}

export function getHomeForRole(role) {
  return ROLES[role]?.home || '/';
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Handle 401 — clears token on expired/invalid
  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  useEffect(() => {
    // Expose handler for the API client to call on 401
    window.__authLogout = handleUnauthorized;
    return () => { delete window.__authLogout; };
  }, [handleUnauthorized]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.getProfile()
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (formData) => {
    const data = await api.register(formData);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
