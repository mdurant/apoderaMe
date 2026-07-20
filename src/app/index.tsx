import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useRouter } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '@/components/session-provider';
import { useAppTheme } from '@/components/theme-provider';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import type { DemoAccess } from '@/domain/models';

const dashboardCopy: Record<
  DemoAccess,
  {
    cardLabel: string;
    amount: string;
    badge: string;
    footer: string;
    section: string;
    firstMetric: [string, string];
    secondMetric: [string, string];
    chartLabel: string;
    chartValue: string;
    chartBadge: string;
  }
> = {
  apoderado: {
    cardLabel: 'Saldo pendiente',
    amount: '$23.000',
    badge: '1 pagada',
    footer: 'Próximo vencimiento · 24 de julio',
    section: 'Estado de julio',
    firstMetric: ['Pagado', '$12.000'],
    secondMetric: ['Por pagar', '$23.000'],
    chartLabel: 'Fondos del 2° Básico A',
    chartValue: '$126.000',
    chartBadge: '70% meta',
  },
  directiva: {
    cardLabel: 'Fondos del 5° Básico B',
    amount: '$520.000',
    badge: '80% meta',
    footer: '8 comprobantes pendientes de revisión',
    section: 'Tesorería de julio',
    firstMetric: ['Recaudado', '$185.000'],
    secondMetric: ['Pendiente', '$47.000'],
    chartLabel: 'Recaudación del curso',
    chartValue: '$520.000',
    chartBadge: '+12% mes',
  },
  colegio: {
    cardLabel: 'Recaudación informada',
    amount: '$1.248.000',
    badge: '12 cursos',
    footer: 'Colegio Valle Cordillera · año 2026',
    section: 'Resumen del colegio',
    firstMetric: ['Estudiantes', '486'],
    secondMetric: ['Cursos activos', '18'],
    chartLabel: 'Participación de apoderados',
    chartValue: '87%',
    chartBadge: '+4% mes',
  },
};

