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
    popupWidth = 352,
    defaultOpen = false,
    showOnTop = false,
    popupHeight = 0,
    contentClasses = ' rounded-2xl overflow-hidden border border-bdrmodal p-2 dark:border-bdrmodal-d bg-bgrmodal dark:bg-bgrmodal-d shadow-[0_10px_10px_rgba(0,0,0,0.05)]  '
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
                y: showOnTop ? y - popupHeight - height : y,
                width,
                height,
            });
        });
    };

    useEffect(() => {
        if (isRealOpen) updateButtonPosition();
    }, [isRealOpen, popupWidth, windowWidth]);

    const handleToggle = (bOpen) => {
        console.log("sdff")
        isControlledOutside ? onOpenChange(bOpen) : setIsOpen(bOpen);
    }

    const Content = useMemo(() => (
        <View
            style={{
                top: buttonPos.y + buttonPos.height + 5,
                left: Math.min(buttonPos.x, windowWidth - popupWidth - 16),
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

                <ModalBase
                    transparent={true}
                    visible={isRealOpen === true ? true : false} 
                    presentationStyle={'pageSheet'}
                    animationType={animation}
                    onRequestClose={() => handleToggle(false)}
                >
                    <Pressable className="flex-1" onPress={(event) => {console.log("event", event), handleToggle(false)}} >
                        {isWeb ? <RemoveScroll>{Content}</RemoveScroll> : Content}
                    </Pressable>
                </ModalBase>
          

        </>
    );
}