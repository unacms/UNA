import { Platform } from 'react-native'
import { Button } from 'app/design/controls'
import { View } from 'app/design/view';
import Animated, { useSharedValue, withTiming, useAnimatedStyle, Easing, withSequence } from "react-native-reanimated";
import { useEffect, useState, useImperativeHandle, forwardRef } from 'react';

const ElementToster = forwardRef((props, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    const sharedValue = useSharedValue(50); 

    const indicatorStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: sharedValue.value }],
            opaopacity: sharedValue.value == 25 ? 1 : 0
        };
    });

    useEffect(() => {
        sharedValue.value = withSequence(
            withTiming(isVisible ? 25 : -50, { duration: 300 }), // fade out
          );
        
      
    }, [isVisible]);

    useImperativeHandle(ref, () => ({
        setVisible: (visible) => setIsVisible(visible),
    }));

    let sClassName = 'absolute top-0 w-full items-center z-50';
    if (Platform.OS === 'web')
        sClassName = 'fixed top-16 left-0 w-full items-center z-50';

    return (
        <View style={{ display: isVisible ? 'flex' : 'none' }} className={sClassName}>
            <Animated.View style={indicatorStyle} >
                <View className='w-1/2 items-center'>
                    <Button variant="primary" title={props.title} size={props.size} rounded onPress={props.onPress} />
                </View>
            </Animated.View>
        </View>
    );
});

export default ElementToster;
