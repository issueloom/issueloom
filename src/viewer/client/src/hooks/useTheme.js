import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'theme-preference';

function applyTheme(pref) {
  if (pref === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else if (pref === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    // system
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }
}

export function useTheme() {
  const [pref, setPref] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || 'system';
  });

  useEffect(() => {
    applyTheme(pref);
    localStorage.setItem(STORAGE_KEY, pref);
  }, [pref]);

  // system preference 변경 감지
  useEffect(() => {
    if (pref !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [pref]);

  const setTheme = useCallback((value) => {
    setPref(value);
  }, []);

  return { theme: pref, setTheme };
}
