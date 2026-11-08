import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform, useColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { dark, light } from './theme';

const KEY = 'kelir_theme';
const store =
  Platform.OS === 'web'
    ? { get: async () => globalThis.localStorage?.getItem(KEY), set: async (v) => globalThis.localStorage?.setItem(KEY, v) }
    : { get: () => SecureStore.getItemAsync(KEY), set: (v) => SecureStore.setItemAsync(KEY, v) };

const ThemeContext = createContext({ c: light, dark: false, pref: 'light', setPref: () => {} });

/** Light is the default for browsing; "dark" and "system" are options in Profile. The player is always dark. */
export function ThemeProvider({ children }) {
  const system = useColorScheme();
  const [pref, setPrefState] = useState('light');
  useEffect(() => {
    store.get().then((v) => v && setPrefState(v)).catch(() => {});
  }, []);
  const isDark = pref === 'dark' || (pref === 'system' && system === 'dark');
  const value = useMemo(
    () => ({
      c: isDark ? dark : light,
      dark: isDark,
      pref,
      setPref: (next) => {
        setPrefState(next);
        store.set(next).catch(() => {});
      },
    }),
    [isDark, pref],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

/** Build a StyleSheet from the active colors: const s = useStyles(makeStyles). */
export function useStyles(factory) {
  const { c } = useTheme();
  return useMemo(() => factory(c), [c, factory]);
}

/** Renders children with the dark theme (premium band, player), whatever the app theme is. */
export function DarkScope({ children }) {
  const parent = useContext(ThemeContext);
  const value = useMemo(() => ({ ...parent, c: dark, dark: true }), [parent]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
