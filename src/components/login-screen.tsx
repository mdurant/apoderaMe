import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '@/components/session-provider';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { demoAccounts, demoSchool } from '@/data/demo';
import type { AppAccess } from '@/domain/models';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { maskRut } from '@/utils/chile';

const accessOptions: { access: AppAccess; label: string; description: string }[] = [
  {
    access: 'apoderado',
    label: 'Apoderado',
    description: 'Asistencias, cuotas y actividades de tus estudiantes.',
  },
  {
    access: 'directiva',
    label: 'Directiva',
    description: 'Tesorería, pagos y gestión de actividades del curso.',
  },
  {
    access: 'colegio',
    label: 'Colegio',
    description: 'Administración general, cursos y supervisión.',
  },
];

type LoginMode = 'qa' | 'demo';

export function LoginScreen() {
  const colors = useTheme();
  const { signInDemo, signInWithPassword, isSupabaseEnabled } = useSession();
  const [loginMode, setLoginMode] = useState<LoginMode>(isSupabaseEnabled ? 'qa' : 'demo');
  const [selectedAccess, setSelectedAccess] = useState<AppAccess>('apoderado');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedAccount =
    demoAccounts.find((account) => account.access === selectedAccess) ?? demoAccounts[0];
  const selectedOption = accessOptions.find((option) => option.access === selectedAccess);

  const handleQaSignIn = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await signInWithPassword(email, password);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo iniciar sesión');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}>
          <View style={[styles.logo, { backgroundColor: colors.primary }]}>
            <ThemedText style={[styles.logoText, { color: colors.textInverse }]}>A</ThemedText>
          </View>
          <ThemedText style={styles.brand}>ApoderaMe</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.tagline}>
            Tu comunidad escolar, más cerca
          </ThemedText>

          <ThemedView type="surface" style={[styles.card, { borderColor: colors.border }]}>
            <ThemedText style={styles.title}>Ingresa a tu cuenta</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.subtitle}>
              {isSupabaseEnabled
                ? 'Usa una cuenta QA de Supabase Auth o explora la demo visual.'
                : 'Selecciona un perfil para explorar la demostración.'}
            </ThemedText>

            {isSupabaseEnabled ? (
              <View style={[styles.accessSelector, { backgroundColor: colors.backgroundElement }]}>
                {([
                  { mode: 'qa' as const, label: 'Cuenta QA' },
                  { mode: 'demo' as const, label: 'Demo visual' },
                ]).map((option) => {
                  const selected = loginMode === option.mode;
                  return (
                    <Pressable
                      key={option.mode}
                      accessibilityRole="tab"
                      accessibilityState={{ selected }}
                      onPress={() => {
                        setLoginMode(option.mode);
                        setErrorMessage(null);
                      }}
                      style={[
                        styles.accessOption,
                        selected && {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                        },
                      ]}>
                      <ThemedText
                        themeColor={selected ? 'primary' : 'textSecondary'}
                        style={styles.accessLabel}>
                        {option.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {loginMode === 'qa' && isSupabaseEnabled ? (
              <>
                <View style={styles.fieldGroup}>
                  <ThemedText themeColor="textSecondary" style={styles.fieldLabel}>
                    Correo QA
                  </ThemedText>
                  <TextInput
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    placeholder="qa+apoderado@tu-dominio.cl"
                    placeholderTextColor={colors.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    style={[
                      styles.textField,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <ThemedText themeColor="textSecondary" style={styles.fieldLabel}>
                    Contraseña
                  </ThemedText>
                  <TextInput
                    secureTextEntry
                    autoComplete="password"
                    placeholder="Contraseña del usuario QA"
                    placeholderTextColor={colors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    style={[
                      styles.textField,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                  />
                </View>

                <ThemedText themeColor="textSecondary" style={styles.authHint}>
                  Debes haber completado los pasos 7 y 8 del README: usuario en Auth, perfil en
                  `profiles`, membresías/roles y vínculo apoderado–estudiante.
                </ThemedText>

                {errorMessage ? (
                  <ThemedText style={[styles.errorText, { color: colors.negative }]}>
                    {errorMessage}
                  </ThemedText>
                ) : null}

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Ingresar con cuenta QA"
                  disabled={isSubmitting || !email.trim() || !password}
                  onPress={() => void handleQaSignIn()}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    { backgroundColor: colors.primary },
                    (pressed || isSubmitting) && styles.pressed,
                    (isSubmitting || !email.trim() || !password) && styles.disabled,
                  ]}>
                  {isSubmitting ? (
                    <ActivityIndicator color={colors.textInverse} />
                  ) : (
                    <ThemedText style={[styles.primaryButtonText, { color: colors.textInverse }]}>
                      Ingresar con Supabase
                    </ThemedText>
                  )}
                </Pressable>
              </>
            ) : (
              <>
                <View style={[styles.accessSelector, { backgroundColor: colors.backgroundElement }]}>
                  {accessOptions.map((option) => {
                    const selected = option.access === selectedAccess;
                    return (
                      <Pressable
                        key={option.access}
                        accessibilityRole="tab"
                        accessibilityState={{ selected }}
                        onPress={() => setSelectedAccess(option.access)}
                        style={[
                          styles.accessOption,
                          selected && {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                          },
                        ]}>
                        <ThemedText
                          themeColor={selected ? 'primary' : 'textSecondary'}
                          style={styles.accessLabel}>
                          {option.label}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>

                <ThemedText themeColor="textSecondary" style={styles.accessDescription}>
                  {selectedOption?.description}
                </ThemedText>

                <View style={[styles.demoIdentity, { backgroundColor: colors.backgroundElement }]}>
                  <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
                    <ThemedText themeColor="primary" style={styles.avatarText}>
                      {selectedAccount.initials}
                    </ThemedText>
                  </View>
                  <View style={styles.identityContent}>
                    <ThemedText style={styles.identityName}>
                      {selectedAccount.firstName} {selectedAccount.paternalSurname}
                    </ThemedText>
                    <ThemedText themeColor="textSecondary" style={styles.identityRole}>
                      {selectedAccount.roleLabel}
                    </ThemedText>
                  </View>
                  <View style={[styles.demoBadge, { backgroundColor: colors.positiveSoft }]}>
                    <ThemedText style={[styles.demoBadgeText, { color: colors.positive }]}>
                      DEMO
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <ThemedText themeColor="textSecondary" style={styles.fieldLabel}>
                    {selectedAccess === 'apoderado' ? 'RUT' : 'Correo de acceso'}
                  </ThemedText>
                  <View
                    accessibilityLabel={
                      selectedAccess === 'apoderado'
                        ? `RUT demo ${maskRut(selectedAccount.rut)}`
                        : `Correo demo ${selectedAccount.email}`
                    }
                    style={[
                      styles.readOnlyField,
                      { backgroundColor: colors.background, borderColor: colors.border },
                    ]}>
                    <ThemedText style={styles.fieldValue}>
                      {selectedAccess === 'apoderado'
                        ? maskRut(selectedAccount.rut)
                        : selectedAccount.email}
                    </ThemedText>
                  </View>
                </View>

                <ThemedText themeColor="textSecondary" style={styles.authHint}>
                  En producción enviaremos un código de un solo uso al contacto verificado. El RUT
                  identifica la cuenta, pero nunca funciona como contraseña.
                </ThemedText>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Ingresar a la demo de ${selectedAccount.roleLabel}`}
                  onPress={() => signInDemo(selectedAccount.id)}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    { backgroundColor: colors.primary },
                    pressed && styles.pressed,
                  ]}>
                  <ThemedText style={[styles.primaryButtonText, { color: colors.textInverse }]}>
                    Ingresar a esta demo
                  </ThemedText>
                </Pressable>
              </>
            )}
          </ThemedView>

          <ThemedText themeColor="textSecondary" style={styles.school}>
            {demoSchool.name} · {demoSchool.commune}
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.disclaimer}>
            {loginMode === 'qa'
              ? 'La cuenta QA usa PostgreSQL real con RLS. Los datos demo siguen siendo ficticios.'
              : 'Las tres cuentas demo y todos sus datos son ficticios. No se realiza autenticación real.'}
          </ThemedText>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    flexGrow: 1,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
  },
  logo: {
    width: 58,
    height: 58,
    borderRadius: Radius.large,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
  },
  brand: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '900',
    letterSpacing: -0.8,
    marginTop: Spacing.three,
  },
  tagline: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: Spacing.half,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    borderRadius: Radius.xLarge,
    borderWidth: 1,
    padding: Spacing.five,
    marginTop: Spacing.six,
  },
  title: {
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: Spacing.one,
  },
  accessSelector: {
    flexDirection: 'row',
    borderRadius: Radius.large,
    padding: Spacing.one,
    marginTop: Spacing.five,
  },
  accessOption: {
    flex: 1,
    minHeight: 44,
    borderRadius: Radius.medium,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.one,
  },
  accessLabel: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '800',
  },
  accessDescription: {
    minHeight: 38,
    fontSize: 12,
    lineHeight: 18,
    marginTop: Spacing.three,
  },
  demoIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.large,
    padding: Spacing.three,
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
  },
  identityContent: {
    flex: 1,
  },
  identityName: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  identityRole: {
    fontSize: 11,
    lineHeight: 16,
  },
  demoBadge: {
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  demoBadgeText: {
    fontSize: 9,
    lineHeight: 13,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  fieldGroup: {
    marginTop: Spacing.four,
  },
  fieldLabel: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
    marginBottom: Spacing.one,
  },
  readOnlyField: {
    minHeight: 48,
    borderRadius: Radius.medium,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  textField: {
    minHeight: 48,
    borderRadius: Radius.medium,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  fieldValue: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  authHint: {
    fontSize: 11,
    lineHeight: 17,
    marginTop: Spacing.three,
  },
  errorText: {
    fontSize: 11,
    lineHeight: 17,
    marginTop: Spacing.three,
    fontWeight: '700',
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.five,
  },
  primaryButtonText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.5,
  },
  school: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
    marginTop: Spacing.five,
  },
  disclaimer: {
    maxWidth: 520,
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: Spacing.one,
  },
});
