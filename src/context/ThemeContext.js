import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUserProfile, updateUserProfile } from '../services/user.service';
import { ensureSignedIn } from '../services/auth.service';
import { lightColors, darkColors } from './themes';

const ThemeContext = createContext();

function getSystemTheme() {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

export function ThemeProvider({ children }) {
  const [themeMode, setThemeModeState] = useState('light');

  useEffect(() => {
    (async () => {
      try {
        const userId = await ensureSignedIn();
        const profile = await getUserProfile(userId);
        if (profile?.theme) {
          setThemeModeState(profile.theme);
        }
      } catch {
        // fallback to default
      }
    })();

    const mq = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (themeMode === 'auto') setThemeModeState('auto');
    };
    if (mq) mq.addEventListener('change', handler);
    return () => { if (mq) mq.removeEventListener('change', handler); };
  }, []);

  const setThemeMode = useCallback(async (newMode) => {
    setThemeModeState(newMode);
    try {
      const userId = await ensureSignedIn();
      await updateUserProfile(userId, { theme: newMode });
    } catch {
      // persistencia no crítica
    }
  }, []);

  let resolved;
  if (themeMode === 'auto') {
    resolved = getSystemTheme();
  } else {
    resolved = themeMode;
  }

  const colors = resolved === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ themeMode, resolved, colors, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      themeMode: 'light',
      resolved: 'light',
      colors: lightColors,
      setThemeMode: () => {},
    };
  }
  return context;
}
