import React, { useMemo, forwardRef, useEffect, useCallback } from 'react';
import { TextInput as TextInputDef, Modal as ModalDef, Platform } from 'react-native'
import { Pressable, View, ScrollView, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'
import { appSetting, isEmoji, LAYOUT_BREAKPOINTS } from 'app/lib/util'
import { Picker as PickerDef } from '@react-native-picker/picker';
import { Theme, ThemeName } from 'app/design/theme';
import Tooltip from 'app/ui/atoms/tooltip';
import Loading from 'app/ui/atoms/loading'
import { RemoveScroll } from 'react-remove-scroll';
import { useSafeAreaInsets } from 'app/lib/hooks/router'
import { useIsDesktop, useBreakpoint, useWindowHeight } from 'app/context/measure';
import  { Button } from 'app/design/controls/buttons';

const isWeb = Platform.OS === 'web';

const modalSettings = appSetting('theme', 'modal');

export function Modal({
    animation,
    position = 'center',
    onClose,
    outerClickClose = true,
    onVisible,
    title,
    textAlign = 'center',
    headerBorder = true,
    fullWidth = true,
    maxWidth = 'max-w-3xl',
    children,
    padding = " p-4 ",
    scrollable = false,
    autoHeight = false,
    usePadding = false
}) {
    const isIos = Platform.OS === 'ios';
    // Cleanup guard to prevent removeChild errors
    useEffect(() => {
        return () => {
            // Cleanup function to prevent removeChild errors
            if (isWeb && typeof window !== 'undefined' && document.body) {
                const portals = document.querySelectorAll('[data-react-native-modal]');
                portals.forEach(portal => {
                    if (portal.parentNode) {
                        try {
                            portal.parentNode.removeChild(portal);
                        } catch (e) {
                            // Ignore removeChild errors - they're harmless
                        }
                    }
                });
            }
        };
    }, []);
    const currentBreakpoint = useBreakpoint();
    const height = useWindowHeight();
    const insets = useSafeAreaInsets();
    const offset = (title ? 64 : isIos ? insets?.bottom + insets?.top : 0);

    if (!animation){
        animation = currentBreakpoint >= LAYOUT_BREAKPOINTS.md ? 'fade' : 'slide';
    }

    const styles = !autoHeight ? { maxHeight: height - offset } : {};


    const isOuterClose = (onClose !== 'undefined' && outerClickClose !== false);
    const positionClasses = {
        'top': 'items-start py-8 px-4',
        'bottom': 'items-end py-8 px-4',
        'center': autoHeight ? 'items-center' : 'sm:items-center items-start ',
    };

    const sClassPosition = positionClasses[position] || positionClasses['center'];

    const align = !title && onClose ? 'end' : textAlign;

    const type = typeof title;

    const Cnt = scrollable ? ScrollView : View

    const layoutShift = isWeb ? 'sm' : '2xl';

    if (!title && padding == " p-4 sm:pt-0  "){
        padding = 'p-4';
    }

    const isDesktop = useIsDesktop();
    

    const styles2 = isDesktop ? {} : {height: height};
    if (!isDesktop && !autoHeight){
        styles2.height = height;
    }
    
    const viewportHeight = isWeb ? (window?.innerHeight ?? 0) : 0;
    const viewportOffset = isWeb && usePadding ? Math.max(0, viewportHeight - height) : 0;

    if (isWeb) {
        const Content = (
            <View style={{ height: height - (isWeb ? 0 : insets?.bottom + insets?.top) }} className={`justify-center left-0 right-0 z-50 w-full overflow-x-hidden h-full overflow-y-hidden ${layoutShift}:inset-0  ${sClassPosition}`}>
                <View style={styles2} className={`w-full ${maxWidth} ${fullWidth ? '' : `${layoutShift}:w-auto`} ${modalSettings.container} `}>
                    <View style={styles2} className={`${modalSettings.content}`}>
                        {
                            (title) && <Row className={`items-center justify-${align} ${headerBorder && modalSettings.header} `}>
                                {(title && type === 'string') && (
                                    <View className='flex-auto absolute left-0 right-0'>
                                        <Text className='text-xl text-center leading-9 font-bold text-card-foreground '>{title}</Text>
                                    </View>
                                )}
                                {(title && type !== 'string') && (title)}
                                {(onClose && type === 'string') && (
                                    <View className='ml-auto'>
                                        <Button variant='secondary' size='sm' rounded startDecorator='X' onPress={onClose} />
                                    </View>
                                )}
                            </Row>
                        }

                        <Cnt style={styles} className={`${padding} flex-auto`}>
                            <Pressable
                                onPress={(event) => {
                                    event.stopPropagation();
                                }}
                                className="flex-auto"
                            >
                                {children}
                            </Pressable>
                        </Cnt>
                    </View>
                </View>
            </View>)

        return (
            <ModalDef visible={onVisible} animationType={animation} transparent={isWeb}>
                <Pressable style={{ ...styles2, marginTop: viewportOffset }} className={`pointerEvents cursor-default flex justify-end w-full 
                ${modalSettings.fog}`}
                    onPress={(event) => {
                        if (isOuterClose) {
                            onClose()
                        }
                        event.stopPropagation();
                    }}
                >
                    {isWeb ? <RemoveScroll className='flex-1'>{Content}</RemoveScroll> : Content}</Pressable>
            </ModalDef>
        );
    }
    else {
        const Content = (
            <View style={{ paddingTop: insets?.top }} className={`flex-row justify-center left-0 right-0 z-50 w-full overflow-x-hidden overflow-y-auto ${layoutShift}:inset-0 h-full h-modal ${sClassPosition}`}>
                <View className={`w-full ${maxWidth} ${fullWidth ? '' : `${layoutShift}:w-auto`} relative ${modalSettings.container.replaceAll("{ls}", layoutShift)} `}>
                    <View className={`relative ${!autoHeight ? 'h-full' : ''} ${modalSettings.content.replaceAll("{ls}", layoutShift)}`}>
                        {
                            (title) && <Row className={`items-center justify-${align} ${headerBorder && modalSettings.header} `}>
                                {(title && type === 'string') && (
                                    <View className='flex-auto absolute left-0 right-0'>
                                        <Text className='text-xl text-center leading-9 font-bold text-card-foreground '>{title}</Text>
                                    </View>
                                )}
                                {(title && type !== 'string') && (title)}
                                {(onClose && type === 'string') && (
                                    <View className='ml-auto'>
                                        <Button variant='secondary' size='sm' rounded startDecorator='X' onPress={onClose} />
                                    </View>
                                )}
                            </Row>
                        }
                        <Cnt style={styles} className={`${padding} flex-auto `}>{children}</Cnt>
                    </View>
                </View>
            </View>)

        return (
            <ModalDef visible={onVisible} animationType={animation} transparent={isWeb}>
                <Pressable className={`pointerEvents cursor-default flex justify-end w-full h-full 
                    ${modalSettings.fog}`}
                    onPress={(event) => { isOuterClose ? onClose : undefined; event.stopPropagation(); }}
                >
                    {isWeb ? <RemoveScroll className='flex-1'>{Content}</RemoveScroll> : Content}
                </Pressable>
            </ModalDef>
        );
    }
}