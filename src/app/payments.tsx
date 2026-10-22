import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { StatusBadge } from '@/components/ui/status-badge';
import { useSession } from '@/components/session-provider';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { AppAccess, FeeWithStudent, PaymentStatus } from '@/domain/models';
import { Radius, Spacing } from '@/constants/theme';
import { useFees } from '@/hooks/use-fees';
import { usePendingPayments } from '@/hooks/use-pending-payments';
import { useTheme } from '@/hooks/use-theme';
import {
  createPaymentInReview,
  remainingAmount,
  reviewPayment,
} from '@/repositories/payments';
import { submitPaymentWithReceipt } from '@/repositories/receipts';
import { formatChileDate, formatClp } from '@/utils/chile';
import { pickReceiptFile } from '@/utils/pick-receipt-file';
import { confirmUserAction, showUserMessage } from '@/utils/user-message';

const statusCopy: Record<
  PaymentStatus,
  { label: string; tone: 'positive' | 'negative' | 'warning' | 'neutral' }
> = {
  pendiente: { label: 'Pendiente', tone: 'warning' },
  parcial: { label: 'Pago parcial', tone: 'warning' },
  en_revision: { label: 'En revisión', tone: 'neutral' },
  pagado: { label: 'Pagado', tone: 'positive' },
  rechazado: { label: 'Rechazado', tone: 'negative' },
};

export default function PaymentsScreen() {
  const colors = useTheme();
  const { session } = useSession();
  const access = session!.account.access;
  const { fees, loading, error, refresh } = useFees();
  const {
    payments: pendingPayments,
    loading: pendingLoading,
    error: pendingError,
    refresh: refreshPending,
  } = usePendingPayments();

  const pendingTotal = fees.reduce(
    (total, fee) => total + remainingAmount(fee),
    0,
  );

  const handleRefreshAll = async () => {
    await Promise.all([refresh(), refreshPending()]);
  };

  return (
    <Screen
      title="Pagos"
      subtitle={
        access === 'apoderado'
          ? 'Cuotas, abonos y comprobantes de tus cursos.'
          : access === 'directiva'
            ? 'Revisa la recaudación y los comprobantes del curso.'
            : 'Supervisa el estado financiero informado por cada curso.'
      }>
      <ThemedView
        type="surfaceStrong"
        style={[styles.balanceCard, { shadowColor: colors.shadow }]}>
        <ThemedText style={[styles.balanceLabel, { color: colors.textInverse }]}>
          TOTAL PENDIENTE
        </ThemedText>
        <ThemedText style={[styles.balanceValue, { color: colors.textInverse }]}>
          {formatClp(pendingTotal)}
        </ThemedText>
        <ThemedText style={[styles.balanceDetail, { color: colors.textInverse }]}>
          {fees.length} cobros visibles · {session!.mode === 'supabase' ? 'PostgreSQL' : 'Demo'}
        </ThemedText>
      </ThemedView>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}

      {error ? (
        <ThemedView type="backgroundElement" style={styles.messageCard}>
          <ThemedText style={[styles.messageTitle, { color: colors.negative }]}>{error}</ThemedText>
          <Pressable accessibilityRole="button" onPress={() => void refresh()}>
            <ThemedText themeColor="primary" style={styles.retryLabel}>
              Reintentar
            </ThemedText>
          </Pressable>
        </ThemedView>
      ) : null}

      {access === 'directiva' ? (
        <>
          <View style={styles.sectionHeading}>
            <ThemedText style={styles.sectionTitle}>Pagos en revisión</ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.count}>
              {pendingPayments.length} pendientes
            </ThemedText>
          </View>

          {pendingLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null}

          {pendingError ? (
            <ThemedText style={[styles.inlineError, { color: colors.negative }]}>
              {pendingError}
            </ThemedText>
          ) : null}

          {pendingPayments.map((payment) => (
            <PendingPaymentCard
              key={payment.id}
              payment={payment}
              mode={session!.mode}
              onReviewed={handleRefreshAll}
            />
          ))}

          {!pendingLoading && pendingPayments.length === 0 ? (
            <ThemedView type="backgroundElement" style={styles.messageCard}>
              <ThemedText themeColor="textSecondary" style={styles.messageText}>
                No hay pagos esperando revisión de tesorería.
              </ThemedText>
            </ThemedView>
          ) : null}
        </>
      ) : null}

      <View style={styles.sectionHeading}>
        <ThemedText style={styles.sectionTitle}>Cobros del mes</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.count}>
          {fees.length} cobros
        </ThemedText>
      </View>

      {fees.map((fee) => (
        <FeeCard
          key={fee.id}
          fee={fee}
          access={access}
          mode={session!.mode}
          userId={session!.account.id}
          onUpdated={handleRefreshAll}
        />
      ))}

      {!loading && fees.length === 0 && !error ? (
        <ThemedView type="backgroundElement" style={styles.messageCard}>
          <ThemedText themeColor="textSecondary" style={styles.messageText}>
            {session!.mode === 'supabase'
              ? 'No hay cuotas visibles para tu cuenta. Verifica el vínculo apoderado–estudiante y las políticas RLS.'
              : 'No hay cuotas demo disponibles.'}
          </ThemedText>
        </ThemedView>
      ) : null}

      <ThemedView type="backgroundElement" style={styles.securityNotice}>
        <ThemedText style={styles.securityTitle}>Tus comprobantes están protegidos</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.securityText}>
          Los archivos se guardan en el bucket privado `payment-receipts` con ruta
          `{`{colegio}/{curso}/{pago}/{uuid}.pdf`}` y acceso restringido por RLS.
        </ThemedText>
      </ThemedView>
    </Screen>
  );
}

