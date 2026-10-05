import { useEffect, useCallback, useRef, type ComponentType, type ReactNode, type Ref } from 'react';
import { Modal as ModalDef, Platform } from 'react-native'
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { Pressable, View, ScrollView, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { appSetting } from 'app/lib/util'
import { RemoveScroll } from 'react-remove-scroll';
import { useStableSafeAreaInsets } from 'app/lib/hooks/router'
import { useIsDesktop, useActualWindowHeight } from 'app/context/measure';
import { NeoButton } from 'app/design/controls/neo-button/neo-button';
import emitter, { EVENTS } from 'app/context/emitter';
import { confirmDiscardUnsavedFormChanges, pushDiscardConfirmAnchor } from 'app/lib/form/form-helpers';
import { ModalKbAwareScroll } from 'app/ui/atoms/kb-avoiding-view';
import { pushFormEnsureVisibleHandler, scrollContainerByDelta } from 'app/lib/form/form-ensure-visible';
import { useTranslation } from 'react-i18next';

function NativeModalSafePad({ autoHeight, sClassPosition, children }: { autoHeight: boolean; sClassPosition: string; children?: ReactNode }) {
    const insets = useStableSafeAreaInsets();
    return (
        <View
            style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
            className={`flex-row ${autoHeight ? ' items-center  ' : sClassPosition} justify-center   left-0 right-0 z-50 w-full overflow-x-hidden overflow-y-auto h-full h-modal`}
        >
            {children}
        </View>
    );
}

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
// Topmost modal wins Escape. Menus that preventDefault on the same keydown run first.
const webModalEscapeStack: symbol[] = [];

function ModalHeader({ title, headerBorder, onClose, closeRef }: { title?: ReactNode; headerBorder: boolean; onClose?: () => void; closeRef?: Ref<any> }) {
    const { t } = useTranslation();
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
                <View ref={closeRef} className='absolute right-3 top-0 bottom-0 justify-center items-center'>
                    <NeoButton style="glass" controlSize="regular" borderShape="circle" image="X" accessibilityLabel={t('Close')} onPress={onClose} />
                </View>
            )}
        </Row>
    );
}

