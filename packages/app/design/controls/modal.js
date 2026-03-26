import { useEffect, useCallback, useRef } from 'react';
import { Modal as ModalDef, Platform } from 'react-native'
import { Pressable, View, ScrollView, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { appSetting } from 'app/lib/util'
import { RemoveScroll } from 'react-remove-scroll';
import { useSafeAreaInsets } from 'app/lib/hooks/router'
import { useIsDesktop, useActualWindowHeight } from 'app/context/measure';
import { Button } from 'app/design/controls/buttons';
import emitter from 'app/context/emitter';

const isWeb = Platform.OS === 'web';
const isIosWeb = isWeb && typeof navigator !== 'undefined' && /iP(hone|od|ad)/.test(navigator.userAgent);

const modalSettings = appSetting('theme', 'modal');

function ModalHeader({ title, headerBorder, onClose }) {
    const align = !title && onClose ? 'end' : 'center';
    if (!title) return null;
    const type = typeof title;
    return (
        <Row className={`items-center justify-${align} ${headerBorder && modalSettings.header}`}>
            {(title && type === 'string') && (
                <View className='flex-auto absolute left-0 right-0'>
                    <Text className='text-xl text-center leading-9 font-bold text-card-foreground'>{title}</Text>
                </View>
            )}
            {(title && type !== 'string') && (title)}
            {(onClose && type === 'string') && (
                <View className='ml-auto'>
                    <Button variant='secondary' size='sm' rounded startDecorator='X' onPress={onClose} />
                </View>
            )}
        </Row>
    );
}

export function Modal({
    animation,
    position = 'center',
    onClose,
    outerClickClose = true,
    onVisible,
    title,
    headerBorder = true,
    maxWidth = 'max-w-3xl',
    children,
    padding = 'p-4',
    autoHeight = false,
    scrollable = false,
}) {
    const isIos = Platform.OS === 'ios';
    const isDesktop = useIsDesktop();
    const heightActual = useActualWindowHeight();
    const insets = useSafeAreaInsets();
    const fogRef = useRef(null);

    useEffect(() => {
        if (!isIosWeb || !window.visualViewport) return;
        const update = () => {
            if (!fogRef.current) return;
            fogRef.current.style.transform = `translateY(${window.visualViewport.offsetTop}px)`;
        };
        window.visualViewport.addEventListener('resize', update);
        window.visualViewport.addEventListener('scroll', update);
        return () => {
            window.visualViewport.removeEventListener('resize', update);
            window.visualViewport.removeEventListener('scroll', update);
        };
    }, []);

    useEffect(() => {
        const subscription = emitter.addListener('link', (data) => {
            if (data.action == 'pressed') {
                onClose();
            }
        })

        return () => {
            subscription.remove()
        }
    }, [onClose])

    // Cleanup guard to prevent removeChild errors
    /*useEffect(() => {
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
    }, []);*/


    const offset = (title ? 64 : isIos ? insets?.bottom + insets?.top : 0);
    const styles = { maxHeight: heightActual - offset - (isDesktop ? 32 : 0) }
    const animationType = animation || (isDesktop ? 'fade' : 'slide');
    const isOuterClose = (onClose !== 'undefined' && outerClickClose !== false);
    const positionClasses = {
        'top': 'items-start py-8 px-4',
        'bottom': 'items-end py-8 px-4',
        'center': 'sm:items-center items-start ',
    };
    const sClassPosition = positionClasses[position] || positionClasses['center'];
    const Cnt = scrollable ? ScrollView : View


    const handleWebOuterPress = useCallback((event) => {
        if (isOuterClose) {
            onClose()
        }
        event.stopPropagation();
    }, [isOuterClose, onClose]);

    const handleNativeOuterPress = useCallback(() => {
        emitter.emit('editor', { action: 'blur' });
        /*  if (isOuterClose) {
                            onClose()
                        }*/
    }, [isOuterClose, onClose]);

    const handleContentPress = useCallback((event) => {
        event.stopPropagation();
    }, []);


    const content = <><ModalHeader
        title={title}
        headerBorder={headerBorder}
        onClose={onClose}
    />
        <Cnt style={styles} className={`${padding} flex-auto `}>
            <Pressable
                onPress={handleContentPress}
                className="flex-auto"
            >
                {children}
            </Pressable>
        </Cnt></>

    if (isWeb) {
        return (
            <ModalDef visible={onVisible} animationType={animationType} transparent={true}>
                <Pressable
                    ref={fogRef}
                    style={!isDesktop && isIosWeb ? { transition: 'transform 0.25s ease-out' } : undefined}
                    className={`pointerEvents cursor-default flex justify-start w-full h-full sm:items-center items-start overflow-hidden ${modalSettings.fog} `}/* justify-start for post form small web */
                    onPress={handleWebOuterPress}
                >
                    {isDesktop ?
                        <RemoveScroll className={`flex-1 flex flex-col w-full sm:justify-center ${autoHeight && 'justify-center'} overflow-hidden`} >
                            <View style={{ height: isDesktop || autoHeight ? 'auto' : heightActual }} className={`w-full ${maxWidth} left-0 right-0 z-50 w-full mx-auto overflow-hidden ${modalSettings.container} `}>
                                {content}
                            </View>
                        </RemoveScroll>
                        :
                        <View style={{ height: isDesktop || autoHeight ? 'auto' : heightActual }} className={`w-full ${maxWidth} left-0 right-0 z-50 w-full mx-auto overflow-hidden ${modalSettings.container} `}>
                            <RemoveScroll className={`flex-1 flex flex-col w-full sm:justify-center ${autoHeight && 'justify-center'} overflow-hidden`} >
                                {content}
                            </RemoveScroll>
                        </View>}

                </Pressable>
            </ModalDef>
        )
    }
    else {
        return (
            <ModalDef visible={onVisible} animationType={animationType} transparent={isWeb}>
                <Pressable
                    className={`pointerEvents cursor-default flex justify-end w-full h-full ${modalSettings.fog}`}
                    onPress={handleNativeOuterPress}
                >
                    <View style={{ paddingTop: insets?.top, paddingBottom: insets?.bottom }} className={`flex-row justify-center left-0 right-0 z-50 w-full overflow-x-hidden overflow-y-auto h-full h-modal ${sClassPosition}`}>
                        <View className={`w-full ${maxWidth}  ${modalSettings.container} `}>
                            <View className={`h-full ${modalSettings.content}`}>
                                <ModalHeader
                                    title={title}
                                    headerBorder={headerBorder}
                                    onClose={onClose}
                                />
                                <Cnt style={styles} className={`${padding} flex-auto `}>
                                    {children}
                                </Cnt>
                            </View>
                        </View>
                    </View>
                </Pressable>
            </ModalDef>
        );
    }
}