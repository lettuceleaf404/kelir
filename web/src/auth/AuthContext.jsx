import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));
  // True right after an explicit logout, so protected pages send people Home instead of to the login form.
  const [signedOut, setSignedOut] = useState(false);

  // Restore the session from a saved token
  useEffect(() => {
    if (!tokenStore.get()) return;
    api
      .me()
      .then(({ user: me }) => setUser(me))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener('kelir:session-expired', onExpired);
    return () => window.removeEventListener('kelir:session-expired', onExpired);
  }, []);

  const startSession = useCallback(({ token, user: nextUser }) => {
    tokenStore.set(token);
    setSignedOut(false);
    setUser(nextUser);
    return nextUser;
  }, []);

  const login = useCallback(async (credentials) => startSession(await api.login(credentials)), [startSession]);
  const register = useCallback(async (payload) => startSession(await api.register(payload)), [startSession]);
  const logout = useCallback(() => {
    tokenStore.clear();
    setSignedOut(true);
    setUser(null);
  }, []);
  const refresh = useCallback(async () => {
    const { user: me } = await api.me();
    setUser(me);
    return me;
  }, []);

  /** Toggle a title in favorites, watchlist or watched; updates local state from the server's answer. */
  const toggleList = useCallback(async (list, contentId) => {
    const on = !user?.[list]?.includes(contentId);
    const res = await api.setInList(list, contentId, on);
    setUser(res.user);
    return on;
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      loading,
      signedOut,
      isAdmin: user?.role === 'admin',
      isPremium: Boolean(user?.subscription?.isPremium),
      login,
      register,
      logout,
      refresh,
      setUser,
      toggleList,
      inList: (list, id) => Boolean(user?.[list]?.includes(id)),
    }),
    [user, loading, signedOut, login, register, logout, refresh, toggleList],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
