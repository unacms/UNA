import { useState, useRef, useEffect, useMemo } from 'react';
import {
    Modal as ModalBase,
    TouchableOpacity,
    useWindowDimensions,
    Platform
} from 'react-native';
import { Pressable, ScrollView, View, ViewRef } from 'app/design/view'
import { LAYOUT_BREAKPOINTS } from 'app/lib/util'
import { RemoveScroll } from 'react-remove-scroll';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSpring,
    interpolate,
    runOnJS,
} from 'react-native-reanimated';
import { appSetting } from 'app/lib/util';
import { BlurView } from 'expo-blur';
import { Theme } from 'app/design/theme';


const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const dropdownTheme = appSetting('theme', 'dropdown');

export default function DropdownPopup({
    children,
    open,
    onOpenChange,
    trigger,
    minPopupWidth = 200,
    defaultOpen = false,
    showOnTop = false,
    contentClasses = dropdownTheme?.cnt 
}) {
    const buttonRef = useRef(null);
    const contentRef = useRef(null);
    const [buttonPos, setButtonPos] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const isWeb = useMemo(() => Platform.OS === 'web', []);
    const { colors } = Theme();
    const animation = useMemo(
        () => (windowWidth > LAYOUT_BREAKPOINTS.md ? 'fade' : 'none'),
        [windowWidth]
    );
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [isModalVisible, setIsModalVisible] = useState(false);

    const isControlledOutside = typeof onOpenChange === 'function';
    const isRealOpen = isControlledOutside ? open : isOpen;

    // Animation values
    const animationProgress = useSharedValue(0);

    useEffect(() => {
        // Add safety checks for modal state
        if (isRealOpen) {
            // Only set modal visible if it's not already visible
            if (!isModalVisible) {
                setIsModalVisible(true);
            }
            animationProgress.value = withSpring(1, {
                damping: 20,
                stiffness: 300,
            });
        } else {
            animationProgress.value = withTiming(0, { duration: 200 }, (finished) => {
                if (finished && isModalVisible) {
                    runOnJS(setIsModalVisible)(false);
                }
            });
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
                    let top = y + height + 8;

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

    useEffect(() => {
        if (isRealOpen) {
            updateButtonPosition();
            // Add window resize listener for web
            if (isWeb) {
                window.addEventListener('resize', updateButtonPosition);
                return () => window.removeEventListener('resize', updateButtonPosition);
            }
        }
    }, [isRealOpen, windowWidth, showOnTop]);

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

    // Animated styles for backdrop
    const backdropAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(animationProgress.value, [0, 1], [0, 1]),
        };
    }, []);

    // Animated styles for content
    const contentAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity: animationProgress.value,
            transform: [
                {
                    scale: interpolate(animationProgress.value, [0, 1], [0.8, 1]),
                },
            ],
        };
    }, []);

    const AnimatedContent = useMemo(() => {
        const contentStyle = {
            position: 'absolute',
            top: buttonPos.y,
            left: buttonPos.x,
            visibility: buttonPos.y > 0 ? 'visible' : 'hidden',
            elevation: 5,
            minWidth: minPopupWidth,
            maxWidth: windowWidth - 32,
            maxHeight: windowHeight - buttonPos.y - 32,
            zIndex: 1000,
        };

        if (isWeb) {
            // Web version with CSS backdrop-blur
            return (
                <Animated.View
                    ref={contentRef}
                    style={[contentStyle, !isWeb && contentAnimatedStyle]}
                    className={`${contentClasses}`}
                >
                    {children}
                </Animated.View>
            );
        } else {
            // Native version with BlurView
            return (
                <Animated.View
                    ref={contentRef}
                    style={[contentStyle, contentAnimatedStyle]}
                >
                    <BlurView
                        tint="systemMaterial"
                        intensity={60}
                        experimentalBlurMethod="none"
                        className="rounded-2xl overflow-hidden p-2 shadow-[0_10px_10px_rgba(0,0,0,0.15)]"
                    >
                        {children}
                    </BlurView>
                </Animated.View>
            );
        }
    }, [buttonPos, contentClasses, children, windowWidth, windowHeight, contentAnimatedStyle, isWeb, colors]);

    const Content = true ? (
        <ViewRef
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
            className={`${contentClasses}`}
        >
            <ScrollView showsVerticalScrollIndicator={false}>
                {children}
            </ScrollView>
        </ViewRef>
    ) : AnimatedContent;

    return (
        <>
            <TouchableOpacity
                collapsable={false}
                ref={buttonRef}
                onPress={() => handleToggle(true)}
            >
                {trigger}
            </TouchableOpacity>

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
                        <Pressable className="flex-1 bg-black/30 z-20" onPress={(event) => handleBackdropPress(event)}>
                            <RemoveScroll>{Content}</RemoveScroll>
                        </Pressable>
                    ) : (
                        <AnimatedPressable
                            className="flex-1"
                            style={[{ backgroundColor: 'rgba(0,0,0,0.3)' }, backdropAnimatedStyle]}
                            onPress={(event) => handleBackdropPress(event)}
                        >
                            {Content}
                        </AnimatedPressable>
                    )}
                </ModalBase>
            )}
        </>
    );
}