export default function HomeScreen() {
  const { colors, mode, toggleTheme } = useAppTheme();
  const { session } = useSession();
  const router = useRouter();
  const account = session!.account;
  const copy = dashboardCopy[account.access];

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View>
              <ThemedText themeColor="textSecondary" style={styles.eyebrow}>
                BUENAS TARDES
              </ThemedText>
              <ThemedText style={styles.greeting}>Hola, {account.firstName}</ThemedText>
            </View>
            <Pressable
              accessibilityLabel={`Activar tema ${mode === 'dark' ? 'claro' : 'oscuro'}`}
              accessibilityRole="button"
              onPress={toggleTheme}
              style={({ pressed }) => [
                styles.themeButton,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && styles.pressed,
              ]}>
              <SymbolView
                name={{
                  ios: mode === 'dark' ? 'sun.max.fill' : 'moon.fill',
                  android: mode === 'dark' ? 'light_mode' : 'dark_mode',
                  web: mode === 'dark' ? 'light_mode' : 'dark_mode',
                }}
                size={19}
                tintColor={colors.primary}
              />
            </Pressable>
          </View>

          <View
            style={[
              styles.balanceCard,
              { backgroundColor: colors.surfaceStrong, shadowColor: colors.shadow },
            ]}>
            <View style={[styles.orb, styles.orbTop, { backgroundColor: colors.accent }]} />
            <View style={[styles.orb, styles.orbBottom, { backgroundColor: colors.primary }]} />
            <View style={styles.cardTopRow}>
              <View>
                <ThemedText style={[styles.cardLabel, { color: colors.textInverse }]}>
                  {copy.cardLabel}
                </ThemedText>
                <ThemedText style={[styles.balance, { color: colors.textInverse }]}>
                  {copy.amount}
                </ThemedText>
              </View>
              <View style={[styles.trendBadge, { backgroundColor: colors.positiveSoft }]}>
                <ThemedText style={[styles.trendText, { color: colors.positive }]}>
                  {copy.badge}
                </ThemedText>
              </View>
            </View>
            <View style={styles.cardFooter}>
              <ThemedText style={[styles.available, { color: colors.textInverse }]}>
                {copy.footer}
              </ThemedText>
              <View style={styles.cardMark}>
                <View style={[styles.markDot, { backgroundColor: colors.accent }]} />
                <View style={[styles.markDot, styles.markOverlap, { backgroundColor: '#FFB84D' }]} />
              </View>
            </View>
          </View>

          <View style={styles.quickActions}>
            <QuickAction
              label="Asistencia"
              symbol={{ ios: 'arrow.up', android: 'arrow_upward', web: 'arrow_upward' }}
              onPress={() => router.push('/attendance')}
            />
            <QuickAction
              label="Pagar"
              symbol={{ ios: 'arrow.down', android: 'arrow_downward', web: 'arrow_downward' }}
              onPress={() => router.push('/payments')}
            />
            <QuickAction
              label="Actividades"
              symbol={{ ios: 'qrcode', android: 'qr_code', web: 'qr_code' }}
              onPress={() => router.push('/activities')}
            />
          </View>

          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>{copy.section}</ThemedText>
            <ThemedText themeColor="primary" style={styles.sectionLink}>
              Julio
            </ThemedText>
          </View>

          <View style={styles.metricGrid}>
            <MetricCard label={copy.firstMetric[0]} value={copy.firstMetric[1]} positive />
            <MetricCard label={copy.secondMetric[0]} value={copy.secondMetric[1]} />
          </View>

          <ThemedView type="surface" style={[styles.chartCard, { borderColor: colors.border }]}>
            <View style={styles.chartHeader}>
              <View>
                <ThemedText themeColor="textSecondary" style={styles.metricLabel}>
                  {copy.chartLabel}
                </ThemedText>
                <ThemedText style={styles.chartValue}>{copy.chartValue}</ThemedText>
              </View>
              <View style={[styles.chartLegend, { backgroundColor: colors.positiveSoft }]}>
                <View style={[styles.legendDot, { backgroundColor: colors.positive }]} />
                <ThemedText style={[styles.legendText, { color: colors.positive }]}>
                  {copy.chartBadge}
                </ThemedText>
              </View>
            </View>
            <View style={styles.chart}>
              {[38, 54, 42, 70, 58, 86, 74, 96, 68, 82, 62, 90].map((height, index) => (
                <View
                  key={index}
                  style={[
                    styles.chartBar,
                    {
                      height,
                      backgroundColor:
                        index === 11 ? colors.chartPrimary : colors.primarySoft,
                    },
                  ]}
                />
              ))}
            </View>
            <View style={styles.chartLabels}>
              <ThemedText themeColor="textSecondary" style={styles.chartLabel}>1 Jul</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.chartLabel}>15 Jul</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.chartLabel}>Hoy</ThemedText>
            </View>
          </ThemedView>

          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Novedades recientes</ThemedText>
            <ThemedText themeColor="primary" style={styles.sectionLink}>
              Ver todos
            </ThemedText>
          </View>

          <ThemedView type="surface" style={[styles.activityCard, { borderColor: colors.border }]}>
            <Transaction
              title="Comprobante en revisión"
              category="Salida al MIM · Hoy"
              amount="$10.000"
              icon="M"
            />
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <Transaction
              title="Cuota de julio pagada"
              category="Benjamín · 2° Básico A"
              amount="$12.000"
              icon="B"
              positive
            />
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <Transaction
              title="Asistencia por confirmar"
              category="Martina · Salida al MIM"
              amount="Pendiente"
              icon="A"
            />
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

type QuickActionProps = {
  label: string;
  symbol: SymbolViewProps['name'];
  onPress: () => void;
};

function QuickAction({ label, symbol, onPress }: QuickActionProps) {
  const colors = useAppTheme().colors;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
      <View
        style={[
          styles.actionIcon,
          { backgroundColor: colors.primarySoft, borderColor: colors.border },
        ]}>
        <SymbolView name={symbol} size={21} tintColor={colors.primary} />
      </View>
      <ThemedText style={styles.actionLabel}>{label}</ThemedText>
    </Pressable>
  );
}

