import { View, Pressable } from 'app/design/view';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { appSetting } from 'app/lib/util';


const themeSettings = appSetting('theme', 'switcher');

export default function Switch  ({value, onValueChange, size = 'base' }) {
    const height = useSharedValue(0);
    const width = useSharedValue(0);
    const duration = 400;

    const thumbAnimatedStyle = useAnimatedStyle(() => {
        const moveValue = interpolate(
            Number(value),
            [0, 1],
            [0, width.value - height.value]
        );
        const translateValue = withTiming(moveValue, { duration });

        return {
            transform: [{ translateX: translateValue }],

        };
    }, [height, width, value]);

    return (
        <Pressable onPress={onValueChange}>
            <View
                className={`${themeSettings.track} ${themeSettings['size_'+size][0]} ${value ? themeSettings.active_track_color : themeSettings.track_color}`}
                onLayout={(e) => {
                    height.value = e.nativeEvent.layout.height;
                    width.value = e.nativeEvent.layout.width;
                }}
               >
                <Animated.View className={`${themeSettings['size_'+size][1]} ${themeSettings.thumb}`} style={[ thumbAnimatedStyle]}></Animated.View>
            </View>
        </Pressable>
    );
};
