import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { StyleSheet } from 'react-native';

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
}

/**
 * Modal-based sheet so a closed sheet never blocks touches
 * (fixes Android freeze after opening screens like Settings).
 */
const GlobalBottomSheet = forwardRef<GlobalBottomSheetRef, Props>(
  (
    { snapPoints = ['35%'], children, showHandle = false },
    ref,
  ) => {
    const modalRef = useRef<BottomSheetModal>(null);
    const memoizedSnapPoints = useMemo(() => snapPoints, [snapPoints]);

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
        snapPoints={memoizedSnapPoints}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
        handleComponent={showHandle ? undefined : null}
      >
        <BottomSheetView style={styles.contentContainer}>
          {children}
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

export default GlobalBottomSheet;

const styles = StyleSheet.create({
  contentContainer: {
    padding: 16,
    paddingTop: 24,
    paddingBottom: 28,
  },
});
