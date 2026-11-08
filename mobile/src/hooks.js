import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

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
  return {
    ...state,
    reload: run,
    setData: (data) => setState((s) => ({ ...s, data: typeof data === 'function' ? data(s.data) : data })),
  };
}

/** Reload when the screen comes back into focus (e.g. after editing on another screen), skipping the first focus. */
export function useReloadOnFocus(reload) {
  const first = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (first.current) {
        first.current = false;
        return;
      }
      reload();
    }, [reload]),
  );
}
