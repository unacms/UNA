import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
    Modal as ModalBase,
    TouchableOpacity,
    Platform
} from 'react-native';
import { Pressable, ScrollView, View, ViewRef } from 'app/design/view'
import { RemoveScroll } from 'react-remove-scroll';
import { appSetting } from 'app/lib/util';
import { Theme } from 'app/design/theme';
import { useIsDesktop, useWindowSize } from 'app/context/measure';

const dropdownTheme = appSetting('theme', 'dropdown');
const MAX_MEASURE_ATTEMPTS = 5;

export default function DropdownPopup({
    children,
    open,
    onOpenChange,
    trigger,
    minPopupWidth = 256,
    defaultOpen = false,
    showOnTop = false,
    contentClasses = dropdownTheme?.cnt,
    hoverMode = false,
}) {
    const buttonRef = useRef(null);
    const isDesktop = useIsDesktop();
    const contentRef = useRef(null);
    const contentInnerRef = useRef(null);
    const [buttonPos, setButtonPos] = useState(null);
    const { width: windowWidth, height: windowHeight } = useWindowSize();
    const isWeb = useMemo(() => Platform.OS === 'web', []);
    const { colors } = Theme();
    const animation = useMemo(
        () => (isDesktop && !hoverMode ? 'fade' : 'none'),
        [isDesktop, hoverMode]
    );
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [contentLoaded, setContentLoaded] = useState(false);

    const isControlledOutside = typeof onOpenChange === 'function';
    const isRealOpen = isControlledOutside ? open : isOpen;

    // Calculate position from trigger element
    const calculatePosition = useCallback((x, y, triggerWidth, triggerHeight, popupWidth, popupHeight) => {
        // Calculate horizontal position
        let left = x;
        if (x + popupWidth > windowWidth - 16) {
            left = windowWidth - popupWidth - 16;
        }
        if (left < 16) left = 16;

        // Calculate vertical position
        let top = y + triggerHeight + (isWeb ? 8 : 36);

        if (showOnTop) {
            top = y - popupHeight - 8;
        } else if (top + popupHeight > windowHeight - 16 && y - popupHeight - 8 > 16) {
            top = y - popupHeight - 8;
        }
        if (top === 0) top = 1;

        return {
            x: left,
            y: top,
            width: triggerWidth,
            height: triggerHeight,
            maxHeight: windowHeight - top - 16,
        };
    }, [windowWidth, windowHeight, showOnTop, isWeb]);

    // Store trigger position for refinement
    const triggerPosRef = useRef(null);

    // Measure trigger and calculate position before showing modal
    const measureAndShow = useCallback((attempt = 0) => {
        if (!buttonRef.current?.measureInWindow) return;
        
        buttonRef.current.measureInWindow((x, y, width, height) => {
            if ((width === 0 || height === 0) && attempt < MAX_MEASURE_ATTEMPTS) {
                requestAnimationFrame(() => measureAndShow(attempt + 1));
                return;
            }

            if (width === 0 || height === 0) {
                return;
            }

            // Store trigger position for later refinement
            triggerPosRef.current = { x, y, width, height };

            const estimatedPopupWidth = Math.max(minPopupWidth, 320);
            // Use smaller height estimate for hover mode (compact cards)
            const estimatedPopupHeight = hoverMode ? 100 : 300;
            
            const pos = calculatePosition(x, y, width, height, estimatedPopupWidth, estimatedPopupHeight);
            
            // Set position first, then show modal
            setButtonPos(pos);
            setIsModalVisible(true);
            setContentLoaded(false);
        });
    }, [calculatePosition, minPopupWidth, hoverMode]);

    // Refine position after content renders (for non-hover mode with potentially large content)
    const refinePosition = useCallback(() => {
        if (!contentRef.current?.measureInWindow || !triggerPosRef.current) return;
        
        contentRef.current.measureInWindow((_, __, popupWidth, popupHeight) => {
            if (popupWidth > 0 && popupHeight > 0 && triggerPosRef.current) {
                const { x, y, width, height } = triggerPosRef.current;
                const refinedPos = calculatePosition(x, y, width, height, popupWidth, popupHeight);
                
                // Only update if position changed significantly
                setButtonPos(prev => {
                    if (!prev) return refinedPos;
                    const yDiff = Math.abs(prev.y - refinedPos.y);
                    const xDiff = Math.abs(prev.x - refinedPos.x);
                    // Only refine if position difference is significant (> 10px)
                    if (yDiff > 10 || xDiff > 10) {
                        return refinedPos;
                    }
                    return prev;
                });
            }
        });
    }, [calculatePosition]);

    // Handle open/close state
    useEffect(() => {
        if (isRealOpen) {
            // Measure position before showing
            measureAndShow();
        } else {
            // Delay hiding modal to allow animation
            const timer = setTimeout(() => {
                setIsModalVisible(false);
                setContentLoaded(false);
                setButtonPos(null);
                triggerPosRef.current = null;
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [isRealOpen, measureAndShow]);

    // Mark content as loaded after render and refine position for non-hover mode
    useEffect(() => {
        if (isModalVisible && buttonPos) {
            const loadTimer = setTimeout(() => {
                setContentLoaded(true);
                // Refine position after content renders (only for non-hover mode)
                if (!hoverMode) {
                    refinePosition();
                }
            }, 50);
            return () => clearTimeout(loadTimer);
        }
    }, [isModalVisible, buttonPos, hoverMode, refinePosition]);

    // Update position on window resize
    useEffect(() => {
        if (isRealOpen && isWeb && buttonPos) {
            const handleResize = () => measureAndShow();
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, [isRealOpen, isWeb, buttonPos, measureAndShow]);

    const handleToggle = (bOpen) => {
        if (isControlledOutside) {
            onOpenChange(bOpen);
        } else {
            setIsOpen(bOpen);
        }
    };

    const handleBackdropPress = (event) => {
        event.stopPropagation();
        handleToggle(false);
    };

    // Animation classes - position is always known when modal renders
    const animationClasses = hoverMode
        ? 'animate-in fade-in duration-100'
        : 'animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200';

    // Only render content when we have a valid position
    const Content = buttonPos ? (
        <ViewRef
            ref={contentRef}
            style={{
                position: 'absolute',
                top: buttonPos.y,
                left: buttonPos.x,
                elevation: 5,
                minWidth: minPopupWidth,
                maxWidth: windowWidth - 32,
                maxHeight: buttonPos.maxHeight,
                zIndex: 1000,
            }}
            className={`${contentClasses} ${animationClasses}`}
        >
            <View 
                ref={contentInnerRef}
                style={{
                    minHeight: contentLoaded ? 'auto' : (hoverMode ? 'auto' : minPopupWidth),
                    maxHeight: buttonPos.maxHeight,
                    transition: hoverMode ? 'none' : 'min-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {children}
            </View>
        </ViewRef>
    ) : null;

    return (
        <>
            <TouchableOpacity
                collapsable={false}
                ref={buttonRef}
                onPress={() => handleToggle(true)}
            >
                {trigger}
            </TouchableOpacity>

            {isModalVisible && Content && (
                <ModalBase
                    transparent={true}
                    visible={isModalVisible}
                    presentationStyle="overFullScreen"
                    animationType={animation}
                    onRequestClose={() => handleToggle(false)}
                    onDismiss={() => {
                        // Ensure modal is fully cleaned up on native
                        if (!isWeb && !isRealOpen) {
                            setIsModalVisible(false);
                            setButtonPos(null);
                        }
                    }}
                >
                    <Pressable className="flex-1 z-20" onPress={(event) => handleBackdropPress(event)}>
                        <RemoveScroll>{Content}</RemoveScroll>
                    </Pressable>
                </ModalBase>
            )}
        </>
    );
}
