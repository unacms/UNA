import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { clsx } from 'clsx';
import {
    Modal as ModalBase,
    Platform
} from 'react-native';
import { Pressable, ScrollView, View, ViewRef } from 'app/design/view'
import { RemoveScroll } from 'react-remove-scroll';
import { appSetting } from 'app/lib/util';
import { useIsDesktop, useWindowSize } from 'app/context/measure';
import emitter from 'app/context/emitter';
import { Button, ButtonRef } from 'app/design/controls'
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

    const updateButtonPosition = () => {
        if (!buttonRef.current?.measureInWindow) return;
        buttonRef.current.measureInWindow((x, y, width, height) => {

            setTimeout(() => {
                if (contentRef.current?.measureInWindow) {
                    contentRef.current.measureInWindow((_, __, popupWidth, effectivePopupHeight) => {
                        // Calculate horizontal position
                        let left = x;
                        if (x + popupWidth > windowWidth - 16) {
                            left = windowWidth - popupWidth - 16;
                        }
                        if (left < 16) left = 16;

                        // Calculate vertical position
                        let top = y + height + (isWeb || isIos ? 8 : 36);

                        if (showOnTop) {
                            top = y - effectivePopupHeight - 8;
                        } else if (top + effectivePopupHeight > windowHeight - 16 && y - effectivePopupHeight - 8 > 16) {
                            top = y - effectivePopupHeight - 8;
                        }
                        if (top == 0)
                            top = 1

                        setButtonPos({
                            x: left,
                            y: top,
                            width,
                            height,
                            maxHeight: windowHeight - top - 16
                        });
                    });
                }
            }, 100);
        });
    };

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
    }, [isRealOpen, windowWidth, showOnTop]);

    /** Reposition when any scrollable ancestor scrolls (menu stays anchored to trigger). */
    useEffect(() => {
        if (!isWeb || !isRealOpen) return;
        const onScroll = () => updateButtonPosition();
        window.addEventListener('scroll', onScroll, true);
        return () => window.removeEventListener('scroll', onScroll, true);
    }, [isWeb, isRealOpen]);

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
            >
                {children}
            </ScrollView>
        </View>
    );
    const isButton = !!buttonProps
    const Cnt = isButton ? ButtonRef : Pressable;

    return (
        <>
            <Cnt
                {...buttonProps}
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