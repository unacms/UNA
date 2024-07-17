import React, { useCallback, useMemo, useRef, useContext } from 'react';
import BottomSheet, { BottomSheetScrollView, BottomSheetFooter } from '@gorhom/bottom-sheet';
import { StyleSheet } from "react-native";



export default function ElementCommentForm(props) {
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

    return (
        <BottomSheet backgroundStyle={{ backgroundColor: 'white' }}
            /* ref={bottomSheetRef}*/
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
        </BottomSheet>
    )
}