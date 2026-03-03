import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AppText from '../../../components/Text/AppText';
import PrimaryButton from '../../../components/buttons/PrimaryButton';
import Header from '../../../components/header/Header';
import { useTheme } from '../../../hooks/useTheme';
import { useSubscription } from '../../../hooks/useSubscription';
import { SUBSCRIPTION_PLANS } from '../../../constants/subscription';
import { Theme } from '../../../common/theme';
import { showErrMsg, showSuccessMsg } from '../../../utils/flashMessage';
import { subscriptionService } from '../../../services/subscriptionService';
import { store } from '../../../features/store';
import { setError } from '../../../features/subscription/subscriptionSlice';
import { DrawerActions } from '@react-navigation/native';

const Subscription = () => {
  const navigation = useNavigation();
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
  } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  // Clear loader when Redux error is set (e.g. from purchase error listener)
  useEffect(() => {
    if (error) {
      setIsPurchasing(false);
      setSelectedPlan(null);
    }
  }, [error]);

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
    // Find product by checking productId property
    const product = products.find((p: any) => {
      const id = p.productId || p.productIdentifier;
      return id === productId;
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

  const handlePurchase = async (productId: string) => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Not Available', 'Subscriptions are only available on iOS.');
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
      setTimeout(() => {
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
    return `${planType} - ${period}`;
  };

  return (
    <View style={{ flex: 1 }}>
      <Header />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.padding }}
        showsVerticalScrollIndicator={false}
      >
        <AppText
          variant="heading"
          fontWeight="semiBold"
          style={{ marginBottom: 8 }}
        >
          Subscription Plans
        </AppText>

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

        {/* Current Subscription Status */}
        {subscription && (
          <View style={styles.statusCard}>
            <AppText fontWeight="bold" style={{ marginBottom: 4 }}>
              Current Plan
            </AppText>
            <AppText color={colors.caption}>{getCurrentPlanDisplay()}</AppText>
            {subscription.expiresAt && (
              <AppText
                size={12}
                color={colors.caption}
                style={{ marginTop: 4 }}
              >
                Expires: {new Date(subscription.expiresAt).toLocaleDateString()}
              </AppText>
            )}
          </View>
        )}

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

        {/* Loading State */}
        {!isInitialized && Platform.OS === 'ios' && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <AppText style={{ marginTop: 16 }}>Loading subscription plans...</AppText>
          </View>
        )}

        {/* Premium Plans */}
        <AppText
          variant="subheading"
          fontWeight="bold"
          style={{ marginTop: 24, marginBottom: 16 }}
        >
          Premium Plan
        </AppText>

        {SUBSCRIPTION_PLANS.filter(p => p.type === 'premium').map(plan => {
          const isSelected = selectedPlan === plan.productId;
          const isCurrentPlan =
            subscription?.productId === plan.productId && subscription?.isActive;

          return (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                isCurrentPlan && styles.currentPlanCard,
                isSelected && styles.selectedPlanCard,
              ]}
              onPress={() => handlePurchase(plan.productId)}
              // Allow tap even if IAP isn't fully initialized yet;
              // handlePurchase will lazily initialize and handle errors.
              disabled={isPurchasing || isCurrentPlan}
            >
              <View style={styles.planHeader}>
                <View style={{ flex: 1 }}>
                  <AppText fontWeight="bold" size={18}>
                    {plan.period === 'monthly' ? 'Monthly' : 'Annual'}
                  </AppText>
                  <AppText color={colors.caption} size={14} style={{ marginTop: 4 }}>
                    {plan.description}
                  </AppText>
                  <AppText color={colors.caption} size={12} style={{ marginTop: 8 }}>
                    {plan.period === 'monthly'
                      ? 'Billed monthly, auto-renews'
                      : 'Billed annually, auto-renews'}
                  </AppText>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <AppText fontWeight="bold" size={20} color={colors.primary}>
                    {getProductPrice(plan.productId) || plan.priceFormatted}
                  </AppText>
                  {plan.period === 'annual' && (
                    <AppText size={12} color={colors.caption} style={{ marginTop: 2 }}>
                      Save 17%
                    </AppText>
                  )}
                </View>
              </View>
              {isCurrentPlan && (
                <View style={styles.currentBadge}>
                  <AppText size={12} color={colors.card} fontWeight="bold">
                    Current Plan
                  </AppText>
                </View>
              )}
              {isSelected && isPurchasing && (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                  style={{ marginTop: 12 }}
                />
              )}
            </TouchableOpacity>
          );
        })}

        {/* Family Plans */}
        <AppText
          variant="subheading"
          fontWeight="bold"
          style={{ marginTop: 32, marginBottom: 16 }}
        >
          Family Plan (optional, +2 pets)
        </AppText>

        {SUBSCRIPTION_PLANS.filter(p => p.type === 'family').map(plan => {
          const isSelected = selectedPlan === plan.productId;
          const isCurrentPlan =
            subscription?.productId === plan.productId && subscription?.isActive;

          return (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                isCurrentPlan && styles.currentPlanCard,
                isSelected && styles.selectedPlanCard,
              ]}
              onPress={() => handlePurchase(plan.productId)}
              // Allow tap even if IAP isn't fully initialized yet;
              // handlePurchase will lazily initialize and handle errors.
              disabled={isPurchasing || isCurrentPlan}
            >
              <View style={styles.planHeader}>
                <View style={{ flex: 1 }}>
                  <AppText fontWeight="bold" size={18}>
                    {plan.period === 'monthly' ? 'Monthly' : 'Annual'}
                  </AppText>
                  <AppText color={colors.caption} size={14} style={{ marginTop: 4 }}>
                    {plan.description}
                  </AppText>
                  <AppText color={colors.caption} size={12} style={{ marginTop: 8 }}>
                    {plan.period === 'monthly'
                      ? 'Billed monthly, auto-renews'
                      : 'Billed annually, auto-renews'}
                  </AppText>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <AppText fontWeight="bold" size={20} color={colors.primary}>
                    {getProductPrice(plan.productId) || plan.priceFormatted}
                  </AppText>
                  {plan.period === 'annual' && (
                    <AppText size={12} color={colors.caption} style={{ marginTop: 2 }}>
                      Save 17%
                    </AppText>
                  )}
                </View>
              </View>
              {isCurrentPlan && (
                <View style={styles.currentBadge}>
                  <AppText size={12} color={colors.card} fontWeight="bold">
                    Current Plan
                  </AppText>
                </View>
              )}
              {isSelected && isPurchasing && (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                  style={{ marginTop: 12 }}
                />
              )}
            </TouchableOpacity>
          );
        })}

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

        {/* Required Links - Terms of Use and Privacy Policy */}
        <View style={styles.linksContainer}>
          <TouchableOpacity
            onPress={() => {
              // Navigate to Privacy Policy - it's in the drawer navigator
              (navigation as any).navigate('PrivacyPolicy');
            }}
            style={styles.linkButton}
          >
            <AppText size={14} color={colors.primary} fontWeight="medium">
              Privacy Policy
            </AppText>
          </TouchableOpacity>
          <AppText size={14} color={colors.caption} style={{ marginHorizontal: 8 }}>
            •
          </AppText>
          <TouchableOpacity
            onPress={() => {
              // Link to Terms of Use - using Apple's standard EULA
              Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/');
            }}
            style={styles.linkButton}
          >
            <AppText size={14} color={colors.primary} fontWeight="medium">
              Terms of Use
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Info Text */}
        <AppText
          size={12}
          color={colors.caption}
          style={{ textAlign: 'center', marginBottom: 24, marginTop: 16 }}
        >
          Subscriptions will auto-renew unless cancelled at least 24 hours before the
          end of the current period. Manage subscriptions in your Apple ID settings.
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
    planHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    currentBadge: {
      backgroundColor: colors.green,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      alignSelf: 'flex-start',
      marginTop: 12,
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
  });
