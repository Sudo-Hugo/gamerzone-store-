import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/services';
import { setUnauthorizedHandler, tokenStore } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true); // validando token salvo

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  // Ao abrir o site, confirma com a API se o token salvo ainda vale
  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!tokenStore.get()) {
      setChecking(false);
      return;
    }
    authApi
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => tokenStore.clear())
      .finally(() => setChecking(false));
  }, [logout]);

  const handleAuth = ({ user, token }) => {
    tokenStore.set(token);
    setUser(user);
    return user;
  };

  const value = useMemo(
    () => ({
      user,
      checking,
      isAdmin: user?.role === 'admin',
      login: async (email, password) => handleAuth(await authApi.login(email, password)),
      register: async (name, email, password) => handleAuth(await authApi.register(name, email, password)),
      logout,
    }),
    [user, checking, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
