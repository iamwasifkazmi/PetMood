import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import Header from '../../../components/header/Header';
import AppText from '../../../components/Text/AppText';
import PrimaryButton from '../../../components/buttons/PrimaryButton';
import { useTheme } from '../../../hooks/useTheme';
import { useSafeBottomPadding } from '../../../hooks/useSafeBottomPadding';
import { Theme } from '../../../common/theme';
import {
  useGetAiConsentQuery,
  useSetAiConsentMutation,
} from '../../../features/privacy/privacyApiSlice';
import { AiProviderKey } from '../../../features/privacy/types';
import { showErrMsg, showSuccessMsg } from '../../../utils/flashMessage';

/**
 * Dedicated screen for GET/POST `privacy/ai-consent` (grant / revoke).
 */
const PrivacyAiConsentScreen = () => {
  const { colors, spacing } = useTheme();
  const styles = useStyles(colors, spacing);
  const bottomPad = useSafeBottomPadding(16);

  const { data, isLoading, isFetching } = useGetAiConsentQuery();
  const [setAiConsent, { isLoading: isSaving }] = useSetAiConsentMutation();

  const [allowAi, setAllowAi] = useState(false);
  const [providers, setProviders] = useState<Record<AiProviderKey, boolean>>({
    nyckel: false,
    assemblyai: false,
  });
  /** Prevent refetch/response from fighting the optimistic toggle UI */
  const syncingRef = useRef(false);
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (syncingRef.current) {
      return;
    }
    const c = data?.consent;
    if (!c) {
      return;
    }
    setAllowAi(!!c.granted);
    setProviders({
      nyckel: c.providers?.includes('nyckel') ?? false,
      assemblyai: c.providers?.includes('assemblyai') ?? false,
    });
    hydratedRef.current = true;
  }, [data?.consent?.granted, data?.consent?.providers?.join(',')]);

  const persist = async (granted: boolean, nextProviders: AiProviderKey[]) => {
    syncingRef.current = true;
    try {
      await setAiConsent({ granted, providers: nextProviders }).unwrap();
      showSuccessMsg(
        granted ? 'AI analysis access updated.' : 'AI analysis access revoked.',
      );
    } catch {
      // Roll back from server truth on next render
      const c = data?.consent;
      setAllowAi(!!c?.granted);
      setProviders({
        nyckel: c?.providers?.includes('nyckel') ?? false,
        assemblyai: c?.providers?.includes('assemblyai') ?? false,
      });
      showErrMsg('Could not update consent. Please try again.');
    } finally {
      // Allow a beat so RTK cache update doesn't immediately flip the switch
      setTimeout(() => {
        syncingRef.current = false;
      }, 400);
    }
  };

  const onMasterToggle = async (value: boolean) => {
    if (value) {
      const next: AiProviderKey[] = ['nyckel', 'assemblyai'];
      setAllowAi(true);
      setProviders({ nyckel: true, assemblyai: true });
      await persist(true, next);
    } else {
      setAllowAi(false);
      setProviders({ nyckel: false, assemblyai: false });
      await persist(false, []);
    }
  };

  const onProviderToggle = async (key: AiProviderKey, value: boolean) => {
    const nextMap = { ...providers, [key]: value };
    const nextList = (['nyckel', 'assemblyai'] as AiProviderKey[]).filter(
      k => nextMap[k],
    );
    const granted = nextList.length > 0;
    setProviders(nextMap);
    setAllowAi(granted);
    await persist(granted, nextList);
  };

  const revokeAll = async () => {
    setAllowAi(false);
    setProviders({ nyckel: false, assemblyai: false });
    await persist(false, []);
  };

  const disclosure = data?.disclosure;
  const showInitialLoader = (isLoading || isFetching) && !hydratedRef.current && !data;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header />
      <ScrollView
        contentContainerStyle={{
          padding: spacing.padding,
          paddingBottom: 40 + bottomPad,
        }}
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="heading" fontWeight="semiBold" style={{ marginBottom: 8 }}>
          AI analysis consent
        </AppText>
        <AppText size={14} color={colors.caption} style={{ marginBottom: 20 }}>
          Control whether PetMood may send your photo or audio to third-party AI
          providers for emotion detection. You can grant or revoke access at any time.
        </AppText>

        {showInitialLoader ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <AppText style={{ marginTop: 12 }} color={colors.caption}>
              Loading consent status…
            </AppText>
          </View>
        ) : (
          <>
            {data?.consent?.grantedAt && (
              <AppText size={12} color={colors.caption} style={{ marginBottom: 8 }}>
                Last granted: {new Date(data.consent.grantedAt).toLocaleString()}
              </AppText>
            )}
            {data?.consent?.revokedAt && (
              <AppText size={12} color={colors.caption} style={{ marginBottom: 16 }}>
                Last revoked: {new Date(data.consent.revokedAt).toLocaleString()}
              </AppText>
            )}

            <View style={styles.card}>
              <View style={styles.row}>
                <AppText fontWeight="semiBold" style={{ flex: 1 }}>
                  Allow third-party AI analysis
                </AppText>
                <Switch
                  value={allowAi}
                  onValueChange={onMasterToggle}
                  disabled={isSaving}
                />
              </View>
              <AppText size={12} color={colors.caption} style={{ marginTop: 8 }}>
                When off, scans that require AI may ask for consent again.
              </AppText>
            </View>

            {allowAi && (
              <View style={styles.card}>
                <AppText fontWeight="bold" style={{ marginBottom: 12 }}>
                  Providers
                </AppText>
                {(['nyckel', 'assemblyai'] as AiProviderKey[]).map(key => {
                  const d = disclosure?.[key];
                  const label =
                    key === 'nyckel' ? 'Nyckel (images)' : 'AssemblyAI (audio)';
                  return (
                    <View key={key} style={[styles.providerBlock, { marginBottom: 16 }]}>
                      <View style={styles.row}>
                        <AppText fontWeight="medium" style={{ flex: 1 }}>
                          {label}
                        </AppText>
                        <Switch
                          value={providers[key]}
                          onValueChange={v => onProviderToggle(key, v)}
                          disabled={isSaving}
                        />
                      </View>
                      {d && (
                        <>
                          <AppText size={12} color={colors.caption} style={{ marginTop: 6 }}>
                            Data: {d.dataSent?.join(', ')}
                          </AppText>
                          <AppText size={12} color={colors.caption}>
                            Purpose: {d.purpose}
                          </AppText>
                        </>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            <PrimaryButton
              title="Revoke all AI access"
              type="outlined"
              loading={isSaving}
              onPress={revokeAll}
              style={{ marginTop: 8 }}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
};

export default PrivacyAiConsentScreen;

const useStyles = (colors: Theme['colors'], spacing: Theme['spacing']) =>
  StyleSheet.create({
    centered: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    providerBlock: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 12,
    },
  });
