import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Appearance } from 'react-native';
import { getUserProfile, updateUserProfile } from '../services/user.service';
import { ensureSignedIn } from '../services/auth.service';
import { lightColors, darkColors } from './themes';

const ThemeContext = createContext();

function getSystemTheme() {
  if (typeof window?.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  const scheme = Appearance.getColorScheme();
  return scheme === 'dark' ? 'dark' : 'light';
}

function listenToSystemTheme(handler) {
  if (typeof window?.matchMedia === 'function') {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }
  const sub = Appearance.addChangeListener(({ colorScheme }) => {
    handler({ matches: colorScheme === 'dark' });
  });
  return () => sub.remove();
}

export function ThemeProvider({ children }) {
  const [themeMode, setThemeModeState] = useState('light');
  const [tick, setTick] = useState(0);

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

    return listenToSystemTheme(() => {
      setTick((t) => t + 1);
    });
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
