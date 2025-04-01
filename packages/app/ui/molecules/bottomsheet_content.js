import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useBottomSheetData } from 'app/context/bottomsheet';
import { View, ScrollView, Pressable } from 'app/design/view';
import { Button } from 'app/design/controls';
import { Text } from 'app/design/typography';
import { LAYOUT_BREAKPOINTS } from 'app/lib/util'
import { useWindowDimensions } from 'react-native'
import { Modal } from 'app/design/controls'
import BottomSheet, { BottomSheetModalProvider, BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView, BottomSheetFooter, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { StyleSheet } from "react-native";
import { Theme } from 'app/design/theme';
import { Platform } from 'react-native'

export default function ElementBottomSheetContent(props) {
    const { bottomSheetData, setBottomSheetData } = useBottomSheetData();

    const {
        isListView = false,
        showClose = true,
        title,
        header,
        content,
        footer,
        snapPoints,
        onClose: onCloseCallback
    } = bottomSheetData || {};

    const onClose = useCallback(() => {
        setBottomSheetData(null);
    }, []);

    const bottomSheetHeader = useMemo(() => (
        <>
            {title && (
                <View className=''>
                    <Text className='text-neutral-700 dark:text-neutral-200 text-center text-xl font-bold mb-2'>
                        {title}
                    </Text>
                </View>
            )}
            {showClose && (
                <View className='absolute right-2 z-50 top-2 '>
                    <Button startDecorator="X" tooltip='Close' variant='text' size='sm' onPress={onClose} />
                </View>
            )}
            {header}
        </>
    ), [title, showClose, header, onClose]);

    const contentView = useMemo(() => (
        <View className="mx-auto w-full flex-1 px-4">
            {content}
            {footer}
        </View>
    ), [content, footer]);

    const bottomSheetProps = useMemo(() => ({
        isShow: !!bottomSheetData,
        blocking: false,
        snapPoints,
        isListView,
        header: bottomSheetHeader,
    }), [snapPoints, isListView, bottomSheetHeader, showClose]);

    const windowDimensions = useWindowDimensions();

    if (!bottomSheetData) return null;

    if (windowDimensions.width > LAYOUT_BREAKPOINTS.lg) {
        return (
            <Modal
                title={bottomSheetData.title}
                onVisible={true}
                onClose={() => {
                    setBottomSheetData(false)
                    if (bottomSheetData.onClose)
                        bottomSheetData.onClose();
                }}
                padding={bottomSheetData?.modal?.padding}
                outerClickClose={false}
                transparent={true}
            >
                <View className='w-full ' style={{ maxHeight: windowDimensions.height - 100 }}>
                    <ScrollView className=' w-full'>
                        {bottomSheetData.content}
                        {bottomSheetData.footer}
                    </ScrollView>
                </View>
            </Modal>
        )
    }

    return (

        <BottomSheet2 {...bottomSheetProps}>
            <View className="mx-auto w-full flex-1 flex-auto py-2 h-full z-50">
                {bottomSheetHeader}
                {isListView ? contentView : (
                    <ScrollView className='w-full' keyboardShouldPersistTaps="always" keyboardDismissMode="on-drag">
                        {contentView}
                    </ScrollView>
                )}
            </View>

        </BottomSheet2>

    );
}

function BottomSheet2(props) {
    const { bottomSheetData, setBottomSheetData } = useBottomSheetData();
    const isWeb = Platform.OS === 'web';
    const { colors } = Theme();
    const bottomSheetModalRef = useRef(null);
    const snapPoints = useMemo(() => (props.snapPoints ? props.snapPoints : ['50%', '90%']), []);
    const handleSheetChanges = useCallback((index) => {
    }, []);

    const styles = StyleSheet.create({
        container: {
            flex: 1,

        },
        bottomSheet: {
            borderWidth: 0,
            shadowColor: "rgba(0,0,0,15)",
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 10,
        },
    });

    useEffect(() => {
        if (!props.children) {

            bottomSheetModalRef.current?.close();
        }
        else {
            bottomSheetModalRef.current?.present();
            bottomSheetModalRef.current?.expand();
        }
    }, [props.children]);


    const renderBackdrop = useCallback(
        (props) => (
            <BottomSheetBackdrop
                pressBehavior="close"
                {...props}
                opacity={0.8}
                disappearsOnIndex={-1}
            />
        ),
        []
    );

    const renderWebBackdrop = useCallback(
        ({ style }) => (
            <Pressable
                onPress={() => setBottomSheetData(null)}
                style={[style, { backgroundColor: 'rgba(0, 0, 0, 0.8)' }]}
            />
        ),
        []
    );

    const backdropComponent = Platform.select({
        web: renderWebBackdrop,
        default: renderBackdrop,
    });

    return (
        <BottomSheetModalProvider>
            <BottomSheetModal
                backdropComponent={backdropComponent}
                backgroundStyle={{ backgroundColor: colors.bottomSheetBackground }}
                ref={bottomSheetModalRef}
                index={1}
                {...(isWeb ? { enableDynamicSizing: true } : { snapPoints: snapPoints })}
                // snapPoints={snapPoints}
                // enableDismissOnClose={true} // changed to true => not hide fully in more menus
                enablePanDownToClose={true} // prevents closing by sliding down
                onChange={handleSheetChanges}
                //  detached={true}
                style={styles.bottomSheet}

            >
                {props.isListView ? props.children : <BottomSheetScrollView contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="always" keyboardDismissMode="on-drag">
                    {props.children}
                </BottomSheetScrollView>
                }
            </BottomSheetModal></BottomSheetModalProvider>
    )
}