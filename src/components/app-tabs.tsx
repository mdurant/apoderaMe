import { Tabs } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { useTheme } from '@/hooks/use-theme';

const tabIcons: Record<string, SymbolViewProps['name']> = {
  index: { ios: 'house.fill', android: 'home', web: 'home' },
  attendance: { ios: 'checkmark.circle.fill', android: 'how_to_reg', web: 'how_to_reg' },
  payments: { ios: 'creditcard.fill', android: 'payments', web: 'payments' },
  activities: { ios: 'calendar', android: 'event', web: 'event' },
  profile: { ios: 'person.crop.circle.fill', android: 'account_circle', web: 'account_circle' },
};

export default function AppTabs() {
  const colors = useTheme();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        tabBarIcon: ({ color }) => (
          <SymbolView name={tabIcons[route.name] ?? 'circle'} size={22} tintColor={color} />
        ),
      })}>
      <Tabs.Screen name="index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="attendance" options={{ title: 'Asistencia' }} />
      <Tabs.Screen name="payments" options={{ title: 'Pagos' }} />
      <Tabs.Screen name="activities" options={{ title: 'Actividades' }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil' }} />
    </Tabs>
  );
}
