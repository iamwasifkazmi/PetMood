import React, { ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import {
  Edge,
  SafeAreaView,
} from 'react-native-safe-area-context';
import { useSafeBottomPadding } from '../../hooks/useSafeBottomPadding';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Default: top + bottom (auth / full screens). Use ['top'] when Header already handles top. */
  edges?: readonly Edge[];
  /**
   * Extra bottom padding beyond the system inset.
   * Applied as style paddingBottom when bottom edge is included.
   */
  bottomExtra?: number;
};

/**
 * App-wide safe area wrapper so primary actions stay above system nav
 * on both iOS and Android (including 3-button navigation).
 */
const ScreenSafeArea = ({
  children,
  style,
  edges = ['top', 'bottom'],
  bottomExtra = 16,
}: Props) => {
  const includesBottom = edges.includes('bottom');
  const bottomPad = useSafeBottomPadding(bottomExtra);

  return (
    <SafeAreaView
      edges={edges.filter(e => e !== 'bottom') as Edge[]}
      style={[
        { flex: 1 },
        includesBottom ? { paddingBottom: bottomPad } : null,
        style,
      ]}
    >
      {children}
    </SafeAreaView>
  );
};

export default ScreenSafeArea;
