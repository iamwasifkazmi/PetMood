import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from 'react-native';
import AppText from '../Text/AppText';
import { useTheme } from '../../hooks/useTheme';
import { Theme } from '../../common/theme';
import { AiDisclosureMap, AiProviderKey } from '../../features/privacy/types';

type ProviderState = Record<AiProviderKey, boolean>;

const PROVIDERS: AiProviderKey[] = ['nyckel', 'assemblyai'];

const PROVIDER_LABEL: Record<AiProviderKey, string> = {
  nyckel: 'Nyckel (Images)',
  assemblyai: 'AssemblyAI (Audio)',
};

interface Props {
  visible: boolean;
  loading?: boolean;
  disclosure?: AiDisclosureMap;
  initialEnabledProviders?: AiProviderKey[];
  requiredProvider?: AiProviderKey | null;
  onClose: () => void;
  onSubmit: (providers: AiProviderKey[]) => void;
}

export default function AiConsentModal({
  visible,
  loading,
  disclosure,
  initialEnabledProviders = [],
  requiredProvider,
  onClose,
  onSubmit,
}: Props) {
  const { colors, spacing } = useTheme();
  const styles = useStyles(colors, spacing);

  const initialState = useMemo<ProviderState>(() => {
    const base: ProviderState = { nyckel: false, assemblyai: false };
    initialEnabledProviders.forEach(p => {
      base[p] = true;
    });
    if (requiredProvider) {
      base[requiredProvider] = true;
    }
    return base;
  }, [initialEnabledProviders, requiredProvider]);

  const [enabled, setEnabled] = useState<ProviderState>(initialState);

  useEffect(() => {
    if (visible) {
      setEnabled(initialState);
    }
  }, [visible, initialState]);

  const selectedProviders = PROVIDERS.filter(p => enabled[p]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <AppText variant="subheading" fontWeight="bold" style={{ marginBottom: 8 }}>
            Allow AI Analysis?
          </AppText>

          <AppText size={13} color={colors.caption} style={{ marginBottom: 12 }}>
            To analyze your pet’s emotion, we send the photo/audio you upload to our AI providers.
            You can change this anytime in Settings.
          </AppText>

          <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
            {PROVIDERS.map(provider => {
              const d = disclosure?.[provider];
              return (
                <View key={provider} style={styles.providerCard}>
                  <View style={styles.providerRow}>
                    <AppText fontWeight="semiBold">{PROVIDER_LABEL[provider]}</AppText>
                    <Switch
                      value={enabled[provider]}
                      onValueChange={val => setEnabled(prev => ({ ...prev, [provider]: val }))}
                      disabled={loading || provider === requiredProvider}
                    />
                  </View>
                  {d ? (
                    <>
                      <AppText size={12} color={colors.caption} style={{ marginTop: 6 }}>
                        Provider: {d.providerName}
                      </AppText>
                      <AppText size={12} color={colors.caption}>
                        Data sent: {d.dataSent.join(', ')}
                      </AppText>
                      <AppText size={12} color={colors.caption}>
                        Purpose: {d.purpose}
                      </AppText>
                    </>
                  ) : (
                    <AppText size={12} color={colors.caption} style={{ marginTop: 6 }}>
                      We send only user-submitted media required to run emotion detection.
                    </AppText>
                  )}
                  {provider === requiredProvider && (
                    <AppText size={12} color={colors.primary} style={{ marginTop: 6 }}>
                      Required to continue this scan
                    </AppText>
                  )}
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.actionsRow}>
            <TouchableOpacity onPress={onClose} disabled={loading} style={styles.secondaryBtn}>
              <AppText color={colors.primary} fontWeight="semiBold">
                Not now
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onSubmit(selectedProviders)}
              disabled={loading || selectedProviders.length === 0}
              style={[
                styles.primaryBtn,
                (loading || selectedProviders.length === 0) && { opacity: 0.6 },
              ]}
            >
              {loading ? (
                <ActivityIndicator color={colors.card} />
              ) : (
                <AppText color={colors.card} fontWeight="semiBold">
                  Allow
                </AppText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const useStyles = (colors: Theme['colors'], spacing: Theme['spacing']) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.card,
      padding: spacing.md,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    providerCard: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      marginBottom: 10,
      backgroundColor: colors.background,
    },
    providerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    actionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
      marginTop: 10,
    },
    primaryBtn: {
      flex: 1,
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryBtn: {
      flex: 1,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.card,
    },
  });

