'use client';

import {
    Children,
    cloneElement,
    isValidElement,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';
import { Animated } from 'react-native';
import { View } from 'app/design/view';
import { Text } from 'app/design/typography';
import { appSetting, cn } from 'app/lib/util';
import { nativeDriver } from 'app/lib/animation';

const adaptiveEnabled = () => Boolean(appSetting('forms', 'adaptive_labels'));
const labelTheme = () => appSetting('theme', 'inputs') ?? {};

/**
 * When `forms.adaptive_labels` is on and the field uses caption-as-placeholder,
 * renders an eyebrow label that rests inside the field (placeholder position)
 * and floats onto the top edge when focused or when the field has a value.
 *
 * Vertical position is layout-measured + Animated so it works on native and web
 * (CSS `top-1/2` / `-translate-y-1/2` is unreliable in RN).
 */
export default function AdaptiveLabel({
    caption,
    value,
    useCaptionAsPlaceholder,
    children,
}) {
    const enabled =
        !!useCaptionAsPlaceholder && adaptiveEnabled() && !!caption;

    const [focused, setFocused] = useState(false);
    const hasValue = value != null && String(value).length > 0;
    const floated = focused || hasValue;
    const theme = labelTheme();

    const onlyChild = Children.only(children);
    const child = isValidElement(onlyChild) ? onlyChild : null;

    const [boxH, setBoxH] = useState(0);
    const [labelH, setLabelH] = useState(0);
    const translateY = useRef(new Animated.Value(0)).current;
    const readyRef = useRef(false);

    const restingOffset =
        typeof theme.adaptive_label_resting_offset === 'number'
            ? theme.adaptive_label_resting_offset
            : 0;
    const floatedOffset =
        typeof theme.adaptive_label_floated_offset === 'number'
            ? theme.adaptive_label_floated_offset
            : -2;
    const duration =
        typeof theme.adaptive_label_duration === 'number'
            ? theme.adaptive_label_duration
            : 200;

    const restingY =
        boxH > 0 && labelH > 0
            ? Math.max(0, (boxH - labelH) / 2) + restingOffset
            : 0;
    const floatedY =
        labelH > 0 ? -labelH / 2 + floatedOffset : floatedOffset;

    useEffect(() => {
        if (!enabled || boxH <= 0 || labelH <= 0) return;

        const toValue = floated ? floatedY : restingY;

        if (!readyRef.current) {
            readyRef.current = true;
            translateY.setValue(toValue);
            return;
        }

        Animated.timing(translateY, {
            toValue,
            duration,
            useNativeDriver: nativeDriver,
        }).start();
    }, [
        enabled,
        floated,
        restingY,
        floatedY,
        boxH,
        labelH,
        duration,
        translateY,
    ]);

    const onFocus = useCallback(
        (event) => {
            setFocused(true);
            child?.props?.onFocus?.(event);
        },
        [child]
    );

    const onBlur = useCallback(
        (event) => {
            setFocused(false);
            child?.props?.onBlur?.(event);
        },
        [child]
    );

    const onBoxLayout = useCallback((event) => {
        const next = event?.nativeEvent?.layout?.height ?? 0;
        setBoxH((prev) => (prev === next ? prev : next));
    }, []);

    const onLabelLayout = useCallback((event) => {
        const next = event?.nativeEvent?.layout?.height ?? 0;
        setLabelH((prev) => (prev === next ? prev : next));
    }, []);

    if (!enabled || !child) {
        return children;
    }

    return (
        <View className="relative w-full" onLayout={onBoxLayout}>
            {/*
              Animate outer RN Animated.View; keep Uniwind classes on design View/Text
              (RN Animated.View drops className on web).
            */}
            <Animated.View
                pointerEvents="none"
                collapsable={false}
                style={{
                    position: 'absolute',
                    top: 0,
                    zIndex: 10,
                    opacity: boxH > 0 && labelH > 0 ? 1 : 0,
                    transform: [{ translateY }],
                }}
            >
                <View
                    onLayout={onLabelLayout}
                    className={cn(
                        theme.adaptive_label,
                        floated ? theme.adaptive_label_floated : null
                    )}
                >
                    <Text
                        className={
                            floated
                                ? theme.adaptive_label_text_floated
                                : theme.adaptive_label_text_resting
                        }
                    >
                        {caption}
                    </Text>
                </View>
            </Animated.View>
            {cloneElement(child, {
                placeholder: '',
                onFocus,
                onBlur,
            })}
        </View>
    );
}
