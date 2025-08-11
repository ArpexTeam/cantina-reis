import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

const ONE_DAY_MS = 1 * 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export const AuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [loading, setLoading] = useState(true); // Novo estado

  useEffect(() => {
    const data = localStorage.getItem('adminUser');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (parsed && parsed.expireAt > Date.now()) {
          setAdminUser(true);
        } else {
          localStorage.removeItem('adminUser');
          setAdminUser(null);
        }
      } catch {
        localStorage.removeItem('adminUser');
        setAdminUser(null);
      }
    }
    setLoading(false); // Sempre desliga o loading depois
  }, []);

const login = (rememberMe) => {
  const expireAt = Date.now() + (rememberMe ? SEVEN_DAYS_MS : ONE_DAY_MS);
  localStorage.setItem('adminUser', JSON.stringify({ expireAt }));
  setAdminUser(true);
};

  const logout = () => {
    localStorage.removeItem('adminUser');
    setAdminUser(null);
  };

  return (
    <AuthContext.Provider value={{ adminUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