function FeeCard({
  fee,
  access,
  mode,
  userId,
  onUpdated,
}: {
  fee: FeeWithStudent;
  access: AppAccess;
  mode: 'demo' | 'supabase';
  userId: string;
  onUpdated: () => Promise<void>;
}) {
  const colors = useTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const pending = remainingAmount(fee);
  const progress = fee.totalAmount > 0 ? fee.paidAmount / fee.totalAmount : 0;
  const copy = statusCopy[fee.status];
  const actionLabel =
    access === 'apoderado'
      ? 'Subir comprobante'
      : access === 'directiva'
        ? 'Revisar pagos'
        : 'Ver detalle';

  const handleUploadReceipt = async () => {
    setStatusMessage(null);

    if (access !== 'apoderado') {
      showUserMessage(actionLabel, 'Esta acción está disponible solo para apoderados.');
      return;
    }

    if (pending <= 0) {
      showUserMessage('Sin saldo pendiente', 'Esta cuota no tiene monto por regularizar.');
      return;
    }

    if (mode === 'demo') {
      showUserMessage(
        'Modo demo',
        'Para subir comprobantes reales, ingresa con Cuenta QA en el login (Supabase Auth).',
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const picked = await pickReceiptFile();
      if (!picked) {
        return;
      }

      const paymentId = await createPaymentInReview(mode, {
        feeId: fee.id,
        amount: pending,
        reference: `Comprobante ${picked.name}`,
        userId,
      });

      await submitPaymentWithReceipt(mode, {
        fee,
        paymentId,
        userId,
        fileUri: picked.uri,
        fileName: picked.name,
        mimeType: picked.mimeType,
        sizeBytes: picked.sizeBytes,
        file: picked.file,
      });

      await onUpdated();

      const successMessage =
        'El pago quedó en revisión. La tesorería lo validará desde PostgreSQL.';
      setStatusMessage(successMessage);
      showUserMessage('Comprobante enviado', successMessage);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ocurrió un error inesperado.';
      setStatusMessage(message);
      showUserMessage('No se pudo enviar', message);
      console.error('[pagos] Error al subir comprobante:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView type="surface" style={[styles.feeCard, { borderColor: colors.border }]}>
      <View style={styles.feeHeader}>
        <View style={styles.feeHeading}>
          <ThemedText themeColor="primary" style={styles.student}>
            {fee.studentName} · {fee.courseName}
          </ThemedText>
          <ThemedText style={styles.concept}>{fee.concept}</ThemedText>
        </View>
        <StatusBadge label={copy.label} tone={copy.tone} />
      </View>

      <View style={styles.amountRow}>
        <View>
          <ThemedText themeColor="textSecondary" style={styles.amountLabel}>
            Total
          </ThemedText>
          <ThemedText style={styles.amount}>{formatClp(fee.totalAmount)}</ThemedText>
        </View>
        <View style={styles.alignRight}>
          <ThemedText themeColor="textSecondary" style={styles.amountLabel}>
            Saldo
          </ThemedText>
          <ThemedText style={[styles.amount, pending > 0 && { color: colors.negative }]}>
            {formatClp(pending)}
          </ThemedText>
        </View>
      </View>

      <View style={[styles.progressTrack, { backgroundColor: colors.backgroundElement }]}>
        <View
          style={[
            styles.progressValue,
            {
              width: `${Math.round(progress * 100)}%`,
              backgroundColor: fee.status === 'pagado' ? colors.positive : colors.primary,
            },
          ]}
        />
      </View>

      <View style={styles.feeFooter}>
        <ThemedText themeColor="textSecondary" style={styles.dueDate}>
          Vence el {formatChileDate(fee.dueDate)}
        </ThemedText>
        {fee.status !== 'pagado' && access === 'apoderado' ? (
          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={() => void handleUploadReceipt()}
            style={({ pressed }) => [
              styles.uploadButton,
              { backgroundColor: colors.primary },
              (pressed || isSubmitting) && styles.pressed,
            ]}>
            {isSubmitting ? (
              <ActivityIndicator color={colors.textInverse} size="small" />
            ) : (
              <ThemedText style={[styles.uploadLabel, { color: colors.textInverse }]}>
                {actionLabel}
              </ThemedText>
            )}
          </Pressable>
        ) : null}
      </View>
      {statusMessage ? (
        <ThemedText
          style={[
            styles.inlineStatus,
            { color: statusMessage.includes('revisión') ? colors.positive : colors.negative },
          ]}>
          {statusMessage}
        </ThemedText>
      ) : null}
    </ThemedView>
  );
}

function PendingPaymentCard({
  payment,
  mode,
  onReviewed,
}: {
  payment: {
    id: string;
    studentName: string;
    courseName: string;
    concept: string;
    amount: number;
    reference: string;
  };
  mode: 'demo' | 'supabase';
  onReviewed: () => Promise<void>;
}) {
  const colors = useTheme();
  const [isReviewing, setIsReviewing] = useState(false);

  const handleReview = (approve: boolean) => {
    confirmUserAction(
      approve ? 'Aprobar pago' : 'Rechazar pago',
      approve
        ? `¿Confirmas la aprobación de ${formatClp(payment.amount)}?`
        : 'Se rechazará el comprobante con un motivo genérico.',
      approve ? 'Aprobar' : 'Rechazar',
      () => {
        void (async () => {
          setIsReviewing(true);
          try {
            await reviewPayment(
              mode,
              payment.id,
              approve,
              approve ? undefined : 'El comprobante no coincide con el monto informado',
            );
            await onReviewed();
            showUserMessage(
              approve ? 'Pago aprobado' : 'Pago rechazado',
              approve
                ? 'La cuota se recalculó en PostgreSQL.'
                : 'El apoderado podrá enviar un nuevo comprobante.',
            );
          } catch (error) {
            showUserMessage(
              'No se pudo revisar',
              error instanceof Error ? error.message : 'Error inesperado.',
            );
          } finally {
            setIsReviewing(false);
          }
        })();
      },
      !approve,
    );
  };

  return (
    <ThemedView type="surface" style={[styles.feeCard, { borderColor: colors.border }]}>
      <ThemedText themeColor="primary" style={styles.student}>
        {payment.studentName} · {payment.courseName}
      </ThemedText>
      <ThemedText style={styles.concept}>{payment.concept}</ThemedText>
      <ThemedText style={styles.amount}>{formatClp(payment.amount)}</ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.dueDate}>
        Referencia: {payment.reference}
      </ThemedText>
      <View style={styles.reviewActions}>
        <Pressable
          accessibilityRole="button"
          disabled={isReviewing}
          onPress={() => handleReview(false)}
          style={({ pressed }) => [
            styles.rejectButton,
            { borderColor: colors.negative },
            pressed && styles.pressed,
          ]}>
          <ThemedText style={{ color: colors.negative, fontWeight: '800', fontSize: 10 }}>
            Rechazar
          </ThemedText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={isReviewing}
          onPress={() => handleReview(true)}
          style={({ pressed }) => [
            styles.uploadButton,
            { backgroundColor: colors.positive, flex: 1 },
            pressed && styles.pressed,
          ]}>
          {isReviewing ? (
            <ActivityIndicator color={colors.textInverse} size="small" />
          ) : (
            <ThemedText style={[styles.uploadLabel, { color: colors.textInverse }]}>
              Aprobar
            </ThemedText>
          )}
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  balanceCard: {
    borderRadius: Radius.xLarge,
    padding: Spacing.five,
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  balanceLabel: {
    fontSize: 9,
    lineHeight: 13,
    fontWeight: '800',
    letterSpacing: 1.2,
    opacity: 0.7,
  },
  balanceValue: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '800',
    letterSpacing: -1,
    marginTop: Spacing.one,
  },
  balanceDetail: {
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
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.four,
  },
  messageCard: {
    borderRadius: Radius.large,
    padding: Spacing.four,
    marginTop: Spacing.two,
    gap: Spacing.two,
  },
  messageTitle: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
  },
  messageText: {
    fontSize: 11,
    lineHeight: 17,
  },
  retryLabel: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '800',
  },
  inlineError: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: Spacing.one,
  },
  feeCard: {
    borderRadius: Radius.large,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.four,
    marginTop: Spacing.two,
  },
  feeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  feeHeading: {
    flex: 1,
  },
  student: {
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  concept: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '800',
    marginTop: Spacing.half,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  amountLabel: {
    fontSize: 10,
    lineHeight: 15,
  },
  amount: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  progressTrack: {
    height: 7,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  progressValue: {
    height: '100%',
    borderRadius: Radius.pill,
  },
  feeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  dueDate: {
    flex: 1,
    fontSize: 10,
    lineHeight: 15,
  },
  inlineStatus: {
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '700',
  },
  uploadButton: {
    minHeight: 38,
    borderRadius: Radius.medium,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
  },
  uploadLabel: {
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '800',
  },
  reviewActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  rejectButton: {
    minHeight: 38,
    borderRadius: Radius.medium,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.74,
  },
  securityNotice: {
    borderRadius: Radius.large,
    padding: Spacing.four,
    marginTop: Spacing.two,
  },
  securityTitle: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
  },
  securityText: {
    fontSize: 10,
    lineHeight: 16,
    marginTop: Spacing.one,
  },
});
