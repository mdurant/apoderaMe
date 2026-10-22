import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { StatusBadge } from '@/components/ui/status-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { demoActivities, demoStudents } from '@/data/demo';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatChileDateTime, formatClp } from '@/utils/chile';

export default function ActivitiesScreen() {
  const colors = useTheme();

  return (
    <Screen title="Actividades" subtitle="Eventos, presupuestos y avances de cada curso.">
      {demoActivities.map((activity, index) => {
        const course = demoStudents.find((student) => student.courseId === activity.courseId);
        const percentage =
          activity.estimatedAmount > 0
            ? Math.round((activity.collectedAmount / activity.estimatedAmount) * 100)
            : 0;

        return (
          <ThemedView
            key={activity.id}
            type="surface"
            style={[styles.card, { borderColor: colors.border }]}>
            <View style={styles.dateColumn}>
              <ThemedText themeColor="primary" style={styles.day}>
                {new Intl.DateTimeFormat('es-CL', {
                  day: '2-digit',
                  timeZone: 'America/Santiago',
                }).format(new Date(activity.startsAt))}
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.month}>
                {new Intl.DateTimeFormat('es-CL', {
                  month: 'short',
                  timeZone: 'America/Santiago',
                })
                  .format(new Date(activity.startsAt))
                  .replace('.', '')
                  .toUpperCase()}
              </ThemedText>
            </View>

            <View style={styles.content}>
              <View style={styles.cardHeader}>
                <View style={styles.heading}>
                  <ThemedText themeColor="primary" style={styles.course}>
                    {course?.courseName}
                  </ThemedText>
                  <ThemedText style={styles.title}>{activity.title}</ThemedText>
                </View>
                {index === 0 ? <StatusBadge label="Próxima" tone="warning" /> : null}
              </View>

              <ThemedText themeColor="textSecondary" style={styles.description}>
                {activity.description}
              </ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.meta}>
                {formatChileDateTime(activity.startsAt)} · {activity.location}
              </ThemedText>

              <View style={styles.fundingHeader}>
                <ThemedText style={styles.fundingLabel}>Fondos reunidos</ThemedText>
                <ThemedText themeColor="primary" style={styles.percentage}>
                  {percentage}%
                </ThemedText>
              </View>
              <View style={[styles.progressTrack, { backgroundColor: colors.backgroundElement }]}>
                <View
                  style={[
                    styles.progressValue,
                    {
                      width: `${percentage}%`,
                      backgroundColor: colors.primary,
                    },
                  ]}
                />
              </View>
              <View style={styles.amounts}>
                <ThemedText themeColor="textSecondary" style={styles.amountText}>
                  Reunido: {formatClp(activity.collectedAmount)}
                </ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.amountText}>
                  Meta: {formatClp(activity.estimatedAmount)}
                </ThemedText>
              </View>
            </View>
          </ThemedView>
        );
      })}

      <ThemedView type="backgroundElement" style={styles.transparencyCard}>
        <ThemedText style={styles.transparencyTitle}>Transparencia para las familias</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.transparencyText}>
          Al conectar el backend, cada actividad mostrará ingresos, gastos y comprobantes aprobados
          por la directiva.
        </ThemedText>
      </ThemedView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: Radius.large,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.four,
  },
  dateColumn: {
    width: 42,
    alignItems: 'center',
  },
  day: {
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  month: {
    fontSize: 9,
    lineHeight: 13,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  content: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  heading: {
    flex: 1,
  },
  course: {
    fontSize: 9,
    lineHeight: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    marginTop: Spacing.half,
  },
  description: {
    fontSize: 11,
    lineHeight: 17,
    marginTop: Spacing.two,
  },
  meta: {
    fontSize: 10,
    lineHeight: 16,
    marginTop: Spacing.two,
  },
  fundingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.four,
  },
  fundingLabel: {
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '700',
  },
  percentage: {
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '800',
  },
  progressTrack: {
    height: 6,
    borderRadius: Radius.pill,
    overflow: 'hidden',
    marginTop: Spacing.one,
  },
  progressValue: {
    height: '100%',
    borderRadius: Radius.pill,
  },
  amounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  amountText: {
    fontSize: 9,
    lineHeight: 14,
  },
  transparencyCard: {
    borderRadius: Radius.large,
    padding: Spacing.four,
    marginTop: Spacing.two,
  },
  transparencyTitle: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
  },
  transparencyText: {
    fontSize: 10,
    lineHeight: 16,
    marginTop: Spacing.one,
  },
});
