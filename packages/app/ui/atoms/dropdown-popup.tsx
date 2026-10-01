import { useState, useRef, useEffect, useMemo, useCallback, createContext, type ReactNode } from 'react';
import { cn } from 'app/lib/util';
import {
    Modal as ModalBase,
    Platform,
    type StyleProp,
    type ViewStyle,
} from 'react-native';
import { Pressable, ScrollView, View } from 'app/design/view'
import { RemoveScroll } from 'react-remove-scroll';
import { appSetting } from 'app/lib/util';
import { useIsDesktop, useWindowSize } from 'app/context/measure';
import emitter, { EVENTS } from 'app/context/emitter';
import { ButtonRef, NeoButtonRef } from 'app/design/controls'
import type { ComponentType } from 'react';

// Trigger components, loosely typed: NeoButtonRef is still JS, and the legacy
// ButtonRef has a fixed prop list — it silently drops collapsable / aria-* / onFocus
// passed below (TODO: forward them, or stop passing them).
const LegacyTriggerButton: ComponentType<any> = ButtonRef;
const NeoTriggerButton: ComponentType<any> = NeoButtonRef;

const dropdownTheme = appSetting('theme', 'dropdown');

const WEB_FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

function getWebFocusableElements(root: any): HTMLElement[] {
    if (!root || typeof root.querySelectorAll !== 'function') return [];
    return Array.from(root.querySelectorAll(WEB_FOCUSABLE_SELECTOR) as NodeListOf<HTMLElement>).filter((el) => {
        if (el.getAttribute('aria-hidden') === 'true') return false;
        if (typeof window === 'undefined') return true;
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden';
    });
}

function getBodyChild(node: any): Element | null {
    let el = node;
    while (el && el.parentElement && el.parentElement !== document.body) {
        el = el.parentElement;
    }
    return el && el.parentElement === document.body ? el : null;
}

/** Open state for menu triggers (NeoButton `selected` / topmenu chevron). */
export const DropdownMenuOpenContext = createContext(false);

const isLegacyButtonProps = (props: DropdownButtonProps | undefined) =>
    props?.legacyButton === true || props?.variant != null;

/**
 * Trigger button props: NeoButton props by default; `legacyButton: true` or a
 * `variant` switches to the classic Button.
 */
export type DropdownButtonProps = Record<string, any>;

export type DropdownPopupProps = {
    /** Render a (Neo)Button trigger from these props instead of `trigger`. */
    buttonProps?: DropdownButtonProps;
    children?: ReactNode;
    /** Controlled open state (needs `onOpenChange` too). */
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** Custom trigger content, used when `buttonProps` is omitted. */
    trigger?: ReactNode;
    minPopupWidth?: number;
    /** Caps popup width (px). Inline style wins over Tailwind max-w-* on the popup shell. */
    maxPopupWidth?: number;
    defaultOpen?: boolean;
    /** Prefer opening above the trigger. */
    showOnTop?: boolean;
    /** Popup shell classes; defaults to theme `dropdown.cnt`. */
    contentClasses?: string;
    /** When true, allows page scroll while popup is open. */
    hoverMode?: boolean;
    /** When true (e.g. tabs "More"), open the menu when the trigger subtree receives focus (Tab or roving arrows). */
    openOnFocus?: boolean;
    /** Merged after `contentClasses` (e.g. `overflow-visible` so focus rings are not clipped). */
    contentClassName?: string;
    /** Accessible name for custom trigger wrappers (when `buttonProps` is omitted). */
    triggerAccessibilityLabel?: string;
    /** Extra classes on the trigger Pressable (e.g. `flex-1` for tab-bar More). */
    triggerClassName?: string;
    /** RN layout style for the trigger Pressable (e.g. tab-bar button `style`). */
    triggerStyle?: StyleProp<ViewStyle>;
};

