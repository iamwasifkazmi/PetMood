import React, { useEffect, useState } from 'react';
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
import { Theme } from '../../../common/theme';
import {
  useGetAiConsentQuery,
  useSetAiConsentMutation,
} from '../../../features/privacy/privacyApiSlice';
import { AiProviderKey } from '../../../features/privacy/types';
import { showErrMsg, showSuccessMsg } from '../../../utils/flashMessage';

/**
 * Dedicated screen for GET/POST `privacy/ai-consent` (grant / revoke).
 * Lets users change consent after denying at scan time or revoke after granting.
 */
const PrivacyAiConsentScreen = () => {
  const { colors, spacing } = useTheme();
  const styles = useStyles(colors, spacing);

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useGetAiConsentQuery();
  const [setAiConsent, { isLoading: isSaving }] = useSetAiConsentMutation();

  const [allowAi, setAllowAi] = useState(false);
  const [providers, setProviders] = useState<Record<AiProviderKey, boolean>>({
    nyckel: false,
    assemblyai: false,
  });

  useEffect(() => {
    const c = data?.consent;
    if (!c) return;
    setAllowAi(!!c.granted);
    setProviders({
      nyckel: c.providers?.includes('nyckel') ?? false,
      assemblyai: c.providers?.includes('assemblyai') ?? false,
    });
  }, [data]);

  const selectedProviderKeys = (): AiProviderKey[] =>
    (['nyckel', 'assemblyai'] as AiProviderKey[]).filter(k => providers[k]);

  const persist = async (granted: boolean, nextProviders: AiProviderKey[]) => {
    try {
      await setAiConsent({ granted, providers: nextProviders }).unwrap();
      await refetch();
      showSuccessMsg(granted ? 'AI analysis access updated.' : 'AI analysis access revoked.');
    } catch {
      showErrMsg('Could not update consent. Please try again.');
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header />
      <ScrollView
        contentContainerStyle={{ padding: spacing.padding, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="heading" fontWeight="semiBold" style={{ marginBottom: 8 }}>
          AI analysis consent
        </AppText>
        <AppText size={14} color={colors.caption} style={{ marginBottom: 20 }}>
          Control whether PetMood may send your photo or audio to third-party AI
          providers (Nyckel for images, AssemblyAI for audio) for emotion detection.
          You can grant access here if you previously tapped &quot;Not now&quot; during a
          scan, or revoke access at any time.
        </AppText>

        {(isLoading || isFetching) && !data ? (
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
                <AppText fontWeight="semiBold">Allow third-party AI analysis</AppText>
                {isSaving ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Switch value={allowAi} onValueChange={onMasterToggle} />
                )}
              </View>
              <AppText size={12} color={colors.caption} style={{ marginTop: 8 }}>
                When off, scans that require AI will ask for consent again or may be
                blocked until you enable providers below.
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
                        <AppText fontWeight="medium">{label}</AppText>
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
