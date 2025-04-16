import { useState, useRef, useEffect, useMemo } from 'react';
import {
    Modal as ModalBase,
    TouchableOpacity,
    TouchableWithoutFeedback,
    useWindowDimensions,
    Platform
} from 'react-native';
import { Pressable, View } from 'app/design/view'
import { LAYOUT_BREAKPOINTS } from 'app/lib/util'
import { RemoveScroll } from 'react-remove-scroll';

export default function DropdownPopup({
    children,
    open,
    onOpenChange,
    trigger,
    popupWidth = 384,
    defaultOpen = false,
    contentClasses = 'rounded-lg backdrop-blur bg-bgrmodal dark:bg-bgrmodal-d p-2 shadow-lg'
}) {
    const buttonRef = useRef(null);
    const [buttonPos, setButtonPos] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const windowWidth = useWindowDimensions().width;
    const isWeb = useMemo(() => Platform.OS === 'web', []);
    const animation = useMemo(
        () => (windowWidth > LAYOUT_BREAKPOINTS.md ? 'fade' : 'fade'),
        [windowWidth]
    );
    const [isOpen, setIsOpen] = useState(defaultOpen);

    const isControlledOutside = typeof onOpenChange === 'function';
    const isRealOpen = isControlledOutside ? open : isOpen;

    const updateButtonPosition = () => {
        if (!buttonRef.current?.measureInWindow) return;

        buttonRef.current.measureInWindow((x, y, width, height) => {
            setButtonPos({
                x: Math.min(x, windowWidth - popupWidth - 8),/*- popupWidth/2 +width/2*/
                y,
                width,
                height,
            });
        });
    };

    useEffect(() => {
        if (isRealOpen) updateButtonPosition();
    }, [isRealOpen, popupWidth, windowWidth]);

    const handleToggle = (bOpen) => {
        isControlledOutside ? onOpenChange(bOpen) : setIsOpen(bOpen);
    }

    const Content = useMemo(() => (
        <View
            style={{
                top: buttonPos.y + buttonPos.height + 5,
                left: buttonPos.x,
                elevation: 5,
                minWidth: popupWidth,
            }}
            className={`absolute ${contentClasses}`}
        >
            {children}
        </View>
    ), [buttonPos, popupWidth, contentClasses, children]);

    return (
        <>
            <TouchableOpacity className='w-full' collapsable={false} ref={buttonRef} onPress={() => handleToggle(true)} >
                {trigger}
            </TouchableOpacity>
            {isRealOpen && (
                <ModalBase
                    transparent={true}
                    visible={isRealOpen}
                    presentationStyle={'pageSheet'}
                    animationType={animation}
                    onRequestClose={() => handleToggle(false)}
                >
                    <Pressable className="flex-1" onPress={() => handleToggle(false)} >
                        {isWeb ? <RemoveScroll>{Content}</RemoveScroll> : Content}
                    </Pressable>
                </ModalBase>
            )}
        </>
    );
}