export default function DropdownPopup({
    buttonProps,
    children,
    open,
    onOpenChange,
    trigger,
    minPopupWidth = 256,
    maxPopupWidth,
    defaultOpen = false,
    showOnTop = false,
    contentClasses = dropdownTheme?.cnt,
    hoverMode = false,
    openOnFocus = false,
    contentClassName = '',
    triggerAccessibilityLabel,
    triggerClassName = '',
    triggerStyle,
}: DropdownPopupProps) {
    const buttonRef = useRef<any>(null);
    const isDesktop = useIsDesktop();
    const contentRef = useRef<any>(null);
    const restoreFocusRef = useRef<any>(null);
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
        const subscription = emitter.addListener(EVENTS.link, (data: { action?: string }) => {
            if (data.action == 'pressed') {
                // Close both controlled and uncontrolled popups (e.g. wiki mobile nav).
                if (isControlledOutside) {
                    onOpenChange!(false);
                } else {
                    setIsOpen(false);
                }
            }
        })

        return () => {
            subscription.remove()
        }
    }, [isControlledOutside, onOpenChange])

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

    const measureElement = useCallback((node: any, callback: (x: number, y: number, width: number, height: number) => void) => {
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
    const updateButtonPosition = useCallback((): void => {
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
        (bOpen: boolean) => {
            if (bOpen && isWeb) {
                restoreFocusRef.current = buttonRef.current;
            }
            if (isControlledOutside) {
                onOpenChange!(bOpen);
            } else {
                setIsOpen(bOpen);
            }
        },
        [isControlledOutside, isWeb, onOpenChange]
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
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                handleToggle(false);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isWeb, isRealOpen, handleToggle]);

    useEffect(() => {
        if (!isWeb) return;
        if (isRealOpen) return;
        const node = restoreFocusRef.current;
        restoreFocusRef.current = null;
        if (!node) return;
        const focusTrigger = () => {
            if (typeof node.focus === 'function') {
                node.focus();
                if (document.activeElement === node || node.contains?.(document.activeElement)) {
                    return;
                }
            }
            const inner = node.querySelector?.('[tabindex="0"], [role="button"], button, a');
            inner?.focus?.();
        };
        const id = requestAnimationFrame(focusTrigger);
        return () => cancelAnimationFrame(id);
    }, [isWeb, isRealOpen]);

    const handleBackdropPress = (event: any) => {
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

    useEffect(() => {
        if (!isWeb || !isRealOpen || !hasMeasured) return;
        const id = requestAnimationFrame(() => {
            const first = getWebFocusableElements(contentRef.current)[0];
            first?.focus?.();
        });
        return () => cancelAnimationFrame(id);
    }, [isWeb, isRealOpen, hasMeasured]);

    useEffect(() => {
        if (!isWeb || !isRealOpen || !hasMeasured) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Tab') return;
            const root = contentRef.current;
            const focusables = getWebFocusableElements(root);
            if (focusables.length === 0) {
                event.preventDefault();
                return;
            }
            const first = focusables[0]!;
            const last = focusables[focusables.length - 1]!;
            const active = document.activeElement;
            const inside = root?.contains?.(active);
            if (event.shiftKey && (active === first || !inside)) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && (active === last || !inside)) {
                event.preventDefault();
                first.focus();
            }
        };
        window.addEventListener('keydown', onKeyDown, true);
        return () => window.removeEventListener('keydown', onKeyDown, true);
    }, [isWeb, isRealOpen, hasMeasured]);

    useEffect(() => {
        if (!isWeb || !isModalVisible || !hasMeasured) return;
        const portalRoot = getBodyChild(contentRef.current);
        if (!portalRoot) return;
        const siblings = Array.from(document.body.children).filter((el) => el !== portalRoot);
        const previous = siblings.map((el) => ({
            el,
            inert: el.hasAttribute('inert'),
            hidden: el.getAttribute('aria-hidden'),
        }));
        siblings.forEach((el) => {
            el.setAttribute('inert', '');
            el.setAttribute('aria-hidden', 'true');
        });
        return () => {
            previous.forEach(({ el, inert, hidden }) => {
                if (!inert) el.removeAttribute('inert');
                if (hidden == null) el.removeAttribute('aria-hidden');
                else el.setAttribute('aria-hidden', hidden);
            });
        };
    }, [isWeb, isModalVisible, hasMeasured]);

    const cappedPopupWidth = maxPopupWidth
        ? Math.min(maxPopupWidth, windowWidth - 32)
        : windowWidth - 32;

    // Clamp left so the popup never overflows the screen edges, using the real
    // rendered width once onLayout has fired (falls back to minPopupWidth before).
    const effectivePopupWidth = popupRenderedWidth > 0
        ? Math.min(popupRenderedWidth, cappedPopupWidth)
        : (maxPopupWidth ? cappedPopupWidth : minPopupWidth);
    let finalLeft = buttonPos.x;
    if (finalLeft + effectivePopupWidth > windowWidth - 16) {
        finalLeft = windowWidth - effectivePopupWidth - 16;
    }
    if (finalLeft < 16) finalLeft = 32;

    // Tweak these two constants if the gap looks off. They are intentionally
    // asymmetric — on native (especially Android) the "below" anchor often
    // needs more breathing room than the "above" one because of trigger
    // pressables / hit-slop / shadow rendering.
    const triggerGapBelow = isWeb || isIos ? 8: 32;
    const triggerGapAbove = isWeb ? 8: 0;
    const popupTop = buttonPos.shouldOpenAbove
        ? Math.max(8, buttonPos.triggerY - popupHeight - triggerGapAbove)
        : buttonPos.triggerY + buttonPos.triggerHeight + triggerGapBelow;

    const handleContentLayout = (e: { nativeEvent: { layout: { width: number; height: number } } }) => {
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
                minWidth: maxPopupWidth ? Math.min(minPopupWidth, cappedPopupWidth) : minPopupWidth,
                maxWidth: cappedPopupWidth,
                ...(maxPopupWidth ? { width: cappedPopupWidth } : {}),
                maxHeight: buttonPos.maxHeight,
                zIndex: 1000,
            } as ViewStyle /* web-only `visibility` */}
            className={cn(contentClasses, contentClassName)}
        >
            <ScrollView
                showsVerticalScrollIndicator={false}
                tabIndex={isWeb ? -1 : undefined}
                className={cn('web:outline-none', maxPopupWidth && 'w-full min-w-0 max-w-full')}
                contentContainerClassName={maxPopupWidth ? 'w-full min-w-0' : undefined}
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
    const triggerMenuProps = {
        'aria-haspopup': 'true',
        'aria-expanded': isRealOpen,
    };
    const dialogLabel =
        triggerAccessibilityLabel ||
        buttonProps?.accessibilityLabel ||
        (typeof buttonProps?.label === 'string' ? buttonProps.label : undefined) ||
        'Menu';

    const legacyButton = buttonProps && isLegacyButtonProps(buttonProps);
    const { legacyButton: _legacy, neoButton: _neo, ...neoButtonProps } = buttonProps || {};

    return (
        <>
            {buttonProps ? (
                legacyButton ? (
                    <LegacyTriggerButton
                        {...buttonProps}
                        collapsable={false}
                        ref={buttonRef}
                        onPress={openTrigger}
                        {...triggerMenuProps}
                        {...triggerFocusProps}
                    />
                ) : (
                    <NeoTriggerButton
                        {...neoButtonProps}
                        collapsable={false}
                        ref={buttonRef}
                        onPress={openTrigger}
                        selected={isRealOpen}
                        {...triggerMenuProps}
                        {...triggerFocusProps}
                    />
                )
            ) : (
                <DropdownMenuOpenContext.Provider value={isRealOpen}>
                    <Pressable
                        collapsable={false}
                        ref={buttonRef}
                        onPress={openTrigger}
                        {...triggerFocusProps}
                        accessibilityRole="button"
                        accessibilityLabel={triggerAccessibilityLabel}
                        aria-haspopup="true"
                        aria-expanded={isRealOpen}
                        style={triggerStyle}
                        className={cn('web:active:scale-95 web:duration-100', triggerClassName)}
                    >
                        {trigger}
                    </Pressable>
                </DropdownMenuOpenContext.Provider>
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
                        <View
                            className="web:fixed web:inset-0 web:z-[9999]"
                            role="dialog"
                            aria-modal={true}
                            aria-label={dialogLabel}
                            style={{
                                position: 'fixed',
                                left: 0,
                                right: 0,
                                top: 0,
                                bottom: 0,
                                width: '100%',
                                height: '100%',
                                zIndex: 9999,
                            } as unknown as ViewStyle /* web-only `position: fixed` */}
                        >
                            <Pressable
                                role="presentation"
                                aria-hidden={true}
                                tabIndex={-1}
                                className="web:absolute web:inset-0 web:z-0"
                                style={{
                                    position: 'absolute',
                                    left: 0,
                                    right: 0,
                                    top: 0,
                                    bottom: 0,
                                    zIndex: 0,
                                }}
                                onPress={(event: any) => handleBackdropPress(event)}
                            />
                            {hoverMode ? (
                                Content
                            ) : (
                                // Keep body overflow intact. `removeScrollBar` sets
                                // `overflow: hidden` on `body`, which unsticks
                                // `position: sticky` (compact cover) and jumps it to
                                // its in-flow position above the viewport. Wheel/touch
                                // locking still runs.
                                <RemoveScroll removeScrollBar={false}>
                                    {Content}
                                </RemoveScroll>
                            )}
                        </View>
                    ) : (
                        <Pressable
                            className="flex-1"
                            style={[{ backgroundColor: 'rgba(0,0,0,0.3)' }, {}]}
                            onPress={(event: any) => handleBackdropPress(event)}
                        >
                            {Content}
                        </Pressable>
                    )}
                </ModalBase>
            )}
        </>
    );
}