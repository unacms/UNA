import { useEffect, type ReactNode } from 'react';
import { Animated, Easing } from 'react-native';
import { View, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { NeoButtonLink } from 'app/design/controls';
import { isWeb } from 'app/lib/util';
import emitter, { EVENTS } from 'app/context/emitter';
import { useReduceMotionSetting } from 'app/lib/hooks/use-reduce-motion';
import { useAnimatedValue } from 'app/lib/hooks/use-animated-value';

/** What UNA sends beside an empty list (BxDolEmptyState): words in the viewer's language, links of the site. */
export type EmptyStateData = {
    title?: string;
    text?: string;
    buttons?: { title: string; link: string; style?: 'primary' | 'secondary'; action?: 'compose' }[];
};

/**
 * A button's action, done in place when the page can: `compose` opens the page's post composer
 * (MultiPostForm listens) instead of following the link. Without a composer the link is followed.
 */
function pressAction(action: string | undefined, event?: { preventDefault?: () => void }) {
    if (action !== 'compose' || emitter.listeners(EVENTS.composer).length === 0) return;
    event?.preventDefault?.();
    emitter.emit(EVENTS.composer, { action: 'open' });
}

type EmptyStateProps = {
    /** The list's skeletons in its own layout (a feed column, tiles...), without their pulse. */
    preview?: ReactNode;
    /** The skeletons were on screen while it loaded: they settle into the preview instead of it fading in. */
    fromSkeletons?: boolean;
    /** UNA's title, text and buttons for this list. */
    state?: EmptyStateData | null;
    /** The title when UNA sends none. */
    fallbackTitle: string;
};

/** How far the preview settles: a quieter, slightly smaller copy of the list. */
const PREVIEW_SCALE = 0.94;
const PREVIEW_OPACITY = 0.55;
const DURATION_MS = 320;

/**
 * The empty state of a list, centred in the space the list would fill: a few of the list's own
 * skeleton items, laid out as the list lays its items out and fading away downwards, then UNA's
 * title, text and buttons (a block's Studio app config can set them; see BxDolEmptyState).
 * When skeletons were showing while the list loaded, they dim and shrink into the preview and
 * the words fade in under it; with reduce motion it appears at once. The preview is decoration,
 * hidden from assistive tech.
 */
export default function EmptyState({ preview, fromSkeletons = false, state, fallbackTitle }: Readonly<EmptyStateProps>) {
    // Null until the setting is known: the settle waits for it rather than play for someone who turned motion off.
    const reduceMotion = useReduceMotionSetting();
    // 0: as the loading skeletons showed it; 1: settled.
    const progress = useAnimatedValue(fromSkeletons ? 0 : 1);
    const wordsOpacity = useAnimatedValue(fromSkeletons ? 0 : 1);

    useEffect(() => {
        if (!fromSkeletons || reduceMotion === null) return;
        if (reduceMotion) {
            progress.setValue(1);
            wordsOpacity.setValue(1);
            return;
        }
        Animated.parallel([
            Animated.timing(progress, { toValue: 1, duration: DURATION_MS, easing: Easing.bezier(0.2, 0, 0, 1), useNativeDriver: !isWeb }),
            Animated.timing(wordsOpacity, { toValue: 1, duration: DURATION_MS, delay: 120, easing: Easing.out(Easing.quad), useNativeDriver: !isWeb }),
        ]).start();
    }, [fromSkeletons, reduceMotion, progress, wordsOpacity]);

    const title = state?.title || fallbackTitle;
    const buttons = state?.buttons ?? [];

    // On web at least the list's share of a tall window (60svh), so the words sit mid-page, not in its top third.
    return (
        <View className="w-full flex-1 items-center justify-center py-8 min-h-120 web:min-h-[60svh]" role="status">
            {preview ? (
                <View
                    aria-hidden
                    importantForAccessibility="no-hide-descendants"
                    accessibilityElementsHidden
                    pointerEvents="none"
                    className="relative w-full max-h-65 overflow-hidden"
                >
                    <Animated.View
                        style={{
                            opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [1, PREVIEW_OPACITY] }),
                            transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, PREVIEW_SCALE] }) }],
                        }}
                    >
                        {preview}
                    </Animated.View>
                    {/* The list fades into the page: the words below read as its end. */}
                    <View className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-b from-transparent to-background" />
                </View>
            ) : null}
            <Animated.View style={{ opacity: wordsOpacity }} className="items-center gap-2 px-6 -mt-6">
                <Text className="text-center text-lg font-semibold text-foreground">{title}</Text>
                {state?.text ? (
                    <Text className="text-center text-base text-muted-foreground max-w-105">{state.text}</Text>
                ) : null}
                {buttons.length ? (
                    <Row className="flex-wrap justify-center gap-2 pt-3">
                        {buttons.map((button, index) => (
                            <NeoButtonLink
                                key={button.link + index}
                                href={button.link}
                                label={button.title}
                                style={button.style === 'secondary' ? 'bordered' : 'borderedProminent'}
                                controlSize="regular"
                                {...(button.action ? { onPress: (event?: any) => pressAction(button.action, event) } : null)}
                            />
                        ))}
                    </Row>
                ) : null}
            </Animated.View>
        </View>
    );
}
