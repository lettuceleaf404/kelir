import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, onSessionExpired, tokenStore } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        if (await tokenStore.load()) setUser((await api.me()).user);
      } catch {
        await tokenStore.clear();
      } finally {
        setLoading(false);
      }
    })();
    return onSessionExpired(() => setUser(null));
  }, []);

  const startSession = useCallback(async ({ token, user: next }) => {
    await tokenStore.set(token);
    setUser(next);
    return next;
  }, []);
  const login = useCallback(async (credentials) => startSession(await api.login(credentials)), [startSession]);
  const register = useCallback(async (payload) => startSession(await api.register(payload)), [startSession]);
  const logout = useCallback(async () => {
    await tokenStore.clear();
    setUser(null);
  }, []);
  const toggleList = useCallback(
    async (list, contentId) => {
      const on = !user?.[list]?.includes(contentId);
      const res = await api.setInList(list, contentId, on);
      setUser(res.user);
      return on;
    },
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      isAdmin: user?.role === 'admin',
      isPremium: Boolean(user?.subscription?.isPremium),
      login,
      register,
      logout,
      setUser,
      toggleList,
      inList: (list, id) => Boolean(user?.[list]?.includes(id)),
    }),
    [user, loading, login, register, logout, toggleList],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
