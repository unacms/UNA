import { useState, useRef, useEffect, useMemo } from 'react';
import {
    Modal as ModalBase,
    TouchableOpacity,
    TouchableWithoutFeedback,
    useWindowDimensions,
    Platform
} from 'react-native';
import { Pressable, View, ViewRef } from 'app/design/view'
import { LAYOUT_BREAKPOINTS } from 'app/lib/util'
import { RemoveScroll } from 'react-remove-scroll';

export default function DropdownPopup({
    children,
    open,
    onOpenChange,
    trigger,
    popupWidth = 352,
    defaultOpen = false,
    showOnTop = false,
    contentClasses = ' rounded-2xl overflow-hidden border border-bdrmodal p-2 dark:border-bdrmodal-d bg-bgrmodal dark:bg-bgrmodal-d shadow-[0_10px_10px_rgba(0,0,0,0.05)]  '
}) {
    const buttonRef = useRef(null);
    const contentRef = useRef(null);
    const [buttonPos, setButtonPos] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const { width: windowWidth, height: windowHeight } = useWindowDimensions();
    const isWeb = useMemo(() => Platform.OS === 'web', []);
    const animation = useMemo(
        () => (windowWidth > LAYOUT_BREAKPOINTS.md ? 'fade' : 'slide'),
        [windowWidth]
    );
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const isControlledOutside = typeof onOpenChange === 'function';
    const isRealOpen = isControlledOutside ? open : isOpen;

    const updateButtonPosition = () => {
        if (!buttonRef.current?.measureInWindow) return;

        buttonRef.current.measureInWindow((x, y, width, height) => {
            if (contentRef.current?.measureInWindow) {
                contentRef.current.measureInWindow((_, __, ___, effectivePopupHeight) => {
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
                    } else if (top + effectivePopupHeight > windowHeight - 16) {
                        top = y - effectivePopupHeight - 8;
                    }

                    setButtonPos({
                        x: left,
                        y: top,
                        width,
                        height,
                    });
                });
            }
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
    }, [isRealOpen, popupWidth, windowWidth, showOnTop]);

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

    const Content = useMemo(() => (
        <ViewRef
            ref={contentRef}
            style={{
                position: 'absolute',
                top: buttonPos.y,
                left: buttonPos.x,
                elevation: 5,
                minWidth: popupWidth,
                maxWidth: windowWidth - 32,
                zIndex: 1000,
            }}
            className={`${contentClasses}`}
        >
            {children}
        </ViewRef>
    ), [buttonPos, popupWidth, contentClasses, children, windowWidth]);

    return (
        <>
            <TouchableOpacity
                className='w-full'
                collapsable={false}
                ref={buttonRef}
                onPress={() => handleToggle(true)}
            >
                {trigger}
            </TouchableOpacity>

            <ModalBase
                transparent={true}
                visible={isRealOpen === true ? true : false}
                presentationStyle="overFullScreen"
                animationType={animation}
                onRequestClose={() => handleToggle(false)}
            >
                <Pressable className="flex-1 bg-black/30" onPress={(event) => handleBackdropPress(event)}>
                    {isWeb ? <RemoveScroll>{Content}</RemoveScroll> : Content}
                </Pressable>
            </ModalBase>
        </>
    );
}