import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AppText from '../../../components/Text/AppText';
import PrimaryButton from '../../../components/buttons/PrimaryButton';
import Header from '../../../components/header/Header';
import { useTheme } from '../../../hooks/useTheme';
import { useSubscription } from '../../../hooks/useSubscription';
import {
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_TRIAL_DAYS,
  SUBSCRIPTION_TRIAL_TRIES_PER_DAY,
  getProductIdFromIapProduct,
} from '../../../constants/subscription';
import { Theme } from '../../../common/theme';
import { showErrMsg, showSuccessMsg } from '../../../utils/flashMessage';
import { subscriptionService } from '../../../services/subscriptionService';
import { store, useAppSelector } from '../../../features/store';
import { setError } from '../../../features/subscription/subscriptionSlice';
import { useCancelSubscriptionMutation } from '../../../features/subscription/subscriptionApiSlice';
import type { SubscriptionStatus } from '../../../features/subscription/types';
import {
  PRIVACY_POLICY_WEB_URL,
  TERMS_AND_CONDITIONS_URL,
  TERMS_OF_USE_EULA_URL,
} from '../../../common/legalUrls';

/** Opens Apple’s subscription management (Safari / account). */
const APPLE_SUBSCRIPTIONS_MANAGE_URL = 'https://apps.apple.com/account/subscriptions';

function isActivePlanRow(
  productId: string,
  planType: 'premium' | 'family',
  period: 'monthly' | 'annual',
  sub: SubscriptionStatus | null | undefined,
): boolean {
  if (!sub?.isActive) {
    return false;
  }
  if (sub.productId) {
    return sub.productId === productId;
  }
  return sub.planType === planType && sub.period === period;
}