export type ModalProps = {
    /** Show the modal (legacy name). */
    onVisible?: boolean;
    onClose?: () => void;
    /** Android back / Escape; defaults to onClose. */
    onRequestClose?: () => void;
    /** Close on backdrop click (web). */
    outerClickClose?: boolean;
    /** String title renders the header with a close button; an element renders as-is. */
    title?: ReactNode;
    headerBorder?: boolean;
    /** RN Modal animation; defaults to fade on desktop, slide elsewhere. */
    animation?: 'none' | 'slide' | 'fade';
    position?: 'top' | 'bottom' | 'center';
    /** Tailwind max-width class. */
    maxWidth?: string;
    /** Tailwind padding class for the body. */
    padding?: string;
    autoHeight?: boolean;
    scrollable?: boolean;
    /** Skip the "discard unsaved form changes?" confirm on close. */
    skipUnsavedGuard?: boolean;
    children?: ReactNode;
};

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
}: ModalProps) {
    const isIos = Platform.OS === 'ios';
    const isDesktop = useIsDesktop();
    const { height: heightActual1, isKeyboardOpen } = useActualWindowHeight();

    const heightActual = isKeyboardOpen ? heightActual1 + 96 : heightActual1;
    const insets = useStableSafeAreaInsets();
    const fogRef = useRef<any>(null);
    const closeRef = useRef<any>(null);
    const scrollRef = useRef<any>(null);
    const scrollYRef = useRef(0);

    const handleScroll = useCallback((event: any) => {
        const y = event?.nativeEvent?.contentOffset?.y;
        if (typeof y === 'number') scrollYRef.current = y;
    }, []);

    useEffect(() => {
        if (!scrollable || !onVisible) return undefined;

        return pushFormEnsureVisibleHandler(({ windowY }: { windowY: number }) => {
            const scrollView = scrollRef.current;
            if (!scrollView) return;

            // Keep field near the top of the modal viewport (below header).
            const modalTop =
                typeof scrollView.getBoundingClientRect === 'function'
                    ? scrollView.getBoundingClientRect().top
                    : 0;
            const target = modalTop + 24 + (title ? 8 : 0);
            const delta = windowY - target;
            scrollContainerByDelta(scrollView, delta, scrollYRef.current);
            if (typeof scrollView.scrollTop === 'number') {
                scrollYRef.current = scrollView.scrollTop;
            } else {
                scrollYRef.current = Math.max(0, scrollYRef.current + delta);
            }
        });
    }, [scrollable, onVisible, title]);

    useEffect(() => {
        if (!isIosWeb || !window.visualViewport) return;
        const update = () => {
            if (!fogRef.current) return;
            // Only subscribed when visualViewport exists (checked above).
            const vv = window.visualViewport!;
            const offsetTop = vv?.offsetTop ?? 0;
            if (isIPadWeb) {
                fogRef.current.style.marginTop = `${offsetTop}px`;
                fogRef.current.style.height = `${vv.height}px`;
            } else {
                fogRef.current.style.marginTop = `${offsetTop}px`;
                fogRef.current.style.height = '';
            }
        };
        window.visualViewport!.addEventListener('resize', update);
        window.visualViewport!.addEventListener('scroll', update);
        return () => {
            window.visualViewport!.removeEventListener('resize', update);
            window.visualViewport!.removeEventListener('scroll', update);
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
        const subscription = emitter.addListener(EVENTS.link, (data: { action?: string }) => {
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
    const sClassPosition = positionClasses[position] || positionClasses.center;
    const Cnt: ComponentType<any> = scrollable ? (isWeb ? ScrollView : ModalKbAwareScroll) : View
    const modalBottomOffset = 24 + (insets?.bottom ?? 0)


    const handleWebOuterPress = useCallback((event: any) => {
        if (isOuterClose) {
            tryClose();
        }
        event.stopPropagation();
    }, [isOuterClose, tryClose]);

    const handleContentPress = useCallback((event: any) => {
        event.stopPropagation();
    }, []);

    const handleRequestClose = useCallback(() => {
        tryRequestClose();
    }, [tryRequestClose]);

    useEffect(() => {
        const isShown = onVisible == null ? true : !!onVisible;
        if (!isWeb || !isShown) return undefined;

        const id = Symbol('modal');
        webModalEscapeStack.push(id);
        const isTop = () => webModalEscapeStack[webModalEscapeStack.length - 1] === id;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape' || event.defaultPrevented || !isTop()) return;
            // Let a menu/popover opened inside the modal consume Escape first.
            queueMicrotask(() => {
                if (event.defaultPrevented || !isTop()) return;
                tryRequestClose();
            });
        };

        const onMessage = (event: MessageEvent) => {
            const source = event.source;
            if (!source || source === window || !isTop()) return;
            const fromEditorFrame = Array.from(document.querySelectorAll('iframe')).some(
                (iframe) => iframe.contentWindow === source
            );
            if (!fromEditorFrame) return;

            let data = event.data;
            if (typeof data === 'string') {
                try {
                    data = JSON.parse(data);
                } catch {
                    return;
                }
            }
            if (data?.type !== 'neo-modal-escape') return;
            tryRequestClose();
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('message', onMessage);
        return () => {
            const index = webModalEscapeStack.lastIndexOf(id);
            if (index !== -1) webModalEscapeStack.splice(index, 1);
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('message', onMessage);
        };
    }, [onVisible, tryRequestClose]);

    useEffect(() => {
        const isShown = onVisible == null ? true : !!onVisible;
        if (!isWeb || !isShown || skipUnsavedGuard) return undefined;
        return pushDiscardConfirmAnchor(() => closeRef.current);
    }, [onVisible, skipUnsavedGuard]);

    useEffect(() => {
        if (!isWeb || !scrollable || !onVisible) return;

        const normalizeWheelDelta = (deltaY: number, deltaMode = 0) => {
            if (deltaMode === 1) return deltaY * 16;
            if (deltaMode === 2) return deltaY * (window.innerHeight || 0);
            return deltaY;
        };

        const scrollModalBy = (deltaY: number, deltaMode = 0) => {
            const scrollEl = scrollRef.current;
            if (!scrollEl || scrollEl.scrollHeight <= scrollEl.clientHeight) return;
            scrollEl.scrollTop += normalizeWheelDelta(deltaY, deltaMode);
        };

        const isEditorIframeMessage = (event: MessageEvent) => {
            const source = event.source;
            if (!source || source === window) return false;
            return Array.from(document.querySelectorAll('iframe')).some(
                (iframe) => iframe.contentWindow === source
            );
        };

        const onWheel = (event: WheelEvent) => {
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

            let el: Element | null = target instanceof Element ? target : null;
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

        const onMessage = (event: MessageEvent) => {
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
        closeRef={closeRef}
    />
        <Cnt
            ref={scrollable ? scrollRef : undefined}
            onScroll={scrollable ? handleScroll : undefined}
            scrollEventThrottle={scrollable ? 16 : undefined}
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
                <SafeAreaProvider initialMetrics={initialWindowMetrics}>
                    <View
                        className={`pointerEvents cursor-default flex justify-end w-full h-full ${modalSettings.fog}`}
                    >
                        <NativeModalSafePad autoHeight={autoHeight} sClassPosition={sClassPosition}>
                            <View className={`w-full  ${maxWidth}  ${modalSettings.container}  ${autoHeight ? 'rounded-2xl ' : ''}`}>
                                <View className={`${autoHeight ? '' : 'h-full'} ${modalSettings.content}`}>
                                    <ModalHeader
                                        title={title}
                                        headerBorder={headerBorder}
                                        onClose={tryClose}
                                    />
                                    <Cnt
                                        ref={scrollable ? scrollRef : undefined}
                                        onScroll={scrollable ? handleScroll : undefined}
                                        scrollEventThrottle={scrollable ? 16 : undefined}
                                        style={styles}
                                        className={`${padding} flex-auto `}
                                        {...(scrollable ? { bottomOffset: modalBottomOffset } : {})}
                                    >
                                        {children}
                                    </Cnt>
                                </View>
                            </View>
                        </NativeModalSafePad>
                    </View>
                </SafeAreaProvider>
            </ModalDef>
        );
    }
}
