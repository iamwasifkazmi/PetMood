import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSafeBottomPadding } from '../../hooks/useSafeBottomPadding';

export type GlobalBottomSheetRef = {
  expand: () => void;
  close: () => void;
  collapse: () => void;
  snapToIndex: (index: number) => void;
};

interface Props {
  snapPoints?: string[] | number[];
  children: React.ReactNode;
  showHandle?: boolean;
  /** Size the sheet to its content, capped near the top of the screen. */
  enableDynamicSizing?: boolean;
}

/**
 * Modal-based sheet so a closed sheet never blocks touches
 * (fixes Android freeze after opening screens like Settings).
 * Bottom inset keeps actions above the Android navigation bar.
 */
const GlobalBottomSheet = forwardRef<GlobalBottomSheetRef, Props>(
  (
    {
      snapPoints = ['35%'],
      children,
      showHandle = false,
      enableDynamicSizing = false,
    },
    ref,
  ) => {
    const modalRef = useRef<BottomSheetModal>(null);
    const memoizedSnapPoints = useMemo(() => snapPoints, [snapPoints]);
    const insets = useSafeAreaInsets();
    const { height } = useWindowDimensions();
    const bottomInset = useSafeBottomPadding(0);

    useImperativeHandle(ref, () => ({
      expand: () => modalRef.current?.present(),
      close: () => modalRef.current?.dismiss(),
      collapse: () => modalRef.current?.dismiss(),
      snapToIndex: (index: number) => {
        if (index < 0) {
          modalRef.current?.dismiss();
        } else {
          modalRef.current?.present();
          modalRef.current?.snapToIndex(index);
        }
      },
    }));

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
        />
      ),
      [],
    );

    return (
      <BottomSheetModal
        ref={modalRef}
        snapPoints={enableDynamicSizing ? undefined : memoizedSnapPoints}
        enableDynamicSizing={enableDynamicSizing}
        maxDynamicContentSize={Math.round(height - insets.top - bottomInset - 24)}
        bottomInset={bottomInset}
        topInset={insets.top}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
        handleComponent={showHandle ? undefined : null}
        keyboardBehavior="interactive"
      >
        <BottomSheetScrollView
          style={enableDynamicSizing ? undefined : styles.scroll}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);

export default GlobalBottomSheet;

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingTop: 24,
    paddingBottom: 20,
  },
});
