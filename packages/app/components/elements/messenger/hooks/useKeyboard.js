import { Keyboard } from "react-native";
import { useEffect, useState } from 'react';

export default function useKeyboard() {
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    useEffect(() => {
        function onKeyboardDidShow(e) {
            setKeyboardHeight(e.endCoordinates.height);
        }

        function onKeyboardDidHide() {
            setKeyboardHeight(0);
        }

        const showSubscription = Keyboard.addListener('keyboardDidShow', onKeyboardDidShow);
        const hideSubscription = Keyboard.addListener('keyboardDidHide', onKeyboardDidHide);
        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    return keyboardHeight;
};