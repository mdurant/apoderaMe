import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from 'react';

import { Colors, type ThemeMode, type ThemePreference } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type ThemeContextValue = {
  colors: (typeof Colors)[ThemeMode];
  mode: ThemeMode;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function AppThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>('system');
  const systemMode: ThemeMode = systemScheme === 'dark' ? 'dark' : 'light';
  const mode = preference === 'system' ? systemMode : preference;

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: Colors[mode],
      mode,
      preference,
      setPreference,
      toggleTheme: () => setPreference((current) => {
        const activeMode = current === 'system' ? systemMode : current;
        return activeMode === 'dark' ? 'light' : 'dark';
      }),
    }),
    [mode, preference, systemMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useAppTheme must be used inside AppThemeProvider');
  }

  return context;
}
