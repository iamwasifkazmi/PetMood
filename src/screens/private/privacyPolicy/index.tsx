import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../../common/theme';
import AppText from '../../../components/Text/AppText';
import Header from '../../../components/header/Header';
import { useTheme } from '../../../hooks/useTheme';
import CardView from '../../../components/cards/CardView';

const PrivacyPolicy = () => {
  const { colors, spacing } = useTheme();
  const styles = useStyles(colors, spacing);

  return (
    <SafeAreaView
      edges={['bottom']}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <Header />
      <View style={{ padding: spacing.padding, flex: 1 }}>
        <AppText
          variant="heading"
          fontWeight="semiBold"
          style={{ marginBottom: 24 }}
        >
          Privacy Policy
        </AppText>

        <CardView>
          {/* Section 1 */}
          <ScrollView>
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

            {/* Section 2 */}
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
          </ScrollView>
        </CardView>
      </View>
    </SafeAreaView>
  );
};

export default PrivacyPolicy;

const useStyles = (colors: Theme['colors'], spacing: Theme['spacing']) =>
  StyleSheet.create({
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
