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
import { ButtonRef, NeoButtonRef } from 'app/design/controls'

const dropdownTheme = appSetting('theme', 'dropdown');

const isLegacyButtonProps = (props) =>
    props?.legacyButton === true || props?.variant != null;

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
    /** Accessible name for custom trigger wrappers (when `buttonProps` is omitted). */
    triggerAccessibilityLabel,
}) {
    const buttonRef = useRef(null);
    const isDesktop = useIsDesktop();
    const contentRef = useRef(null);
    const [buttonPos, setButtonPos] = useState({ triggerY: 0, triggerHeight: 0, x: 0, width: 0, height: 0, maxHeight: 0, shouldOpenAbove: false });
    const [popupHeight, setPopupHeight] = useState(0);
    const [popupRenderedWidth, setPopupRenderedWidth] = useState(0);
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

    const measureRetryRef = useRef(0);
    const updateButtonPosition = useCallback(() => {
        if (!measureElement(buttonRef.current, (x, y, width, height) => {
            // measureInWindow on iOS can return zeros for a few frames while the
            // trigger is still being laid out (e.g. inside a ScrollView, right
            // after a screen transition, or before an image-sized avatar settles).
            // Retry on the next frame instead of locking the popup at (0, 0).
            if ((width === 0 && height === 0) && measureRetryRef.current < 5) {
                measureRetryRef.current += 1;
                requestAnimationFrame(() => updateButtonPosition());
                return;
            }
            measureRetryRef.current = 0;

            const roomBelow = windowHeight - (y + height) - 16;
            const roomAbove = y - 24;
            const shouldOpenAbove = showOnTop || (roomBelow < 240 && roomAbove > roomBelow);
            const maxHeight = Math.max(120, shouldOpenAbove ? roomAbove : roomBelow);

            setButtonPos({
                triggerY: y,
                triggerHeight: height,
                x,
                width,
                height,
                maxHeight,
                shouldOpenAbove,
            });
        })) return;
    }, [measureElement, minPopupWidth, showOnTop, windowHeight, windowWidth]);

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
        } else {
            measureRetryRef.current = 0;
            setButtonPos({ triggerY: 0, triggerHeight: 0, x: 0, width: 0, height: 0, maxHeight: 0, shouldOpenAbove: false });
            setPopupHeight(0);
            setPopupRenderedWidth(0);
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

    // True only after measureElement returned a real layout. `visibility` is a
    // web-only CSS property and is ignored by React Native on iOS/Android, so
    // we additionally drive `opacity` + `pointerEvents` to keep the popup
    // hidden while it is still anchored at (0, 0) on native.
    const triggerMeasured = buttonPos.height > 0 || buttonPos.width > 0;
    // For "above" we also need to know the popup's own height (measured via
    // onLayout) to anchor it at `triggerTop - popupHeight - gap`. For "below"
    // we don't need it at all (popup is anchored at `triggerBottom + gap`).
    const popupMeasured = (!buttonPos.shouldOpenAbove || popupHeight > 0) && popupRenderedWidth > 0;
    const hasMeasured = triggerMeasured && popupMeasured;

    // Clamp left so the popup never overflows the screen edges, using the real
    // rendered width once onLayout has fired (falls back to minPopupWidth before).
    const effectivePopupWidth = popupRenderedWidth > 0 ? popupRenderedWidth : minPopupWidth;
    let finalLeft = buttonPos.x;
    if (finalLeft + effectivePopupWidth > windowWidth - 16) {
        finalLeft = windowWidth - effectivePopupWidth - 16;
    }
    if (finalLeft < 16) finalLeft = 16;

    // Tweak these two constants if the gap looks off. They are intentionally
    // asymmetric — on native (especially Android) the "below" anchor often
    // needs more breathing room than the "above" one because of trigger
    // pressables / hit-slop / shadow rendering.
    const triggerGapBelow = isWeb ? 0: 32;
    const triggerGapAbove = isWeb ? 0: 0;
    const popupTop = buttonPos.shouldOpenAbove
        ? Math.max(8, buttonPos.triggerY - popupHeight - triggerGapAbove)
        : buttonPos.triggerY + buttonPos.triggerHeight + triggerGapBelow;

    const handleContentLayout = (e) => {
        const h = Math.round(e.nativeEvent.layout.height);
        const w = Math.round(e.nativeEvent.layout.width);
        if (h && h !== popupHeight) {
            setPopupHeight(h);
        }
        if (w && w !== popupRenderedWidth) {
            setPopupRenderedWidth(w);
        }
    };

    const Content = (
        <View
            ref={contentRef}
            onLayout={handleContentLayout}
            pointerEvents={hasMeasured ? 'auto' : 'none'}
            style={{
                position: 'absolute',
                top: popupTop,
                left: finalLeft,
                opacity: hasMeasured ? 1 : 0,
                visibility: hasMeasured ? 'visible' : 'hidden',
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
    const openTrigger = () => handleToggle(true);
    const triggerFocusProps = {
        onFocus: openOnFocus && !isWeb ? openTrigger : undefined,
        onFocusCapture: openOnFocus && isWeb ? openTrigger : undefined,
    };

    const legacyButton = buttonProps && isLegacyButtonProps(buttonProps);
    const { legacyButton: _legacy, neoButton: _neo, ...neoButtonProps } = buttonProps || {};

    return (
        <>
            {buttonProps ? (
                legacyButton ? (
                    <ButtonRef
                        {...buttonProps}
                        collapsable={false}
                        ref={buttonRef}
                        onPress={openTrigger}
                        {...triggerFocusProps}
                    />
                ) : (
                    <NeoButtonRef
                        {...neoButtonProps}
                        collapsable={false}
                        ref={buttonRef}
                        onPress={openTrigger}
                        {...triggerFocusProps}
                    />
                )
            ) : (
                <Pressable
                    collapsable={false}
                    ref={buttonRef}
                    onPress={openTrigger}
                    {...triggerFocusProps}
                    accessibilityRole="button"
                    accessibilityLabel={triggerAccessibilityLabel}
                    aria-haspopup="menu"
                    aria-expanded={isRealOpen}
                    className="rounded-xl web:active:scale-95 web:duration-100"
                >
                    {trigger}
                </Pressable>
            )}

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