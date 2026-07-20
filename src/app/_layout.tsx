import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { LoginScreen } from '@/components/login-screen';
import { SessionProvider, useSession } from '@/components/session-provider';
import { AppThemeProvider, useAppTheme } from '@/components/theme-provider';

SplashScreen.preventAutoHideAsync();

function AppNavigation() {
  const { colors, mode } = useAppTheme();
  const { session, isLoading } = useSession();
  const baseTheme = mode === 'dark' ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.negative,
    },
  };

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <StatusBar animated style={mode === 'dark' ? 'light' : 'dark'} />
      <AnimatedSplashOverlay />
      {isLoading ? null : session ? <AppTabs /> : <LoginScreen />}
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <SessionProvider>
        <AppNavigation />
      </SessionProvider>
    </AppThemeProvider>
  );
}
