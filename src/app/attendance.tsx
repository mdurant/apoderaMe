import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { StatusBadge } from '@/components/ui/status-badge';
import { useSession } from '@/components/session-provider';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { demoActivities, demoAttendances, demoStudents } from '@/data/demo';
import type { AttendanceStatus } from '@/domain/models';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatChileDateTime } from '@/utils/chile';

const attendanceKey = (activityId: string, studentId: string) => `${activityId}:${studentId}`;

export default function AttendanceScreen() {
  const colors = useTheme();
  const { session } = useSession();
  const isGuardian = session!.account.access === 'apoderado';
  const [responses, setResponses] = useState<Record<string, AttendanceStatus>>(
    Object.fromEntries(
      demoAttendances.map((attendance) => [
        attendanceKey(attendance.activityId, attendance.studentId),
        attendance.status,
      ]),
    ),
  );

  return (
    <Screen
      title="Asistencia"
      subtitle={
        isGuardian
          ? 'Confirma con un toque la participación de tus estudiantes.'
          : 'Revisa las respuestas informadas para las próximas actividades.'
      }>
      <ThemedView
        type="surfaceStrong"
        style={[styles.summary, { shadowColor: colors.shadow }]}>
        <ThemedText style={[styles.summaryEyebrow, { color: colors.textInverse }]}>
          ESTA SEMANA
        </ThemedText>
        <ThemedText style={[styles.summaryValue, { color: colors.textInverse }]}>
          {isGuardian ? '1 respuesta pendiente' : '24 de 31 respuestas recibidas'}
        </ThemedText>
        <ThemedText style={[styles.summaryText, { color: colors.textInverse }]}>
          {isGuardian
            ? 'Responde antes del viernes 24 de julio.'
            : 'Seguimiento demo del 5° Básico B.'}
        </ThemedText>
      </ThemedView>

      <View style={styles.sectionHeading}>
        <ThemedText style={styles.sectionTitle}>Próximas actividades</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.count}>
          {demoActivities.length} eventos
        </ThemedText>
      </View>

      {demoActivities.slice(0, 2).map((activity) => {
        const student = demoStudents.find((item) => item.courseId === activity.courseId);
        const responseKey = attendanceKey(activity.id, student?.id ?? 'sin-estudiante');
        const response = responses[responseKey] ?? 'sin_responder';

        return (
          <ThemedView
            key={activity.id}
            type="surface"
            style={[styles.card, { borderColor: colors.border }]}>
            <View style={styles.cardTop}>
              <View style={styles.cardContent}>
                <ThemedText themeColor="primary" style={styles.course}>
                  {student?.courseName}
                </ThemedText>
                <ThemedText style={styles.activityTitle}>{activity.title}</ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.meta}>
                  {formatChileDateTime(activity.startsAt)} · {activity.location}
                </ThemedText>
              </View>
              <StatusBadge
                label={
                  response === 'asistire'
                    ? 'Asistirá'
                    : response === 'no_asistire'
                      ? 'No asistirá'
                      : 'Sin responder'
                }
                tone={
                  response === 'asistire'
                    ? 'positive'
                    : response === 'no_asistire'
                      ? 'negative'
                      : 'warning'
                }
              />
            </View>

            <ThemedText themeColor="textSecondary" style={styles.studentLabel}>
              {isGuardian ? 'Respuesta para' : 'Estudiante'} {student?.firstName}
            </ThemedText>
            {isGuardian ? (
              <View style={styles.actions}>
                <ResponseButton
                  label="Sí, asistirá"
                  selected={response === 'asistire'}
                  onPress={() =>
                    setResponses((current) => ({ ...current, [responseKey]: 'asistire' }))
                  }
                />
                <ResponseButton
                  label="No asistirá"
                  selected={response === 'no_asistire'}
                  onPress={() =>
                    setResponses((current) => ({ ...current, [responseKey]: 'no_asistire' }))
                  }
                />
              </View>
            ) : null}
          </ThemedView>
        );
      })}

      <ThemedText themeColor="textSecondary" style={styles.demoNotice}>
        Datos ficticios para demostración. Las respuestas se guardan solo durante esta sesión.
      </ThemedText>
    </Screen>
  );
}

function ResponseButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.responseButton,
        {
          backgroundColor: selected ? colors.primary : colors.backgroundElement,
          borderColor: selected ? colors.primary : colors.border,
        },
        pressed && styles.pressed,
      ]}>
      <ThemedText
        style={[
          styles.responseLabel,
          { color: selected ? colors.textInverse : colors.text },
        ]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  summary: {
    borderRadius: Radius.xLarge,
    padding: Spacing.five,
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  summaryEyebrow: {
    fontSize: 9,
    lineHeight: 13,
    fontWeight: '800',
    letterSpacing: 1.2,
    opacity: 0.7,
  },
  summaryValue: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '800',
    marginTop: Spacing.one,
  },
  summaryText: {
    fontSize: 12,
    lineHeight: 18,
    opacity: 0.72,
    marginTop: Spacing.one,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  sectionTitle: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '800',
  },
  count: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
  },
  card: {
    borderRadius: Radius.large,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.four,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  cardContent: {
    flex: 1,
  },
  course: {
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  activityTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    marginTop: Spacing.half,
  },
  meta: {
    fontSize: 11,
    lineHeight: 17,
    marginTop: Spacing.one,
  },
  studentLabel: {
    fontSize: 11,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  responseButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: Radius.medium,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
  },
  responseLabel: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.76,
  },
  demoNotice: {
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: Spacing.two,
  },
});
