import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
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

const Subscription = () => {
  const navigation = useNavigation();
  const { colors, spacing } = useTheme();
  const styles = useStyles(colors, spacing);
  const {
    products,
    subscription,
    isLoading,
    error,
    isInitialized,
    purchaseSubscription,
    restorePurchases,
  } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Get product price from Apple (if available)
  const getProductPrice = (productId: string): string => {
    const product = products.find(p => p.productId === productId);
    if (product?.localizedPrice) {
      return product.localizedPrice;
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

    if (!isInitialized) {
      Alert.alert(
        'Loading',
        'Please wait while we load subscription options...',
      );
      return;
    }

    if (products.length === 0) {
      Alert.alert(
        'Products Not Available',
        'Subscription products are not loaded yet. This may happen if:\n\n' +
        '1. Products are not configured in App Store Connect\n' +
        '2. Products are not approved yet\n' +
        '3. You need to test with a sandbox account\n\n' +
        'Please check App Store Connect and try again.',
      );
      return;
    }

    try {
      setIsPurchasing(true);
      setSelectedPlan(productId);
      await purchaseSubscription(productId);
      // Don't show success here - wait for purchase listener
      // The purchase dialog will appear from iOS
    } catch (error: any) {
      console.error('Purchase error:', error);
      const errorMsg = error.message || 'Failed to purchase subscription';
      showErrMsg(errorMsg);
      
      // Show more helpful error for common issues
      if (errorMsg.includes('not available') || errorMsg.includes('not configured')) {
        Alert.alert(
          'Product Not Available',
          'This subscription product is not available. Please ensure:\n\n' +
          '• Products are created in App Store Connect\n' +
          '• Product IDs match exactly\n' +
          '• Products are submitted and approved\n' +
          '• You are testing with a sandbox account',
        );
      }
    } finally {
      setIsPurchasing(false);
      setSelectedPlan(null);
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

        {error && (
          <View style={[styles.statusCard, { backgroundColor: colors.error + '20' }]}>
            <AppText color={colors.error}>{error}</AppText>
          </View>
        )}

        {Platform.OS !== 'ios' && (
          <View style={[styles.statusCard, { backgroundColor: colors.warning + '20' }]}>
            <AppText color={colors.warning}>
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
              disabled={isPurchasing || isCurrentPlan || !isInitialized}
            >
              <View style={styles.planHeader}>
                <View style={{ flex: 1 }}>
                  <AppText fontWeight="bold" size={18}>
                    {plan.period === 'monthly' ? 'Monthly' : 'Annual'}
                  </AppText>
                  <AppText color={colors.caption} size={14} style={{ marginTop: 4 }}>
                    {plan.description}
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
              disabled={isPurchasing || isCurrentPlan || !isInitialized}
            >
              <View style={styles.planHeader}>
                <View style={{ flex: 1 }}>
                  <AppText fontWeight="bold" size={18}>
                    {plan.period === 'monthly' ? 'Monthly' : 'Annual'}
                  </AppText>
                  <AppText color={colors.caption} size={14} style={{ marginTop: 4 }}>
                    {plan.description}
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
          disabled={!isInitialized || Platform.OS !== 'ios'}
          style={{ marginTop: 32, marginBottom: 24 }}
        />

        {/* Info Text */}
        <AppText
          size={12}
          color={colors.caption}
          style={{ textAlign: 'center', marginBottom: 24 }}
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
      borderColor: colors.success,
      backgroundColor: colors.success + '10',
    },
    planHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    currentBadge: {
      backgroundColor: colors.success,
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
  });
