import { useEffect, useCallback, useRef } from 'react';
import { Modal as ModalDef, Platform } from 'react-native'
import { Pressable, View, ScrollView, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { appSetting } from 'app/lib/util'
import { RemoveScroll } from 'react-remove-scroll';
import { useSafeAreaInsets } from 'app/lib/hooks/router'
import { useIsDesktop, useActualWindowHeight } from 'app/context/measure';
import { NeoButton } from 'app/design/controls/neo-button';
import emitter from 'app/context/emitter';
import { confirmDiscardUnsavedFormChanges } from 'app/lib/form-helpers';
import { ModalKbAwareScroll } from 'app/ui/atoms/kb-avoiding-view';

const isWeb = Platform.OS === 'web';
const isIosWeb = isWeb && typeof navigator !== 'undefined' && /iP(hone|od|ad)/.test(navigator.userAgent);
const isIPadWeb =
    isWeb &&
    typeof navigator !== 'undefined' &&
    (
        /iPad/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
const modalSettings = appSetting('theme', 'modal');

function ModalHeader({ title, headerBorder, onClose }) {
    const align = !title && onClose ? 'end' : 'center';
    if (!title) return null;
    const type = typeof title;
    return (
        <Row className={`items-center justify-${align} ${headerBorder && modalSettings.header}`}>
            {(title && type === 'string') && (
                <View className='flex-1 px-16  absolute left-0 right-0 top-0 bottom-0 justify-center items-center'>
                    <Text className='text-xl text-center h-14 leading-14 font-bold text-card-foreground'
                        numberOfLines={1}
                        ellipsizeMode='tail'
                    >{title}</Text>
                </View>
            )}
            {(title && type !== 'string') && (title)}
            {(onClose && type === 'string') && (
                <View className='absolute right-3 top-0 bottom-0 justify-center items-center'>
                    <NeoButton style="bordered" controlSize="regular" borderShape="circle" image="X" accessibilityLabel="Close" onPress={onClose} />
                </View>
            )}
        </Row>
    );
}

export function Modal({
    animation,
    position = 'center',
    onClose,
    onRequestClose,
    outerClickClose = true,
    onVisible,
    title,
    headerBorder = true,
    maxWidth = 'max-w-3xl',
    children,
    padding = 'p-4',
    autoHeight = false,
    scrollable = false,
    skipUnsavedGuard = false,
}) {
    const isIos = Platform.OS === 'ios';
    const isDesktop = useIsDesktop();
    const { height: heightActual1, isKeyboardOpen } = useActualWindowHeight();

    const heightActual = isKeyboardOpen ? heightActual1 + 96 : heightActual1;
    const insets = useSafeAreaInsets();
    const fogRef = useRef(null);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (!isIosWeb || !window.visualViewport) return;
        const update = () => {
            if (!fogRef.current) return;
            const vv = window.visualViewport;
            const offsetTop = vv?.offsetTop ?? 0;
            if (isIPadWeb) {
                fogRef.current.style.marginTop = `${offsetTop}px`;
                fogRef.current.style.height = `${vv.height}px`;
            } else {
                fogRef.current.style.marginTop = `${offsetTop}px`;
                fogRef.current.style.height = '';
            }
        };
        window.visualViewport.addEventListener('resize', update);
        window.visualViewport.addEventListener('scroll', update);
        return () => {
            window.visualViewport.removeEventListener('resize', update);
            window.visualViewport.removeEventListener('scroll', update);
            if (fogRef.current) {
                fogRef.current.style.marginTop = '';
                fogRef.current.style.height = '';
            }
        };
    }, []);

    const tryClose = useCallback(async () => {
        if (typeof onClose !== 'function') return;
        if (!skipUnsavedGuard) {
            const proceed = await confirmDiscardUnsavedFormChanges();
            if (!proceed) return;
        }
        onClose();
    }, [onClose, skipUnsavedGuard]);

    const tryRequestClose = useCallback(async () => {
        const handler = onRequestClose ?? onClose;
        if (typeof handler !== 'function') return;
        if (!skipUnsavedGuard) {
            const proceed = await confirmDiscardUnsavedFormChanges();
            if (!proceed) return;
        }
        handler();
    }, [onRequestClose, onClose, skipUnsavedGuard]);

    useEffect(() => {
        const subscription = emitter.addListener('link', (data) => {
            if (data.action == 'pressed') {
                tryClose();
            }
        })

        return () => {
            subscription.remove()
        }
    }, [tryClose])

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


    const offset = (title ? 56 : isIos ? insets?.bottom + insets?.top : 0);
    const styles = { maxHeight: heightActual - offset - (isDesktop ? 0 : 0) }
    const animationType = animation || (isDesktop ? 'fade' : 'slide');
    const isOuterClose = (typeof onClose === 'function' && outerClickClose !== false);
    const positionClasses = {
        'top': 'items-start py-8 px-4',
        'bottom': 'items-end py-8 px-4',
        'center': 'sm:items-center items-start ',
    };
    const sClassPosition = positionClasses[position] || positionClasses['center'];
    const Cnt = scrollable ? (isWeb ? ScrollView : ModalKbAwareScroll) : View
    const modalBottomOffset = 24 + (isIos ? (insets?.bottom ?? 0) : 0)


    const handleWebOuterPress = useCallback((event) => {
        if (isOuterClose) {
            tryClose();
        }
        event.stopPropagation();
    }, [isOuterClose, tryClose]);

    const handleNativeOuterPress = useCallback(() => {
        emitter.emit('editor', { action: 'blur' });
        /*  if (isOuterClose) {
                            onClose()
                        }*/
    }, [isOuterClose, onClose]);

    const handleContentPress = useCallback((event) => {
        event.stopPropagation();
    }, []);

    const handleRequestClose = useCallback(() => {
        tryRequestClose();
    }, [tryRequestClose]);

    useEffect(() => {
        if (!isWeb || !scrollable || !onVisible) return;

        const normalizeWheelDelta = (deltaY, deltaMode = 0) => {
            if (deltaMode === 1) return deltaY * 16;
            if (deltaMode === 2) return deltaY * (window.innerHeight || 0);
            return deltaY;
        };

        const scrollModalBy = (deltaY, deltaMode = 0) => {
            const scrollEl = scrollRef.current;
            if (!scrollEl || scrollEl.scrollHeight <= scrollEl.clientHeight) return;
            scrollEl.scrollTop += normalizeWheelDelta(deltaY, deltaMode);
        };

        const isEditorIframeMessage = (event) => {
            const source = event.source;
            if (!source || source === window) return false;
            return Array.from(document.querySelectorAll('iframe')).some(
                (iframe) => iframe.contentWindow === source
            );
        };

        const onWheel = (event) => {
            const scrollEl = scrollRef.current;
            if (!scrollEl || scrollEl.scrollHeight <= scrollEl.clientHeight) return;

            const fog = fogRef.current;
            if (!fog || !fog.contains(event.target)) return;

            const target = event.target;

            // TenTap iframe forwards wheel via postMessage — skip to avoid double scroll.
            if (target instanceof HTMLIFrameElement && scrollEl.contains(target)) {
                return;
            }

            if (target instanceof Node && scrollEl.contains(target)) return;

            let el = target instanceof Node ? target : null;
            while (el && el !== fog) {
                if (el !== scrollEl) {
                    const { overflowY } = window.getComputedStyle(el);
                    if (
                        (overflowY === 'auto' || overflowY === 'scroll') &&
                        el.scrollHeight > el.clientHeight
                    ) {
                        return;
                    }
                }
                el = el.parentElement;
            }

            event.preventDefault();
            scrollModalBy(event.deltaY, event.deltaMode);
        };

        const onMessage = (event) => {
            if (!isEditorIframeMessage(event)) return;

            let data = event.data;
            if (typeof data === 'string') {
                try {
                    data = JSON.parse(data);
                } catch {
                    return;
                }
            }
            if (data?.type !== 'neo-modal-wheel') return;

            scrollModalBy(data.deltaY, data.deltaMode);
        };

        document.addEventListener('wheel', onWheel, { passive: false, capture: true });
        window.addEventListener('message', onMessage);
        return () => {
            document.removeEventListener('wheel', onWheel, { capture: true });
            window.removeEventListener('message', onMessage);
        };
    }, [scrollable, onVisible]);

    const content = <><ModalHeader
        title={title}
        headerBorder={headerBorder}
        onClose={tryClose}
    />
        <Cnt
            ref={scrollable && isWeb ? scrollRef : undefined}
            style={!isDesktop && isWeb ? {} : styles}
            className={`${padding} flex-auto `}
        >
            <Pressable
                onPress={handleContentPress}
                className="flex-auto web:cursor-default"
            >
                {children}
            </Pressable>
        </Cnt></>

    if (isWeb) {
        return (
            <ModalDef visible={onVisible} animationType={animationType} transparent={true} onRequestClose={handleRequestClose}>
                <Pressable
                    ref={fogRef}
                    style={undefined}
                    className={`pointerEvents cursor-default flex justify-start w-full h-full sm:items-center items-start overflow-hidden ${modalSettings.fog} `}/* justify-start for post form small web */
                    onPress={handleWebOuterPress}
                >
                    <RemoveScroll className={`flex-1  flex flex-col w-full sm:justify-center ${autoHeight && 'justify-center'} overflow-hidden`} >
                        <View style={{paddingBottom: isKeyboardOpen ? 96 : 0, height: (isDesktop && !isIPadWeb) || autoHeight ? 'auto' : heightActual }} className={`w-full ${maxWidth} left-0 right-0 z-50 w-full mx-auto ${modalSettings.container} `}>
                       
                            {content}

                        </View>
                    </RemoveScroll>
                </Pressable>
            </ModalDef>
        )
    }
    else {
        return (
            <ModalDef visible={onVisible} animationType={animationType} transparent={isWeb} onRequestClose={handleRequestClose}>
                <View
                    className={`pointerEvents cursor-default flex justify-end w-full h-full ${modalSettings.fog}`}
                    onPress={handleNativeOuterPress}
                >
                    <View style={{ paddingTop: insets?.top, paddingBottom: insets?.bottom }} className={`flex-row ${autoHeight ? ' items-center  ' : sClassPosition} justify-center   left-0 right-0 z-50 w-full overflow-x-hidden overflow-y-auto h-full h-modal`}>
                        <View className={`w-full  ${maxWidth}  ${modalSettings.container}  ${autoHeight ? 'rounded-2xl ' : ''}`}>
                            <View className={`${autoHeight ? '' : 'h-full'} ${modalSettings.content}`}>
                                <ModalHeader
                                    title={title}
                                    headerBorder={headerBorder}
                                    onClose={tryClose}
                                />
                                <Cnt style={styles} className={`${padding} flex-auto `} {...(scrollable ? { bottomOffset: modalBottomOffset } : {})}>
                                    {children}
                                </Cnt>
                            </View>
                        </View>
                    </View>
                </View>
            </ModalDef>
        );
    }
}