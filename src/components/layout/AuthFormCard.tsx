import React, { ReactNode, Ref } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Theme } from '../../common/theme';
import { useTheme } from '../../hooks/useTheme';
import useKeyboard from '../../hooks/useKeyboard';
import LogoView from '../views/LogoView';
import ScreenSafeArea from './ScreenSafeArea';

type Props = {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  scrollRef?: Ref<KeyboardAwareScrollView>;
};

/**
 * Auth screens keep the logo above a card. The title stays pinned in the card
 * so keyboard scrolling cannot slide it under the branding.
 */
const AuthFormCard = ({ title, subtitle, children, scrollRef }: Props) => {
  const { colors, fonts, spacing } = useTheme();
  const styles = useStyles(colors, fonts, spacing);
  const { isOpen: keyboardOpen } = useKeyboard();

  return (
    <ScreenSafeArea style={{ backgroundColor: colors.primary }}>
      <View style={[styles.screen, keyboardOpen && styles.screenKeyboard]}>
        {keyboardOpen ? null : <LogoView />}
        <View style={[styles.card, keyboardOpen && styles.cardKeyboard]}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <View style={styles.subtitle}>{subtitle}</View> : null}
          <KeyboardAwareScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            enableOnAndroid
            enableAutomaticScroll
            extraScrollHeight={32}
            extraHeight={24}
            keyboardOpeningTime={0}
            enableResetScrollToCoords={false}
            nestedScrollEnabled
          >
            {children}
          </KeyboardAwareScrollView>
        </View>
      </View>
    </ScreenSafeArea>
  );
};

export default AuthFormCard;

const useStyles = (
  colors: Theme['colors'],
  fonts: Theme['fonts'],
  spacing: Theme['spacing'],
) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      paddingTop: 24,
    },
    screenKeyboard: {
      paddingTop: 4,
    },
    card: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 40,
      borderTopRightRadius: 40,
      marginTop: 24,
      flex: 1,
      overflow: 'hidden',
      paddingTop: 20,
    },
    cardKeyboard: {
      marginTop: 8,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    },
    title: {
      fontSize: 24,
      textAlign: 'center',
      color: colors.text,
      ...fonts.semiBold,
      marginBottom: 8,
      paddingHorizontal: spacing.padding,
    },
    subtitle: {
      paddingHorizontal: spacing.padding,
      marginBottom: 8,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.padding,
      paddingBottom: 40,
      flexGrow: 1,
    },
  });