function MetricCard({
  label,
  value,
  positive = false,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  const colors = useAppTheme().colors;
  const accentColor = positive ? colors.positive : colors.negative;

  return (
    <ThemedView type="surface" style={[styles.metricCard, { borderColor: colors.border }]}>
      <View style={[styles.metricIndicator, { backgroundColor: accentColor }]} />
      <ThemedText themeColor="textSecondary" style={styles.metricLabel}>
        {label}
      </ThemedText>
      <ThemedText style={styles.metricValue}>{value}</ThemedText>
      <ThemedText style={[styles.metricChange, { color: accentColor }]}>
        {positive ? '1 cuota al día' : '2 cobros pendientes'}
      </ThemedText>
    </ThemedView>
  );
}

function Transaction({
  title,
  category,
  amount,
  icon,
  positive = false,
}: {
  title: string;
  category: string;
  amount: string;
  icon: string;
  positive?: boolean;
}) {
  const colors = useAppTheme().colors;

  return (
    <View style={styles.transaction}>
      <View style={[styles.transactionIcon, { backgroundColor: colors.primarySoft }]}>
        <ThemedText themeColor="primary" style={styles.transactionInitial}>
          {icon}
        </ThemedText>
      </View>
      <View style={styles.transactionContent}>
        <ThemedText style={styles.transactionTitle} numberOfLines={1}>
          {title}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.transactionCategory}>
          {category}
        </ThemedText>
      </View>
      <ThemedText
        style={[
          styles.transactionAmount,
          positive && { color: colors.positive },
        ]}>
        {amount}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Platform.select({ web: 80, default: 0 }),
    paddingBottom: Spacing.seven,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
    paddingBottom: Spacing.four,
  },
  eyebrow: {
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.4,
    fontWeight: '700',
  },
  greeting: {
    fontSize: 23,
    lineHeight: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  themeButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
  balanceCard: {
    minHeight: 190,
    borderRadius: Radius.xLarge,
    padding: Spacing.five,
    overflow: 'hidden',
    shadowOpacity: 0.2,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  orb: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.2,
  },
  orbTop: {
    right: -42,
    top: -64,
  },
  orbBottom: {
    left: -60,
    bottom: -104,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLabel: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.72,
  },
  balance: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '800',
    letterSpacing: -1.2,
    marginTop: Spacing.one,
  },
  trendBadge: {
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  trendText: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '800',
  },
  cardFooter: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  available: {
    fontSize: 12,
    lineHeight: 17,
    opacity: 0.74,
  },
  cardMark: {
    width: 43,
    flexDirection: 'row',
  },
  markDot: {
    width: 27,
    height: 27,
    borderRadius: 14,
    opacity: 0.9,
  },
  markOverlap: {
    marginLeft: -11,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.five,
  },
  action: {
    minWidth: 76,
    alignItems: 'center',
    gap: Spacing.two,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: Radius.large,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    letterSpacing: -0.35,
  },
  sectionLink: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
  },
  metricGrid: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  metricCard: {
    flex: 1,
    borderRadius: Radius.large,
    borderWidth: 1,
    padding: Spacing.four,
    overflow: 'hidden',
  },
  metricIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  metricLabel: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 19,
    lineHeight: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: Spacing.half,
  },
  metricChange: {
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '700',
    marginTop: Spacing.one,
  },
  chartCard: {
    borderRadius: Radius.large,
    borderWidth: 1,
    padding: Spacing.four,
    marginBottom: Spacing.five,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  chartValue: {
    fontSize: 23,
    lineHeight: 31,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  chartLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '800',
  },
  chart: {
    height: 108,
    marginTop: Spacing.four,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  chartBar: {
    flex: 1,
    minWidth: 4,
    maxWidth: 18,
    borderRadius: Radius.small,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  chartLabel: {
    fontSize: 9,
    lineHeight: 13,
  },
  activityCard: {
    borderRadius: Radius.large,
    borderWidth: 1,
    paddingHorizontal: Spacing.four,
  },
  transaction: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  transactionIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInitial: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  transactionContent: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  transactionCategory: {
    fontSize: 10,
    lineHeight: 15,
  },
  transactionAmount: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 50,
  },
});
