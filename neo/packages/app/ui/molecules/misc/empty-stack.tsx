import { useEffect, type ReactNode } from 'react';
import { Animated, Easing } from 'react-native';
import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { isWeb } from 'app/lib/util';
import { useReduceMotion } from 'app/lib/hooks/use-reduce-motion';
import { useAnimatedValue } from 'app/lib/hooks/use-animated-value';

/** Width the cards are laid out at before they are scaled into the stack. */
const CARD_WIDTH = 320;
/** The stack's size: the cards at SCALE, plus room for the offsets below. */
const SCALE = 0.42;
const STACK_HEIGHT = 112;
const DURATION_MS = 320;

/** Back to front: offset (px, after scaling), tilt (deg) and opacity of each card. */
const LAYERS = [
    { y: -14, rotate: -5, opacity: 0.35 },
    { y: -7, rotate: 3, opacity: 0.6 },
    { y: 0, rotate: 0, opacity: 1 },
];

type EmptyStackProps = {
    /** One skeleton card of the list (getSkeletonCard). */
    card: ReactNode;
    /** The list's skeletons were on screen: they shrink into the stack instead of the stack fading in. */
    fromSkeletons?: boolean;
    /** The message under the stack. */
    message: string;
};

/**
 * The empty state of a list: three of its own skeleton cards, small and stacked, with the
 * message under them. When the list was showing skeletons, they gather into the stack
 * (scale, offset and tilt over ~300 ms), so the placeholder becomes the answer instead of
 * vanishing; with reduce motion on it appears at once. The cards are decoration, hidden from
 * assistive tech; the message is the content.
 */
export default function EmptyStack({ card, fromSkeletons = false, message }: Readonly<EmptyStackProps>) {
    const reduceMotion = useReduceMotion();
    // 0: as the skeleton list showed them (full size, straight); 1: stacked.
    const progress = useAnimatedValue(fromSkeletons ? 0 : 1);
    const textOpacity = useAnimatedValue(fromSkeletons ? 0 : 1);

    useEffect(() => {
        if (!fromSkeletons) return;
        if (reduceMotion) {
            progress.setValue(1);
            textOpacity.setValue(1);
            return;
        }
        Animated.sequence([
            Animated.timing(progress, { toValue: 1, duration: DURATION_MS, easing: Easing.bezier(0.2, 0, 0, 1), useNativeDriver: !isWeb }),
            Animated.timing(textOpacity, { toValue: 1, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: !isWeb }),
        ]).start();
    }, [fromSkeletons, reduceMotion, progress, textOpacity]);

    return (
        <View className="items-center justify-center gap-3 py-8 px-4" role="status">
            <View
                aria-hidden
                importantForAccessibility="no-hide-descendants"
                accessibilityElementsHidden
                className="items-center justify-center"
                style={{ width: CARD_WIDTH * SCALE + 24, height: STACK_HEIGHT }}
                pointerEvents="none"
            >
                {LAYERS.map((layer, index) => (
                    <Animated.View
                        key={index}
                        style={{
                            position: 'absolute',
                            width: CARD_WIDTH,
                            opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [index === LAYERS.length - 1 ? 1 : 0, layer.opacity] }),
                            transform: [
                                { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [index * 24, layer.y / SCALE] }) },
                                { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${layer.rotate}deg`] }) },
                                { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.9, SCALE] }) },
                            ],
                        }}
                    >
                        {card}
                    </Animated.View>
                ))}
            </View>
            <Animated.View style={{ opacity: textOpacity }}>
                <Text className="text-center text-base font-semibold text-muted-foreground">{message}</Text>
            </Animated.View>
        </View>
    );
}
