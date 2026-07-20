import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, View, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TabTone = 'primary' | 'positive' | 'warning' | 'accent' | 'info';
type TabButtonProps = TabTriggerSlotProps & {
  icon: SymbolViewProps['name'];
  tone: TabTone;
};

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/" asChild>
            <TabButton
              icon={{ ios: 'house.fill', android: 'home', web: 'home' }}
              tone="primary">
              Inicio
            </TabButton>
          </TabTrigger>
          <TabTrigger name="attendance" href="/attendance" asChild>
            <TabButton
              icon={{
                ios: 'checkmark.circle.fill',
                android: 'how_to_reg',
                web: 'how_to_reg',
              }}
              tone="positive">
              Asistencia
            </TabButton>
          </TabTrigger>
          <TabTrigger name="payments" href="/payments" asChild>
            <TabButton
              icon={{ ios: 'creditcard.fill', android: 'payments', web: 'payments' }}
              tone="warning">
              Pagos
            </TabButton>
          </TabTrigger>
          <TabTrigger name="activities" href="/activities" asChild>
            <TabButton
              icon={{ ios: 'calendar', android: 'event', web: 'event' }}
              tone="accent">
              Actividades
            </TabButton>
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabButton
              icon={{
                ios: 'person.crop.circle.fill',
                android: 'account_circle',
                web: 'account_circle',
              }}
              tone="info">
              Perfil
            </TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, icon, isFocused, tone, ...props }: TabButtonProps) {
  const colors = useTheme();
  const foreground = colors[tone];
  const background = colors[`${tone}Soft` as const];

  return (
    <Pressable
      {...props}
      style={({ pressed }) => [styles.tabPressable, pressed && styles.pressed]}>
      <ThemedView
        style={[
          styles.tabButtonView,
          {
            backgroundColor: isFocused ? background : 'transparent',
            borderColor: isFocused ? foreground : 'transparent',
          },
        ]}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: isFocused ? foreground : background },
          ]}>
          <SymbolView
            name={icon}
            size={16}
            tintColor={isFocused ? colors.textInverse : foreground}
          />
        </View>
        <ThemedText
          type="small"
          style={[
            styles.tabLabel,
            { color: isFocused ? foreground : colors.textSecondary },
            isFocused && styles.tabLabelFocused,
          ]}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView type="backgroundElement" style={styles.innerContainer}>
        <ThemedText type="smallBold" style={styles.brandText}>
          ApoderaMe
        </ThemedText>

        {props.children}
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: Spacing.three,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.xLarge,
    flexDirection: 'row',
    alignItems: 'center',
    flexGrow: 1,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
  },
  brandText: {
    marginRight: 'auto',
    paddingRight: Spacing.two,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
  tabPressable: {
    flexShrink: 1,
  },
  tabButtonView: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.medium,
    borderWidth: 1,
  },
  iconContainer: {
    width: 26,
    height: 26,
    borderRadius: Radius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
  },
  tabLabelFocused: {
    fontWeight: '900',
  },
});