const Subscription = () => {
  const { colors, spacing } = useTheme();
  const styles = useStyles(colors, spacing);
  const {
    products,
    plans: backendPlans,
    subscription,
    isLoading,
    error,
    isInitialized,
    purchaseSubscription,
    restorePurchases,
    refetchStatus,
    refreshAll,
    subscriptionStatusResolved,
  } = useSubscription();

  const hasActivePlan = Boolean(subscription?.isActive);

  const [cancelSubscription, { isLoading: isCancellingViaApi }] =
    useCancelSubscriptionMutation();

  useFocusEffect(
    useCallback(() => {
      void refetchStatus();
    }, [refetchStatus]),
  );

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  /** IAP purchase flow only (not plans query) — used to sync local spinner with StoreKit */
  const purchaseLoading = useAppSelector(
    state => state.subscription?.isLoading ?? false,
  );
  const prevPurchaseLoading = useRef(purchaseLoading);
  const purchaseFallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // Clear loader when Redux error is set (e.g. from purchase error listener)
  useEffect(() => {
    if (error) {
      if (purchaseFallbackTimeoutRef.current) {
        clearTimeout(purchaseFallbackTimeoutRef.current);
        purchaseFallbackTimeoutRef.current = null;
      }
      setIsPurchasing(false);
      setSelectedPlan(null);
    }
  }, [error]);

  // When user cancels/closes the StoreKit sheet, listener sets isLoading false without setting error
  useEffect(() => {
    const wasLoading = prevPurchaseLoading.current;
    prevPurchaseLoading.current = purchaseLoading;
    if (wasLoading && !purchaseLoading && isPurchasing) {
      if (purchaseFallbackTimeoutRef.current) {
        clearTimeout(purchaseFallbackTimeoutRef.current);
        purchaseFallbackTimeoutRef.current = null;
      }
      setIsPurchasing(false);
      setSelectedPlan(null);
    }
  }, [purchaseLoading, isPurchasing]);

  // Capture console logs for debugging
  useEffect(() => {
    if (__DEV__) {
      const originalLog = console.log;
      const originalError = console.error;
      const originalWarn = console.warn;
      
      const addLog = (prefix: string, args: any[]) => {
        const logMessage = args.map(arg => {
          if (typeof arg === 'object') {
            try {
              return JSON.stringify(arg, null, 2);
            } catch {
              return String(arg);
            }
          }
          return String(arg);
        }).join(' ');
        
        if (
          logMessage.toLowerCase().includes('purchase') || 
          logMessage.toLowerCase().includes('subscription') ||
          logMessage.toLowerCase().includes('iap') ||
          logMessage.toLowerCase().includes('receipt') ||
          logMessage.toLowerCase().includes('transaction') ||
          logMessage.toLowerCase().includes('product')
        ) {
          const timestamp = new Date().toLocaleTimeString();
          setDebugLogs(prev => [...prev.slice(-19), `[${timestamp}] ${prefix} ${logMessage}`]);
        }
      };
      
      console.log = (...args: any[]) => {
        originalLog(...args);
        addLog('[LOG]', args);
      };
      
      console.error = (...args: any[]) => {
        originalError(...args);
        addLog('[ERROR]', args);
      };
      
      console.warn = (...args: any[]) => {
        originalWarn(...args);
        addLog('[WARN]', args);
      };
      
      return () => {
        console.log = originalLog;
        console.error = originalError;
        console.warn = originalWarn;
      };
    }
  }, []);

  // Get product price from Apple (if available)
  const getProductPrice = (productId: string): string => {
    const product = products.find((p: any) => {
      return getProductIdFromIapProduct(p) === productId;
    });
    
    if (product) {
      // Get price from product (handle both iOS and Android types)
      const price = (product as any).localizedPrice || (product as any).price;
      if (price) {
        return price;
      }
    }
    
    // Fallback to configured price
    const plan = SUBSCRIPTION_PLANS.find(p => p.productId === productId);
    return plan?.priceFormatted || '';
  };

  /** Product IDs returned by App Store (StoreKit) — only these may be purchased */
  const availableStoreProductIds = useMemo(() => {
    const ids = new Set<string>();
    for (const p of products) {
      const id = getProductIdFromIapProduct(p as any);
      if (id) {
        ids.add(id);
      }
    }
    return ids;
  }, [products]);

  const premiumPlansFromStore = useMemo(
    () =>
      SUBSCRIPTION_PLANS.filter(
        plan => plan.type === 'premium' && availableStoreProductIds.has(plan.productId),
      ),
    [availableStoreProductIds],
  );

  const familyPlansFromStore = useMemo(
    () =>
      SUBSCRIPTION_PLANS.filter(
        plan => plan.type === 'family' && availableStoreProductIds.has(plan.productId),
      ),
    [availableStoreProductIds],
  );

  /** When StoreKit returns no products (sandbox delay, etc.), still list plans from GET /plans or local config */
  const premiumPlansToShow = useMemo(() => {
    if (Platform.OS !== 'ios') {
      return [];
    }
    if (premiumPlansFromStore.length > 0) {
      return premiumPlansFromStore;
    }
    const ids = backendPlans
      .filter(b => b.plan_type === 'premium')
      .map(b => b.product_id);
    if (ids.length > 0) {
      return SUBSCRIPTION_PLANS.filter(
        p => p.type === 'premium' && ids.includes(p.productId),
      );
    }
    return SUBSCRIPTION_PLANS.filter(p => p.type === 'premium');
  }, [premiumPlansFromStore, backendPlans]);

  const familyPlansToShow = useMemo(() => {
    if (Platform.OS !== 'ios') {
      return [];
    }
    if (familyPlansFromStore.length > 0) {
      return familyPlansFromStore;
    }
    const ids = backendPlans
      .filter(b => b.plan_type === 'family')
      .map(b => b.product_id);
    if (ids.length > 0) {
      return SUBSCRIPTION_PLANS.filter(
        p => p.type === 'family' && ids.includes(p.productId),
      );
    }
    return SUBSCRIPTION_PLANS.filter(p => p.type === 'family');
  }, [familyPlansFromStore, backendPlans]);

  const getDisplayPrice = (productId: string) => {
    const fromStore = getProductPrice(productId);
    if (fromStore) {
      return fromStore;
    }
    const bp = backendPlans.find(p => p.product_id === productId);
    if (bp?.price_display?.trim()) {
      return bp.price_display;
    }
    return (
      SUBSCRIPTION_PLANS.find(p => p.productId === productId)?.priceFormatted || '—'
    );
  };

  const alertMustCancelExistingFirst = useCallback(() => {
    Alert.alert(
      'You already have a subscription',
      'To change plans, cancel your current subscription first (tap “Cancel subscription”). After it ends or from Apple’s subscription settings, you can choose a different plan.',
      [{ text: 'OK' }],
    );
  }, []);

  const handlePurchase = async (productId: string) => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Not Available', 'Subscriptions are only available on iOS.');
      return;
    }

    const planMeta = SUBSCRIPTION_PLANS.find(p => p.productId === productId);
    if (subscription?.isActive && planMeta) {
      const isThisPlan = isActivePlanRow(
        productId,
        planMeta.type,
        planMeta.period,
        subscription,
      );
      if (!isThisPlan) {
        alertMustCancelExistingFirst();
        return;
      }
      return;
    }

    let canPurchaseFromStore = availableStoreProductIds.has(productId);
    if (!canPurchaseFromStore) {
      await refreshAll();
      try {
        const fresh = await subscriptionService.getAvailableProducts();
        canPurchaseFromStore = fresh.some(
          p => getProductIdFromIapProduct(p as any) === productId,
        );
      } catch {
        canPurchaseFromStore = false;
      }
    }
    if (!canPurchaseFromStore) {
      showErrMsg(
        'This plan is not available from the App Store yet. Pull down to refresh or try again in a moment.',
      );
      return;
    }

    // Clear any previous errors
    store.dispatch(setError(null));

    // Don't block if not initialized - let iOS handle it
    if (!isInitialized) {
      // Try to initialize quickly
      try {
        const initialized = await subscriptionService.initialize();
        if (!initialized) {
          // Still try purchase - iOS might handle it
        }
      } catch (e) {
        // Continue anyway
      }
    }

    try {
      setIsPurchasing(true);
      setSelectedPlan(productId);
      
      // Always attempt purchase - let iOS handle product availability
      // iOS will show its own error if product doesn't exist
      // This is better for review/testing scenarios
      await purchaseSubscription(productId);
      // Don't show success here - wait for purchase listener
      // The purchase dialog will appear from iOS
      // Fallback: clear loader after 15s if nothing happened (e.g. purchase dialog never appears or error not thrown)
      if (purchaseFallbackTimeoutRef.current) {
        clearTimeout(purchaseFallbackTimeoutRef.current);
      }
      purchaseFallbackTimeoutRef.current = setTimeout(() => {
        purchaseFallbackTimeoutRef.current = null;
        setIsPurchasing(false);
        setSelectedPlan(null);
      }, 15000);
    } catch (error: any) {
      console.error('Purchase error in handlePurchase:', error);
      const errorMsg = error?.message || 'Failed to purchase subscription';
      // Always clear loader on any purchase error
      setIsPurchasing(false);
      setSelectedPlan(null);
      // Only show error for critical failures (not cancellations or product unavailable)
      if (
        !errorMsg.includes('cancelled') &&
        !errorMsg.includes('canceled') &&
        !errorMsg.includes('not available') &&
        !errorMsg.includes('not configured') &&
        !errorMsg.includes('not found') &&
        !errorMsg.includes('Missing purchase request configuration') &&
        !errorMsg.includes('Unable to start purchase')
      ) {
        showErrMsg(errorMsg);
      }
    }
  };

  const handleRestore = async () => {
    try {
      setIsPurchasing(true);
      await restorePurchases();
      showSuccessMsg('Purchases restored successfully!');
    } catch (error: any) {
      console.error('Restore error:', error);
      showErrMsg(error.message || 'Failed to restore purchases');
    } finally {
      setIsPurchasing(false);
    }
  };

  const getCurrentPlanDisplay = () => {
    if (!subscription?.isActive) {
      return 'No active subscription';
    }
    const planType = subscription.planType === 'premium' ? 'Premium' : 'Family';
    const period = subscription.period === 'monthly' ? 'Monthly' : 'Annual';
    return `${planType} · ${period}`;
  };

  const formatDateTimeLocal = (iso: string | null | undefined) => {
    if (!iso) {
      return '—';
    }
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return iso;
    }
    return d.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const onRefresh = useCallback(async () => {
    setIsPullRefreshing(true);
    try {
      await refreshAll();
    } catch (e) {
      console.error('Subscription pull-to-refresh failed', e);
    } finally {
      setIsPullRefreshing(false);
    }
  }, [refreshAll]);

  const openManageSubscription = async () => {
    if (Platform.OS !== 'ios') {
      return;
    }
    try {
      const res = await cancelSubscription().unwrap();
      const url = res?.manageSubscriptionUrl;
      if (url) {
        const ok = await Linking.canOpenURL(url);
        if (ok) {
          await Linking.openURL(url);
        }
        return;
      }
    } catch (e) {
      console.warn('Cancel subscription API failed, using fallback URL', e);
    }
    await Linking.openURL(APPLE_SUBSCRIPTIONS_MANAGE_URL);
  };

  const confirmCancelSubscription = () => {
    Alert.alert(
      'Cancel subscription?',
      'We’ll open Apple’s subscription page next. Apple may ask you to finish cancellation in Settings → Subscriptions or in Safari — apps cannot cancel Apple billing directly.\n\nDo you want to continue?',
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => {
            void openManageSubscription();
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <Header />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.padding }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isPullRefreshing}
            onRefresh={onRefresh}
            tintColor={Platform.OS === 'ios' ? colors.primary : undefined}
            colors={Platform.OS === 'android' ? [colors.primary] : undefined}
          />
        }
      >
        <AppText
          variant="heading"
          fontWeight="semiBold"
          style={{ marginBottom: 8 }}
        >
          Subscription Plans
        </AppText>

        {Platform.OS === 'ios' && (
          <View style={[styles.statusCard, { marginBottom: 16 }]}>
            <AppText fontWeight="bold" style={{ marginBottom: 8 }}>
              Your subscription
            </AppText>
            {!subscriptionStatusResolved && (
              <AppText color={colors.caption}>Checking your plan…</AppText>
            )}
            {subscriptionStatusResolved && subscription?.isActive && (
              <>
                <View style={styles.subscriptionTitleRow}>
                  <AppText
                    color={colors.text}
                    fontWeight="semiBold"
                    style={{ flex: 1, flexShrink: 1 }}
                  >
                    {getCurrentPlanDisplay()}
                  </AppText>
                  <View style={styles.currentStatusBadge}>
                    <AppText size={11} color={colors.card} fontWeight="bold">
                      Current
                    </AppText>
                  </View>
                  {subscription.isTrial ? (
                    <View style={styles.trialStatusBadge}>
                      <AppText size={11} color={colors.card} fontWeight="bold">
                        Trial
                      </AppText>
                    </View>
                  ) : (
                    <View style={styles.paidStatusBadge}>
                      <AppText size={11} color={colors.card} fontWeight="bold">
                        Paid
                      </AppText>
                    </View>
                  )}
                </View>

                {subscription.isTrial && (
                  <>
                    {(subscription.trialDaysLeft != null ||
                      subscription.trialDays != null) && (
                      <AppText
                        size={13}
                        color={colors.text}
                        style={{ marginTop: 10, lineHeight: 20 }}
                      >
                        {subscription.trialDaysLeft != null && (
                          <>
                            {subscription.trialDaysLeft === 0
                              ? 'Last day of your trial.'
                              : `${subscription.trialDaysLeft} day${
                                  subscription.trialDaysLeft === 1 ? '' : 's'
                                } left in your trial.`}
                          </>
                        )}
                        {subscription.trialDays != null && (
                          <>
                            {subscription.trialDaysLeft != null ? ' ' : ''}
                            Intro period: {subscription.trialDays} day
                            {subscription.trialDays === 1 ? '' : 's'}.
                          </>
                        )}
                      </AppText>
                    )}
                    <AppText
                      size={12}
                      color={colors.caption}
                      style={{ marginTop: 8, lineHeight: 18 }}
                    >
                      Trial ends: {formatDateTimeLocal(subscription.expiresAt)}
                    </AppText>
                    <AppText
                      size={12}
                      color={colors.caption}
                      style={{ marginTop: 6, lineHeight: 18 }}
                    >
                      During trial: up to {SUBSCRIPTION_TRIAL_TRIES_PER_DAY} scans per UTC
                      day (server limit).
                    </AppText>
                  </>
                )}

                {!subscription.isTrial && (
                  <>
                    <AppText
                      size={13}
                      color={colors.text}
                      style={{ marginTop: 10, lineHeight: 20 }}
                    >
                      Your subscription renews automatically. You won’t lose access until
                      the end of the current period if you cancel.
                    </AppText>
                    {subscription.expiresAt ? (
                      <AppText
                        size={12}
                        color={colors.caption}
                        style={{ marginTop: 8, lineHeight: 18 }}
                      >
                        Next renewal: {formatDateTimeLocal(subscription.expiresAt)}
                      </AppText>
                    ) : null}
                  </>
                )}

                <PrimaryButton
                  title="Cancel subscription"
                  type="outlined"
                  loading={isCancellingViaApi}
                  disabled={isCancellingViaApi}
                  onPress={confirmCancelSubscription}
                  style={{ marginTop: 16 }}
                />
                <AppText
                  size={10}
                  color={colors.caption}
                  style={{ marginTop: 8, lineHeight: 15 }}
                >
                  Opens Apple’s subscription management. PetMood cannot cancel Apple
                  billing for you.
                </AppText>
              </>
            )}
            {subscriptionStatusResolved && !subscription?.isActive && (
              <AppText color={colors.caption}>
                No active subscription — you’re on the free tier. Choose a plan below to
                unlock premium.
              </AppText>
            )}
          </View>
        )}

        {/* Subscription Benefits Description */}
        <View style={styles.benefitsCard}>
          <AppText fontWeight="bold" style={{ marginBottom: 8 }}>
            What You Get:
          </AppText>
          <View style={styles.benefitItem}>
            <AppText style={styles.bullet}>•</AppText>
            <AppText style={styles.benefitText}>
              Unlimited pet emotion detection scans
            </AppText>
          </View>
          <View style={styles.benefitItem}>
            <AppText style={styles.bullet}>•</AppText>
            <AppText style={styles.benefitText}>
              Access to premium AI analysis features
            </AppText>
          </View>
          <View style={styles.benefitItem}>
            <AppText style={styles.bullet}>•</AppText>
            <AppText style={styles.benefitText}>
              Full scan history and pet profile management
            </AppText>
          </View>
          <View style={styles.benefitItem}>
            <AppText style={styles.bullet}>•</AppText>
            <AppText style={styles.benefitText}>
              Priority support and updates
            </AppText>
          </View>
          {subscription?.planType === 'family' && (
            <View style={styles.benefitItem}>
              <AppText style={styles.bullet}>•</AppText>
              <AppText style={styles.benefitText}>
                Support for up to 2 additional pets
              </AppText>
            </View>
          )}
        </View>

        {error && !error.includes('Unable to start purchase') && (
          <View style={[styles.statusCard, { backgroundColor: colors.danger + '20' }]}>
            <AppText color={colors.danger}>{error}</AppText>
          </View>
        )}

        {/* Debug Logs - Always show in Development */}
        {__DEV__ && (
          <View style={[styles.statusCard, { backgroundColor: '#00000020' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <AppText fontWeight="bold" size={12}>
                Debug Logs ({debugLogs.length}):
              </AppText>
              <TouchableOpacity
                onPress={() => setDebugLogs([])}
                style={{ padding: 4, paddingHorizontal: 8, backgroundColor: colors.primary + '20', borderRadius: 4 }}
              >
                <AppText size={10} color={colors.primary}>Clear</AppText>
              </TouchableOpacity>
            </View>
            {debugLogs.length === 0 ? (
              <AppText size={10} color={colors.caption} style={{ fontStyle: 'italic' }}>
                No logs yet. Tap a plan to see purchase logs here.
              </AppText>
            ) : (
              <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                {debugLogs.map((log, index) => (
                  <AppText 
                    key={index} 
                    size={10} 
                    style={{ 
                      marginBottom: 2, 
                      fontFamily: 'monospace',
                      color: log.includes('[ERROR]') ? colors.danger : colors.text
                    }}
                  >
                    {log}
                  </AppText>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {Platform.OS !== 'ios' && (
          <View style={[styles.statusCard, { backgroundColor: '#FFA50020' }]}>
            <AppText color="#FFA500">
              Subscriptions are only available on iOS devices.
            </AppText>
          </View>
        )}

        {/* Single place: free trial, billing, cancel (Apple) — plan cards stay short below */}
        {Platform.OS === 'ios' && (
          <View style={[styles.statusCard, styles.trialInfoCard]}>
            <AppText fontWeight="bold">Free trial &amp; billing</AppText>
            <AppText size={11} color={colors.caption} style={{ marginTop: 10, lineHeight: 18 }}>
              All plans include a {SUBSCRIPTION_TRIAL_DAYS}-day free trial for eligible new
              subscribers. During the trial you can use up to {SUBSCRIPTION_TRIAL_TRIES_PER_DAY}{' '}
              tries per day (scans). After the trial, the price shown on each plan
              applies each billing period until you cancel.{'\n\n'}
              • Cancel at least 24 hours before the trial ends if you don’t want to be
              charged; you can use premium features until the trial ends.{'\n'}
              • If you don’t cancel before the trial ends, your subscription renews
              automatically at the plan price until you cancel.{'\n'}
              • The introductory trial is available only once per eligible subscriber, per
              Apple’s rules.{'\n'}
              • To cancel: Settings → your name → Subscriptions → PetMood → Cancel
              Subscription.
            </AppText>
            <TouchableOpacity
              onPress={() => void openManageSubscription()}
              style={{ marginTop: 12 }}
              disabled={isCancellingViaApi}
            >
              {isCancellingViaApi ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <AppText size={13} color={colors.primary} fontWeight="semiBold">
                  Cancel or manage in App Store (opens Apple) →
                </AppText>
              )}
            </TouchableOpacity>
            <AppText
              size={10}
              color={colors.caption}
              style={{ marginTop: 6, lineHeight: 15 }}
            >
              This calls the server first (Apple does not allow apps to cancel
              subscriptions in-app). You will finish in Apple’s subscription
              settings in Safari.
            </AppText>
          </View>
        )}

        {/* StoreKit: optional notice — plans still show from server/local when store is empty */}
        {Platform.OS === 'ios' && !isInitialized && backendPlans.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <AppText style={{ marginTop: 16 }}>Loading plans…</AppText>
          </View>
        )}

        {Platform.OS === 'ios' &&
          isInitialized &&
          products.length === 0 &&
          premiumPlansToShow.length > 0 && (
            <View
              style={[
                styles.statusCard,
                { marginTop: 8, backgroundColor: colors.primary + '14' },
              ]}
            >
              <AppText fontWeight="bold" color={colors.primary} style={{ marginBottom: 6 }}>
                App Store prices pending
              </AppText>
              <AppText size={13} color={colors.text} style={{ lineHeight: 20 }}>
                The App Store has not returned product prices yet (common in sandbox or
                right after install). Plan options below still show — prices may come from
                the server or defaults until Apple responds. Pull down to refresh.
              </AppText>
            </View>
          )}

        {Platform.OS === 'ios' &&
          isInitialized &&
          products.length === 0 &&
          premiumPlansToShow.length === 0 &&
          familyPlansToShow.length === 0 && (
            <View
              style={[
                styles.statusCard,
                { marginTop: 16, backgroundColor: colors.danger + '14' },
              ]}
            >
              <AppText fontWeight="bold" color={colors.danger} style={{ marginBottom: 8 }}>
                Subscription plans unavailable
              </AppText>
              <AppText size={13} color={colors.text} style={{ lineHeight: 20 }}>
                We could not load plans from the App Store or the server. Check your
                connection and pull down to refresh.
              </AppText>
            </View>
          )}

        {Platform.OS === 'ios' &&
          isInitialized &&
          products.length > 0 &&
          premiumPlansFromStore.length === 0 &&
          familyPlansFromStore.length === 0 &&
          premiumPlansToShow.length === 0 &&
          familyPlansToShow.length === 0 && (
            <View
              style={[
                styles.statusCard,
                { marginTop: 16, backgroundColor: colors.danger + '14' },
              ]}
            >
              <AppText fontWeight="bold" color={colors.danger} style={{ marginBottom: 8 }}>
                Plan configuration mismatch
              </AppText>
              <AppText size={13} color={colors.text} style={{ lineHeight: 20 }}>
                The App Store returned products, but none match this app’s subscription
                IDs. Check that product identifiers in App Store Connect match the app
                configuration.
              </AppText>
            </View>
          )}

        {/* Premium Plans — from Store when available, else from GET /plans / local config */}
        {Platform.OS === 'ios' && premiumPlansToShow.length > 0 && (
            <>
        <AppText
          variant="subheading"
          fontWeight="bold"
          style={{ marginTop: 24, marginBottom: 16 }}
        >
          Premium Plan
        </AppText>

        {premiumPlansToShow.map(plan => {
          const isSelected = selectedPlan === plan.productId;
          const isCurrentPlan = isActivePlanRow(
            plan.productId,
            plan.type,
            plan.period,
            subscription,
          );
          const lockedOtherPlan = hasActivePlan && !isCurrentPlan;

          const cardBody = (
            <>
              <View style={styles.planHeader}>
                <View style={{ flex: 1 }}>
                  <View style={styles.planTitleRow}>
                    <AppText fontWeight="bold" size={18}>
                      {plan.period === 'monthly' ? 'Monthly' : 'Annual'}
                    </AppText>
                    {isCurrentPlan && (
                      <View style={styles.planCurrentPill}>
                        <AppText size={11} color={colors.card} fontWeight="bold">
                          Current
                        </AppText>
                      </View>
                    )}
                  </View>
                  <AppText color={colors.caption} size={13} style={{ marginTop: 2 }}>
                    Subscription: {plan.description}
                  </AppText>
                  <AppText color={colors.caption} size={12} style={{ marginTop: 6 }}>
                    Length: {plan.durationLabel} ·{' '}
                    {plan.period === 'monthly'
                      ? 'Billed monthly, auto-renews'
                      : 'Billed annually, auto-renews'}
                  </AppText>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <AppText fontWeight="bold" size={20} color={colors.primary}>
                    {getDisplayPrice(plan.productId)}
                  </AppText>
                  {!hasActivePlan && (
                    <AppText size={10} color={colors.caption} style={{ marginTop: 4 }}>
                      after trial
                    </AppText>
                  )}
                  {plan.period === 'annual' && (
                    <AppText size={12} color={colors.caption} style={{ marginTop: 2 }}>
                      Save 17%
                    </AppText>
                  )}
                </View>
              </View>
              {isSelected && isPurchasing && !lockedOtherPlan && (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                  style={{ marginTop: 12 }}
                />
              )}
            </>
          );

          if (isCurrentPlan) {
            return (
              <View
                key={plan.id}
                style={[styles.planCard, styles.currentPlanCard]}
              >
                {cardBody}
              </View>
            );
          }

          return (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                isSelected && styles.selectedPlanCard,
                lockedOtherPlan && styles.planCardDisabled,
              ]}
              activeOpacity={lockedOtherPlan ? 1 : 0.85}
              onPress={() => {
                if (lockedOtherPlan) {
                  alertMustCancelExistingFirst();
                  return;
                }
                void handlePurchase(plan.productId);
              }}
              disabled={isPurchasing}
            >
              {cardBody}
            </TouchableOpacity>
          );
        })}
            </>
          )}

        {/* Family Plans */}
        {Platform.OS === 'ios' && familyPlansToShow.length > 0 && (
            <>
        <AppText
          variant="subheading"
          fontWeight="bold"
          style={{ marginTop: 32, marginBottom: 16 }}
        >
          Family Plan (optional, +2 pets)
        </AppText>

        {familyPlansToShow.map(plan => {
          const isSelected = selectedPlan === plan.productId;
          const isCurrentPlan = isActivePlanRow(
            plan.productId,
            plan.type,
            plan.period,
            subscription,
          );
          const lockedOtherPlan = hasActivePlan && !isCurrentPlan;

          const cardBody = (
            <>
              <View style={styles.planHeader}>
                <View style={{ flex: 1 }}>
                  <View style={styles.planTitleRow}>
                    <AppText fontWeight="bold" size={18}>
                      {plan.period === 'monthly' ? 'Monthly' : 'Annual'}
                    </AppText>
                    {isCurrentPlan && (
                      <View style={styles.planCurrentPill}>
                        <AppText size={11} color={colors.card} fontWeight="bold">
                          Current
                        </AppText>
                      </View>
                    )}
                  </View>
                  <AppText color={colors.caption} size={13} style={{ marginTop: 2 }}>
                    Subscription: {plan.description}
                  </AppText>
                  <AppText color={colors.caption} size={12} style={{ marginTop: 6 }}>
                    Length: {plan.durationLabel} ·{' '}
                    {plan.period === 'monthly'
                      ? 'Billed monthly, auto-renews'
                      : 'Billed annually, auto-renews'}
                  </AppText>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <AppText fontWeight="bold" size={20} color={colors.primary}>
                    {getDisplayPrice(plan.productId)}
                  </AppText>
                  {!hasActivePlan && (
                    <AppText size={10} color={colors.caption} style={{ marginTop: 4 }}>
                      after trial
                    </AppText>
                  )}
                  {plan.period === 'annual' && (
                    <AppText size={12} color={colors.caption} style={{ marginTop: 2 }}>
                      Save 17%
                    </AppText>
                  )}
                </View>
              </View>
              {isSelected && isPurchasing && !lockedOtherPlan && (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                  style={{ marginTop: 12 }}
                />
              )}
            </>
          );

          if (isCurrentPlan) {
            return (
              <View
                key={plan.id}
                style={[styles.planCard, styles.currentPlanCard]}
              >
                {cardBody}
              </View>
            );
          }

          return (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                isSelected && styles.selectedPlanCard,
                lockedOtherPlan && styles.planCardDisabled,
              ]}
              activeOpacity={lockedOtherPlan ? 1 : 0.85}
              onPress={() => {
                if (lockedOtherPlan) {
                  alertMustCancelExistingFirst();
                  return;
                }
                void handlePurchase(plan.productId);
              }}
              disabled={isPurchasing}
            >
              {cardBody}
            </TouchableOpacity>
          );
        })}
            </>
          )}

        {/* Restore Purchases Button */}
        <PrimaryButton
          title="Restore Purchases"
          type="outlined"
          onPress={handleRestore}
          loading={isPurchasing}
          // Allow restore on iOS even if IAP hasn't fully initialized;
          // backend restore endpoint and hook will handle errors.
          disabled={Platform.OS !== 'ios' || isPurchasing}
          style={{ marginTop: 32, marginBottom: 24 }}
        />

        {/* Required Links - Privacy, EULA, Terms & Conditions (Apple 3.1.2) */}
        <View style={[styles.linksContainer, { flexWrap: 'wrap', justifyContent: 'center' }]}>
          <TouchableOpacity
            onPress={() => Linking.openURL(PRIVACY_POLICY_WEB_URL)}
            style={styles.linkButton}
          >
            <AppText size={14} color={colors.primary} fontWeight="medium">
              Privacy Policy
            </AppText>
          </TouchableOpacity>
          <AppText size={14} color={colors.caption} style={{ marginHorizontal: 6 }}>
            •
          </AppText>
          <TouchableOpacity
            onPress={() => Linking.openURL(TERMS_OF_USE_EULA_URL)}
            style={styles.linkButton}
          >
            <AppText size={14} color={colors.primary} fontWeight="medium">
              Terms of Use (EULA)
            </AppText>
          </TouchableOpacity>
          <AppText size={14} color={colors.caption} style={{ marginHorizontal: 6 }}>
            •
          </AppText>
          <TouchableOpacity
            onPress={() => Linking.openURL(TERMS_AND_CONDITIONS_URL)}
            style={styles.linkButton}
          >
            <AppText size={14} color={colors.primary} fontWeight="medium">
              Terms &amp; Conditions
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Short footer — trial details are in the section above */}
        <AppText
          size={11}
          color={colors.caption}
          style={{ textAlign: 'center', marginBottom: 24, marginTop: 8 }}
        >
          Charges go to your Apple ID. See &quot;Free trial &amp; billing&quot; above for
          details.
        </AppText>
      </ScrollView>
    </View>
  );
};

export default Subscription;

const useStyles = (
  colors: Theme['colors'],
  spacing: Theme['spacing'],
) =>
  StyleSheet.create({
    statusCard: {
      backgroundColor: colors.background,
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    subscriptionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
    },
    currentStatusBadge: {
      backgroundColor: colors.green,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
    },
    trialStatusBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
    },
    paidStatusBadge: {
      backgroundColor: '#2E7D6A',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
    },
    planTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
    },
    planCurrentPill: {
      backgroundColor: colors.green,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
    },
    planCard: {
      backgroundColor: colors.card,
      padding: 20,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: colors.border,
    },
    selectedPlanCard: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '10',
    },
    currentPlanCard: {
      borderColor: colors.green,
      backgroundColor: colors.lightGreen,
    },
    planCardDisabled: {
      opacity: 0.52,
    },
    planHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
    },
    benefitsCard: {
      backgroundColor: colors.background,
      padding: 16,
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    benefitItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginTop: 8,
    },
    bullet: {
      marginRight: 8,
      fontSize: 16,
      color: colors.primary,
    },
    benefitText: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
    },
    linksContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 16,
      marginBottom: 8,
    },
    linkButton: {
      paddingVertical: 4,
    },
    trialInfoCard: {
      marginBottom: 8,
    },
  });
