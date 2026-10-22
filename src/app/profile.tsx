import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSession } from '@/components/session-provider';
import { useAppTheme } from '@/components/theme-provider';
import { Radius, Spacing, type ThemePreference } from '@/constants/theme';
import { useProfileData } from '@/hooks/use-profile-data';
import { useTheme } from '@/hooks/use-theme';
import { maskRut } from '@/utils/chile';

export default function ProfileScreen() {
  const colors = useTheme();
  const { preference, setPreference } = useAppTheme();
  const { session, signOut } = useSession();
  const { students, school } = useProfileData();
  const account = session!.account;
  const rutLabel = account.rut ? maskRut(account.rut) : '**.***.***-*';
  const schoolName = school?.name ?? 'Colegio no disponible';

  return (
    <Screen title="Mi perfil" subtitle="Datos de contacto, estudiantes y privacidad.">
      <ThemedView type="surface" style={[styles.profileCard, { borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
          <ThemedText themeColor="primary" style={styles.avatarText}>
            {account.initials}
          </ThemedText>
        </View>
        <View style={styles.profileContent}>
          <ThemedText style={styles.name}>
            {account.firstName} {account.paternalSurname} {account.maternalSurname}
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.profileMeta}>
            RUT {rutLabel}
          </ThemedText>
          <ThemedText themeColor="primary" style={styles.role}>
            {account.roleLabel} · {account.scopeLabel}
          </ThemedText>
        </View>
      </ThemedView>

      <SectionTitle>Datos de contacto</SectionTitle>
      <ThemedView type="surface" style={[styles.listCard, { borderColor: colors.border }]}>
        <InfoRow label="Correo" value={account.email} />
        <Divider />
        <InfoRow label="Teléfono" value={account.phone} />
        <Divider />
        <InfoRow label="Colegio" value={schoolName} />
      </ThemedView>

      {account.access === 'apoderado' ? (
        <>
          <SectionTitle>Mis estudiantes</SectionTitle>
          <ThemedView type="surface" style={[styles.listCard, { borderColor: colors.border }]}>
            {students.map((student, index) => (
              <View key={student.id}>
                {index > 0 ? <Divider /> : null}
                <View style={styles.studentRow}>
                  <View
                    style={[styles.studentAvatar, { backgroundColor: colors.backgroundElement }]}>
                    <ThemedText themeColor="primary" style={styles.studentInitial}>
                      {student.firstName.slice(0, 1)}
                    </ThemedText>
                  </View>
                  <View style={styles.studentContent}>
                    <ThemedText style={styles.studentName}>
                      {student.firstName} {student.paternalSurname}
                    </ThemedText>
                    <ThemedText themeColor="textSecondary" style={styles.studentMeta}>
                      {student.courseName}
                      {student.rut ? ` · RUT ${maskRut(student.rut)}` : ''}
                    </ThemedText>
                  </View>
                </View>
              </View>
            ))}
          </ThemedView>
        </>
      ) : null}

      <SectionTitle>Apariencia</SectionTitle>
      <View style={[styles.segmented, { backgroundColor: colors.backgroundElement }]}>
        {([
          ['Sistema', 'system'],
          ['Claro', 'light'],
          ['Oscuro', 'dark'],
        ] as [string, ThemePreference][]).map(([label, value]) => {
          const selected = preference === value;
          return (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setPreference(value)}
              style={[
                styles.segment,
                selected && {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}>
              <ThemedText
                themeColor={selected ? 'primary' : 'textSecondary'}
                style={styles.segmentLabel}>
                {label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <SectionTitle>Privacidad y tus derechos</SectionTitle>
      <ThemedView
        type="surface"
        style={[styles.privacyCard, { borderColor: colors.border }]}>
        <ThemedText style={styles.privacyTitle}>Tú mantienes el control de tus datos</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.privacyText}>
          ApoderaMe tratará datos de identificación, contacto, relación con estudiantes,
          asistencias y pagos únicamente para la gestión escolar informada.
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.privacyText}>
          Puedes solicitar acceso, rectificación, supresión u oposición. El diseño también
          contempla portabilidad y bloqueo para la entrada en vigencia de la Ley 21.719 el 1 de
          diciembre de 2026.
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            Alert.alert(
              'Solicitud de privacidad',
              'El formulario quedará operativo al conectar el backend seguro. No se enviaron datos.',
            )
          }
          style={({ pressed }) => [
            styles.privacyButton,
            { backgroundColor: colors.primary },
            pressed && styles.pressed,
          ]}>
          <ThemedText style={[styles.privacyButtonLabel, { color: colors.textInverse }]}>
            Iniciar una solicitud
          </ThemedText>
        </Pressable>
      </ThemedView>

      <Pressable
        accessibilityRole="button"
        onPress={() => void signOut()}
        style={({ pressed }) => [
          styles.signOutButton,
          { borderColor: colors.negative },
          pressed && styles.pressed,
        ]}>
        <ThemedText style={[styles.signOutLabel, { color: colors.negative }]}>
          {session!.mode === 'supabase' ? 'Cerrar sesión' : 'Cerrar sesión demo'}
        </ThemedText>
      </Pressable>

      <ThemedText themeColor="textSecondary" style={styles.demoNotice}>
        {session!.mode === 'supabase'
          ? 'Sesión conectada a Supabase Auth y PostgreSQL con RLS.'
          : 'Perfil ficticio de demostración. Ningún dato corresponde a personas reales.'}
      </ThemedText>
    </Screen>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <ThemedText style={styles.sectionTitle}>{children}</ThemedText>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <ThemedText themeColor="textSecondary" style={styles.infoLabel}>
        {label}
      </ThemedText>
      <ThemedText style={styles.infoValue}>{value}</ThemedText>
    </View>
  );
}

function Divider() {
  const colors = useTheme();
  return <View style={[styles.divider, { backgroundColor: colors.divider }]} />;
}

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.large,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.four,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '800',
  },
  profileContent: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
  },
  profileMeta: {
    fontSize: 11,
    lineHeight: 16,
  },
  role: {
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '800',
    marginTop: Spacing.one,
  },
  sectionTitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800',
    marginTop: Spacing.two,
  },
  listCard: {
    borderRadius: Radius.large,
    borderWidth: 1,
    paddingHorizontal: Spacing.four,
  },
  infoRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.four,
  },
  infoLabel: {
    fontSize: 11,
    lineHeight: 16,
  },
  infoValue: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '700',
    textAlign: 'right',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  studentRow: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  studentAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentInitial: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  studentContent: {
    flex: 1,
  },
  studentName: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  studentMeta: {
    fontSize: 10,
    lineHeight: 15,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: Radius.large,
    padding: Spacing.one,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    borderRadius: Radius.medium,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentLabel: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '800',
  },
  privacyCard: {
    borderRadius: Radius.large,
    borderWidth: 1,
    padding: Spacing.four,
  },
  privacyTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '800',
  },
  privacyText: {
    fontSize: 11,
    lineHeight: 18,
    marginTop: Spacing.two,
  },
  privacyButton: {
    minHeight: 44,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.four,
  },
  privacyButtonLabel: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.74,
  },
  signOutButton: {
    minHeight: 46,
    borderRadius: Radius.medium,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  signOutLabel: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
  },
  demoNotice: {
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: Spacing.two,
  },
});
