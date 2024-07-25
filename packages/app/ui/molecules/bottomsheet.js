import React, { useCallback, useMemo, useRef, useContext, useEffect } from 'react';
import BottomSheet, { BottomSheetModalProvider, BottomSheetModal, BottomSheetScrollView, BottomSheetFooter } from '@gorhom/bottom-sheet';
import { StyleSheet } from "react-native";
import { Theme } from 'app/design/theme';


export default function ElementCommentForm(props) {
    const { colors } = Theme();
    const bottomSheetModalRef = useRef(null);
    //const bottomSheetRef = useRef(null);
    const snapPoints = useMemo(() => (props.snapPoints ? props.snapPoints : ['50%', '90%']), []);
    const handleSheetChanges = useCallback((index) => {
        // console.log('handleSheetChanges', index);
    }, []);

    const styles = StyleSheet.create({
        container: {
            flex: 1,
        },
        bottomSheet: {
            shadowColor: "#000",
            shadowOffset: {
                width: 0,
                height: 12,
            },
            shadowOpacity: 0.58,
            shadowRadius: 16.00,

            elevation: 24,
            backgroundColor: 'white', // Ensure background color is set
        },
    });

    useEffect(() => {
        bottomSheetModalRef.current?.present();
    }, []);

    return (
        <BottomSheetModalProvider>
        <BottomSheetModal backgroundStyle={{backgroundColor: colors.bottomSheetBackground}}
            /* ref={bottomSheetRef}*/
            ref={bottomSheetModalRef}
            index={1}
            snapPoints={snapPoints}
            /*enableDynamicSizing={true}*/
            onChange={handleSheetChanges}
            detached={true}
            style={styles.bottomSheet}

        >
            {props.isListView ? props.children : <BottomSheetScrollView contentContainerStyle={styles.contentContainer}>
                {props.children}
            </BottomSheetScrollView>
            }
        </BottomSheetModal>
        </BottomSheetModalProvider>
    )
}