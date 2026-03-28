import React from 'react';
import { Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../../common/theme';
import AppText from '../../../components/Text/AppText';
import Header from '../../../components/header/Header';
import { useTheme } from '../../../hooks/useTheme';
import CardView from '../../../components/cards/CardView';
import {
  PRIVACY_POLICY_WEB_URL,
  TERMS_AND_CONDITIONS_URL,
  TERMS_OF_USE_EULA_URL,
} from '../../../common/legalUrls';

const PrivacyPolicy = () => {
  const { colors, spacing } = useTheme();
  const styles = useStyles(colors, spacing);

  const openUrl = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <SafeAreaView
      edges={['bottom']}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <Header />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: spacing.padding,
          paddingBottom: spacing.padding * 2,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator
      >
        <AppText
          variant="heading"
          fontWeight="semiBold"
          style={{ marginBottom: 8 }}
        >
          Privacy Policy
        </AppText>

        <AppText color={colors.caption} style={{ marginBottom: 16, lineHeight: 20 }}>
          Below is a short summary. For the complete Privacy Policy, Terms of Use (EULA),
          and Terms &amp; Conditions, use the links at the bottom of this screen.
        </AppText>

        <CardView>
          <View>
            <AppText
              variant="subheading"
              fontWeight="semiBold"
              style={styles.sectionTitle}
            >
              1. Information We Collect
            </AppText>

            <AppText style={styles.subItem} fontWeight="semiBold">
              a. User Information
            </AppText>
            <View style={styles.bulletRow}>
              <AppText style={styles.bullet}>•</AppText>
              <AppText style={styles.bulletText}>
                Name, email address, and login credentials (Email, Google,
                Apple).
              </AppText>
            </View>
            <View style={styles.bulletRow}>
              <AppText style={styles.bullet}>•</AppText>
              <AppText style={styles.bulletText}>
                Profile information (including optional pet profile details).
              </AppText>
            </View>

            <AppText style={styles.subItem}>b. Media Content</AppText>
            <View style={styles.bulletRow}>
              <AppText style={styles.bullet}>•</AppText>
              <AppText style={styles.bulletText}>
                Audio recordings, video clips, or images submitted for emotion
                detection.
              </AppText>
            </View>
            <View style={styles.bulletRow}>
              <AppText style={styles.bullet}>•</AppText>
              <AppText style={styles.bulletText}>
                Pet photos uploaded by users.
              </AppText>
            </View>

            <AppText style={styles.subItem}>c. Device & Usage Data</AppText>
            <View style={styles.bulletRow}>
              <AppText style={styles.bullet}>•</AppText>
              <AppText style={styles.bulletText}>
                App usage statistics, scan history, timestamps.
              </AppText>
            </View>
            <View style={styles.bulletRow}>
              <AppText style={styles.bullet}>•</AppText>
              <AppText style={styles.bulletText}>
                Device type, OS version, and app version.
              </AppText>
            </View>

            <AppText
              variant="subheading"
              fontWeight="semiBold"
              style={[styles.sectionTitle, { marginTop: 16 }]}
            >
              2. How We Use Your Information
            </AppText>

            <AppText style={styles.paragraph}>We use your data to:</AppText>
            <View style={styles.bulletRow}>
              <AppText style={styles.bullet}>•</AppText>
              <AppText style={styles.bulletText}>
                Provide emotion detection services for your pets.
              </AppText>
            </View>
            <View style={styles.bulletRow}>
              <AppText style={styles.bullet}>•</AppText>
              <AppText style={styles.bulletText}>
                Improve accuracy and performance of our AI model.
              </AppText>
            </View>
            <View style={styles.bulletRow}>
              <AppText style={styles.bullet}>•</AppText>
              <AppText style={styles.bulletText}>
                Maintain your scan history and pet records.
              </AppText>
            </View>
          </View>
        </CardView>

        <AppText
          variant="subheading"
          fontWeight="semiBold"
          style={{ marginTop: 24, marginBottom: 8 }}
        >
          Full legal documents
        </AppText>
        <AppText color={colors.caption} style={{ marginBottom: 16, lineHeight: 20 }}>
          Tap a link to open the full text in your browser (petmood.care).
        </AppText>

        <View style={styles.legalLinks}>
          <TouchableOpacity
            onPress={() => openUrl(PRIVACY_POLICY_WEB_URL)}
            style={styles.legalLinkRow}
          >
            <AppText color={colors.primary} fontWeight="semiBold">
              Full Privacy Policy
            </AppText>
            <AppText size={11} color={colors.caption} style={{ marginTop: 4 }}>
              {PRIVACY_POLICY_WEB_URL}
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => openUrl(TERMS_OF_USE_EULA_URL)}
            style={styles.legalLinkRow}
          >
            <AppText color={colors.primary} fontWeight="semiBold">
              Terms of Use (EULA)
            </AppText>
            <AppText size={11} color={colors.caption} style={{ marginTop: 4 }}>
              {TERMS_OF_USE_EULA_URL}
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => openUrl(TERMS_AND_CONDITIONS_URL)}
            style={styles.legalLinkRow}
          >
            <AppText color={colors.primary} fontWeight="semiBold">
              Terms &amp; Conditions
            </AppText>
            <AppText size={11} color={colors.caption} style={{ marginTop: 4 }}>
              {TERMS_AND_CONDITIONS_URL}
            </AppText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PrivacyPolicy;

const useStyles = (colors: Theme['colors'], spacing: Theme['spacing']) =>
  StyleSheet.create({
    legalLinks: {
      gap: 12,
    },
    legalLinkRow: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    sectionTitle: {
      marginBottom: 8,
      color: colors.text,
    },
    subItem: {
      marginTop: 6,
      color: colors.text,
    },
    paragraph: {
      marginLeft: 12,
      marginTop: 2,
      color: colors.text,
    },
    bulletRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginLeft: 12,
      marginTop: 4,
    },
    bullet: {
      marginRight: 6,
      color: colors.text,
    },
    bulletText: {
      flex: 1,
      color: colors.text,
    },
  });
