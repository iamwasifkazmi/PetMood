import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import React, { forwardRef, useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';

export type GlobalBottomSheetRef = BottomSheet;

interface Props {
  snapPoints?: string[] | number[];
  children: React.ReactNode;
  showHandle?: boolean;
}

const GlobalBottomSheet = forwardRef<GlobalBottomSheetRef, Props>(
  (
    { snapPoints = ['20%', '25%', '50%', '90%'], children, showHandle = false },
    ref,
  ) => {
    const memoizedSnapPoints = useMemo(() => snapPoints, [snapPoints]);

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
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={memoizedSnapPoints}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
        handleComponent={showHandle ? undefined : null}
      >
        <BottomSheetView style={styles.contentContainer}>
          {children}
        </BottomSheetView>
      </BottomSheet>
    );
  },
);

export default GlobalBottomSheet;

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    padding: 16,
    paddingTop: 24,
  },
});
