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
            borderWidth: 0,
            shadowColor: "#000",
            /*shadowOffset: {
                width: 0,
                height: 3,
            },*/
            shadowOpacity: 0.27,
            shadowRadius: 4.25,

            elevation: 10,
            /*backgroundColor: colors.bottomSheetBackground, // Ensure background color is set*/
        },
    });

    useEffect(() => {
        bottomSheetModalRef.current?.present();
        bottomSheetModalRef.current?.expand(); 
    }, [props.children]);

    return (
        <BottomSheetModalProvider>
            <BottomSheetModal
                backgroundStyle={{ backgroundColor: colors.bottomSheetBackground }}
                ref={bottomSheetModalRef}
                index={1}
                snapPoints={snapPoints}
                enableDismissOnClose={false} // prevents closing on dismiss event
                enablePanDownToClose={props.enablePanDownToClose} // prevents closing by sliding down
               // enableDynamicSizing={true}

                onChange={handleSheetChanges}
              //  detached={true}
                style={styles.bottomSheet}

            >
                {props.isListView ? props.children : <BottomSheetScrollView contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="always" keyboardDismissMode="on-drag">
                    {props.children}
                </BottomSheetScrollView>
                }
            </BottomSheetModal>
        </BottomSheetModalProvider>
    )
}