import { useCallback, useEffect, useRef, useState } from 'react';

/** Run an async loader and track loading, error and data. Re-runs when deps change. */
export function useAsync(loader, deps = []) {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const run = useCallback(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    loaderRef
      .current()
      .then((data) => active && setState({ loading: false, error: null, data }))
      .catch((error) => active && setState({ loading: false, error, data: null }));
    return () => {
      active = false;
    };
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(run, deps);
  return { ...state, reload: run, setData: (data) => setState((s) => ({ ...s, data: typeof data === 'function' ? data(s.data) : data })) };
}

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · KELIR` : 'KELIR · Satu Ruang, Sejuta Cerita';
  }, [title]);
}

/** Theme preference: "light", "dark" or "system", applied on <html data-theme>. */
const THEME_KEY = 'kelir_theme';
export function applyTheme(pref = localStorage.getItem(THEME_KEY) || 'light') {
  const dark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  return pref;
}
export function useTheme() {
  const [pref, setPref] = useState(() => localStorage.getItem(THEME_KEY) || 'light');
  const update = (next) => {
    localStorage.setItem(THEME_KEY, next);
    setPref(next);
    applyTheme(next);
  };
  return [pref, update];
}
