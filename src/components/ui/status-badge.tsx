import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type StatusTone = 'positive' | 'negative' | 'warning' | 'neutral';

const labels = {
  positive: 'Listo',
  negative: 'Requiere atención',
  warning: 'Pendiente',
  neutral: 'Informativo',
} as const;

export function StatusBadge({
  label,
  tone = 'neutral',
}: {
  label?: string;
  tone?: StatusTone;
}) {
  const colors = useTheme();
  const foreground = {
    positive: colors.positive,
    negative: colors.negative,
    warning: colors.warning,
    neutral: colors.textSecondary,
  }[tone];
  const background = {
    positive: colors.positiveSoft,
    negative: colors.negativeSoft,
    warning: colors.backgroundElement,
    neutral: colors.backgroundElement,
  }[tone];

  return (
    <View style={[styles.badge, { backgroundColor: background }]}>
      <View style={[styles.dot, { backgroundColor: foreground }]} />
      <ThemedText style={[styles.label, { color: foreground }]}>{label ?? labels[tone]}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.pill,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
  },
});
