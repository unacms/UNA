import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useBottomSheetData } from 'app/context/bottomsheet';
import { View, ScrollView, Pressable } from 'app/design/view';
import { Button } from 'app/design/controls';
import { Text } from 'app/design/typography';
import { Modal } from 'app/design/controls'
import { BottomSheetModalProvider, BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView, BottomSheetFooter, BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { StyleSheet } from "react-native";
import { useTheme } from 'app/design/theme';
import { Platform } from 'react-native'
import { useWindowHeight } from 'app/context/measure';

export default function ElementBottomSheetContent(props) {
    const { bottomSheetData, setBottomSheetData } = useBottomSheetData();
    const [keepMounted, setKeepMounted] = useState(false);
    const isOpen = Boolean(bottomSheetData);
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

    useEffect(() => {
        if (isOpen) {
            setKeepMounted(true);
        }
    }, [isOpen]);

    const handleSheetFullyDismissed = useCallback(() => {
        setKeepMounted(false);
    }, []);

    const onClose = useCallback(() => {
        setBottomSheetData(null);
    }, [setBottomSheetData]);

    const bottomSheetHeader = useMemo(() => (
        <>
            {title && (
                <View className=''>
                    <Text className='text-muted-foreground  text-center text-xl font-bold mb-2'>
                        {title}
                    </Text>
                </View>
            )}
            {showClose && (
                <View className='absolute right-2 z-50 top-0 '>
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
        isShow: isOpen,
        blocking: false,
        snapPoints,
        isListView,
        header: bottomSheetHeader,
        onFullyDismissed: handleSheetFullyDismissed,
    }), [snapPoints, isListView, bottomSheetHeader, isOpen, handleSheetFullyDismissed]);

    const windowHeight = useWindowHeight();
    if (!isOpen && !keepMounted) return null;

    if (bottomSheetData?.modal) {
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
                transparent={true}
            >
                <View className='w-full ' style={{ maxHeight: windowHeight - 100 }}>
                    <ScrollView className=' w-full'>
                        {bottomSheetData.content}
                        {bottomSheetData.footer}
                    </ScrollView>
                </View>
            </Modal>
        )
    }

    return (

        <BottomSheet2 {...bottomSheetProps} header={bottomSheetHeader}>
            <View className="mx-auto w-full flex-1 flex-auto py-2 web:h-full z-50">
                {isOpen ? contentView : null}
            </View>

        </BottomSheet2>

    );
}

function BottomSheet2(props) {
    const { bottomSheetData, setBottomSheetData } = useBottomSheetData();
    const isWeb = Platform.OS === 'web';
    const { colors } = useTheme();
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
            elevation: 10,
            ...Platform.select({
                web: {
                    boxShadow: '0px 12px 32px rgba(0, 0, 0, 0.2)',
                },
            }),
        },
    });

    useEffect(() => {
        // Debounce rapid state changes to prevent removeChild errors
        const timer = setTimeout(() => {
            if (!props.isShow) {
                bottomSheetModalRef.current?.close();
            }
            else {
                bottomSheetModalRef.current?.present();
                bottomSheetModalRef.current?.expand();
            }
        }, 100); // Small delay to prevent rapid changes
        
        return () => clearTimeout(timer);
    }, [props.isShow]);


    const handleDismiss = useCallback(() => {
        setBottomSheetData(null);
        props.onFullyDismissed?.();
    }, [setBottomSheetData, props.onFullyDismissed]);

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
                onPress={handleDismiss}
                style={[style, { backgroundColor: 'rgba(0, 0, 0, 0.8)' }]}
            />
        ),
        [handleDismiss]
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
                onDismiss={handleDismiss}
                //  detached={true}
                style={styles.bottomSheet}

            >
                {props.isListView ? props.children : <><View className="w-full ">{props.header}</View><BottomSheetScrollView keyboardShouldPersistTaps="always" keyboardDismissMode="none">
                    {props.children}
                </BottomSheetScrollView></>
                }
            </BottomSheetModal></BottomSheetModalProvider>
    )
}