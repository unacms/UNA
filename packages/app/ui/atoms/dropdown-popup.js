import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { clsx } from 'clsx';
import {
    Modal as ModalBase,
    Platform
} from 'react-native';
import { Pressable, ScrollView, View } from 'app/design/view'
import { RemoveScroll } from 'react-remove-scroll';
import { appSetting } from 'app/lib/util';
import { useIsDesktop, useWindowSize } from 'app/context/measure';
import emitter from 'app/context/emitter';
import { Button, ButtonRef, NeoButtonRef } from 'app/design/controls'
const dropdownTheme = appSetting('theme', 'dropdown');

export default function DropdownPopup({
    buttonProps,
    children,
    open,
    onOpenChange,
    trigger,
    minPopupWidth = 256,
    defaultOpen = false,
    showOnTop = false,
    contentClasses = dropdownTheme?.cnt,
    hoverMode = false, // When true, allows page scroll while popup is open
    /** When true (e.g. tabs "More"), open the menu when the trigger subtree receives focus (Tab or roving arrows). */
    openOnFocus = false,
    /** Merged after `contentClasses` (e.g. `overflow-visible` so focus rings are not clipped). */
    contentClassName = '',
}) {
    const buttonRef = useRef(null);
    const isDesktop = useIsDesktop();
    const contentRef = useRef(null);
    const [buttonPos, setButtonPos] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const { width: windowWidth, height: windowHeight } = useWindowSize();
    const isWeb = useMemo(() => Platform.OS === 'web', []);
    const isIos = useMemo(() => Platform.OS == 'ios', []);

    const animation = useMemo(
        () => (isDesktop ? 'fade' : 'none'),
        [isDesktop]
    );
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [isModalVisible, setIsModalVisible] = useState(false);

    const isControlledOutside =
        open !== undefined && typeof onOpenChange === 'function';
    const isRealOpen = isControlledOutside ? open : isOpen;

    useEffect(() => {
        const subscription = emitter.addListener('link', (data) => {
            if (data.action == 'pressed') {
                if (onOpenChange) {
                    onOpenChange(false);
                }
            }
        })

        return () => {
            subscription.remove()
        }
    }, [onOpenChange])

    useEffect(() => {
        // Add safety checks for modal state
        if (isRealOpen) {
            // Only set modal visible if it's not already visible
            if (!isModalVisible) {
                setIsModalVisible(true);
            }

        } else {
            setIsModalVisible(false);
        }
    }, [isRealOpen, isModalVisible]);

    const measureElement = useCallback((node, callback) => {
        if (!node) return false;

        if (node.measureInWindow) {
            node.measureInWindow(callback);
            return true;
        }

        if (isWeb && node.getBoundingClientRect) {
            const rect = node.getBoundingClientRect();
            callback(rect.left, rect.top, rect.width, rect.height);
            return true;
        }

        return false;
    }, [isWeb]);

    const updateButtonPosition = useCallback(() => {
        if (!measureElement(buttonRef.current, (x, y, width, height) => {
            requestAnimationFrame(() => {
                const popupWidth = Math.min(Math.max(minPopupWidth, width), windowWidth - 32);
                const preferredTop = y + height + (isWeb || isIos ? 8 : 36);
                const roomBelow = windowHeight - preferredTop - 16;
                const roomAbove = y - 24;
                const shouldOpenAbove = showOnTop || (roomBelow < 240 && roomAbove > roomBelow);

                let left = x;
                if (x + popupWidth > windowWidth - 16) {
                    left = windowWidth - popupWidth - 16;
                }
                if (left < 16) left = 16;

                let top = shouldOpenAbove ? 16 : preferredTop;
                let maxHeight = shouldOpenAbove ? Math.max(120, roomAbove) : Math.max(120, roomBelow);

                if (top == 0) top = 1;
                if (shouldOpenAbove) {
                    top = Math.max(16, y - Math.min(maxHeight, windowHeight - 32) - 8);
                    maxHeight = Math.max(120, y - top - 8);
                }

                setButtonPos({
                    x: left,
                    y: top,
                    width,
                    height,
                    maxHeight
                });
            });
        })) return;
    }, [isIos, isWeb, measureElement, minPopupWidth, showOnTop, windowHeight, windowWidth]);

    const handleToggle = useCallback(
        (bOpen) => {
            if (isControlledOutside) {
                onOpenChange(bOpen);
            } else {
                setIsOpen(bOpen);
            }
        },
        [isControlledOutside, onOpenChange]
    );

    useEffect(() => {
        if (isRealOpen) {
            updateButtonPosition();
            if (isWeb) {
                window.addEventListener('resize', updateButtonPosition);
                return () =>
                    window.removeEventListener('resize', updateButtonPosition);
            }
        }
    }, [isRealOpen, updateButtonPosition]);

    /** Reposition when any scrollable ancestor scrolls (menu stays anchored to trigger). */
    useEffect(() => {
        if (!isWeb || !isRealOpen) return;
        const onScroll = () => updateButtonPosition();
        window.addEventListener('scroll', onScroll, true);
        return () => window.removeEventListener('scroll', onScroll, true);
    }, [isWeb, isRealOpen, updateButtonPosition]);

    // Escape closes (web)
    useEffect(() => {
        if (!isWeb || !isRealOpen) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                handleToggle(false);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isWeb, isRealOpen, handleToggle]);

    const handleBackdropPress = (event) => {
        event.stopPropagation();
        handleToggle(false);
    };

    const Content = (
        <View
            ref={contentRef}
            style={{
                position: 'absolute',
                top: buttonPos.y,
                left: buttonPos.x,
                visibility: buttonPos.y > 0 ? 'visible' : 'hidden',
                elevation: 5,
                minWidth: minPopupWidth,
                maxWidth: windowWidth - 32,
                maxHeight: buttonPos.maxHeight,
                zIndex: 1000,
            }}
            className={clsx(contentClasses, contentClassName)}
        >
            <ScrollView
                showsVerticalScrollIndicator={false}
                tabIndex={isWeb ? -1 : undefined}
                className="web:outline-none"
            >
                {children}
            </ScrollView>
        </View>
    );
    const isButton = !!buttonProps
    const { neoButton, ...resolvedButtonProps } = buttonProps || {};
    const Cnt = isButton ? (neoButton ? NeoButtonRef : ButtonRef) : Pressable;

    return (
        <>
            <Cnt
                {...resolvedButtonProps}
                collapsable={false}
                ref={buttonRef}
                onPress={() => handleToggle(true)}
                onFocus={
                    openOnFocus && !isWeb
                        ? () => handleToggle(true)
                        : undefined
                }
                onFocusCapture={
                    openOnFocus && isWeb
                        ? () => handleToggle(true)
                        : undefined
                }
                className={isButton ? "" : "rounded-xl web:active:scale-95 web:duration-100"}
            >
                {!isButton && trigger}
            </Cnt>

            {isModalVisible && (
                <ModalBase
                    transparent={true}
                    visible={isModalVisible}
                    presentationStyle="overFullScreen"
                    animationType={isWeb ? animation : 'none'}
                    onRequestClose={() => handleToggle(false)}
                    onDismiss={() => {
                        // Ensure modal is fully cleaned up on native
                        if (!isWeb && !isRealOpen) {
                            setIsModalVisible(false);
                        }
                    }}
                >
                    {isWeb ? (
                        <View className="web:flex-1 web:min-h-0 web:relative" style={{ flex: 1 }}>
                            <Pressable
                                accessibilityRole="button"
                                accessibilityLabel="Dismiss menu"
                                className="web:absolute web:inset-0 web:z-0"
                                style={{
                                    position: 'absolute',
                                    left: 0,
                                    right: 0,
                                    top: 0,
                                    bottom: 0,
                                    zIndex: 0,
                                }}
                                onPress={(event) => handleBackdropPress(event)}
                            />
                            {hoverMode ? (
                                Content
                            ) : (
                                <RemoveScroll>{Content}</RemoveScroll>
                            )}
                        </View>
                    ) : (
                        <Pressable
                            className="flex-1"
                            style={[{ backgroundColor: 'rgba(0,0,0,0.3)' }, {}]}
                            onPress={(event) => handleBackdropPress(event)}
                        >
                            {Content}
                        </Pressable>
                    )}
                </ModalBase>
            )}
        </>
    );
}