import { useState, useCallback } from 'react';
import { ALL_THEMES, DEFAULT_THEME_ID } from './themes';
import type { AppTheme } from './themes';

const STORAGE_KEY = 'app-theme';

function applyTheme(theme: AppTheme) {
  const root = document.documentElement;
  Object.entries(theme.cssVars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  document.body.style.background = theme.bodyBg;
  document.body.style.backgroundAttachment = 'fixed';
}

function getInitialTheme(): AppTheme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const found = ALL_THEMES.find(t => t.id === saved);
      if (found) return found;
    }
  } catch {
    // localStorage may be unavailable
  }
  return ALL_THEMES.find(t => t.id === DEFAULT_THEME_ID) ?? ALL_THEMES[0];
}

export function useTheme() {
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(() => {
    const initial = getInitialTheme();
    applyTheme(initial);
    return initial;
  });

  const setTheme = useCallback((id: string) => {
    const found = ALL_THEMES.find(t => t.id === id);
    if (!found) return;
    applyTheme(found);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // ignore
    }
    setCurrentTheme(found);
  }, []);

  return { currentTheme, setTheme, allThemes: ALL_THEMES };
}
