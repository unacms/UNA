/**
 * Material3 NeoButton (`@expo/ui/jetpack-compose`).
 * Style → component via `androidVariants`. Icons via `androidIcons` only.
 */

import { StyleSheet, type ImageSourcePropType } from 'react-native';
import { useResolveClassNames } from 'uniwind';
import {
    Host,
    Button,
    FilledTonalButton,
    OutlinedButton,
    ElevatedButton,
    TextButton,
    Text as ComposeText,
    Icon as ComposeIcon,
    Spacer,
} from '@expo/ui/jetpack-compose';
import {
    fillMaxWidth,
    weight,
    width as widthModifier,
} from '@expo/ui/jetpack-compose/modifiers';
import { useAndroidStyleColors } from 'app/design/controls/neo-button/native-style-colors';
import { useResolvedNeoButton, resolveScoped, parseNeoButtonAddon } from 'app/design/controls/neo-button/neo-button-resolver';
import { useFrozenHostSize, useNativeButtonPress, wrapNativeButtonHost } from 'app/design/controls/neo-button/neo-button-expoui-host';
import { FeedbackHaptics, findIconFromRemote } from 'app/lib/util';
import type { NeoButtonExpoUIConfig, NeoButtonExpoUIProps } from 'app/design/controls/neo-button/neo-button.types';
import { COMPOSE_FONT_WEIGHT, NATIVE_BUTTON_FONT_FAMILY, fontSizeFromClass, fontWeightFromClass } from 'app/design/controls/neo-button/native-font';

const VARIANT_COMPONENTS: Record<string, typeof Button> = {
    filled: Button,
    tonal: FilledTonalButton,
    outlined: OutlinedButton,
    elevated: ElevatedButton,
    text: TextButton,
};

const TINT_FILLS_CONTAINER = new Set(['filled', 'elevated']);

// Material3 `ButtonDefaults.ContentPadding` vertical inset.
const MATERIAL_PADDING_Y = 8;

const isNativeColor = (color: unknown): color is string =>
    typeof color === 'string' && color.length > 0 && !color.includes('var(');

export function getNativeIcon(rawImage: unknown, config?: NeoButtonExpoUIConfig): ImageSourcePropType | null {
    if (typeof rawImage !== 'string' || rawImage === '') return null;
    return config?.androidIcons?.[findIconFromRemote(rawImage)] ?? null;
}

/** Custom content (children / element `image`) stays on the JS path. */
export const hostsCustomContent = false;

export function NeoButtonExpoUI(props: NeoButtonExpoUIProps) {
    const {
        role, style, buttonStyle, controlSize, borderShape, tint,
        label, title, loadingLabel, image, systemImage, imagePlacement,
        disabled = false, loading = false, selected = false, addon,
        haptics, onPress, onPressIn,
        width, align,
        accessibilityLabel, alt, accessibilityRole,
        hitarea, hitSlop,
        className, classNames, contentInsets,
        nativeConfig,
    } = props;

    const resolved = useResolvedNeoButton({
        role, style, buttonStyle, controlSize, borderShape, tint,
        image: image ?? systemImage, systemImage,
        imagePlacement, align, width, disabled, haptics,
    });

    const fill = resolved.width === 'fill';

    // `className` styles the Host (the surface); `classNames.root` goes on the
    // outer wrapper so self-* / flex-* / margins reach the parent's layout.
    // Sizing decisions read both.
    const hostClassStyle = useResolveClassNames(className || '');
    const rootClassStyle = useResolveClassNames(classNames?.root || '');
    const flatHost = StyleSheet.flatten([hostClassStyle, rootClassStyle]) || {};

    const effectiveLabel = (loading && loadingLabel != null && loadingLabel !== '')
        ? loadingLabel
        : (label ?? title ?? '');

    const rawImage = systemImage ?? image;
    const iconSource = getNativeIcon(rawImage, nativeConfig);
    const isIconOnly = !!iconSource && effectiveLabel === '';
    const iconHostWidth = !isIconOnly
        ? null
        : (resolved.aspectSquare
            ? resolved.height
            : Math.max(resolved.height, (resolved.paddingX ?? 0) * 2 + (resolved.iconSize ?? 0)));
    const rnOwnsWidth = iconHostWidth != null || fill
        || flatHost.width != null || flatHost.flexGrow != null
        || flatHost.flex != null || flatHost.flexBasis != null;
    const rnOwnsHeight = true;
    // JS NeoButton stretches when classNames.root has w-full/flex. Host with
    // width="auto" used alignSelf:flex-start and collapsed to 0 on Android.
    const fillWrapper = fill || (rnOwnsWidth && iconHostWidth == null);

    const variants = resolveScoped(nativeConfig?.androidVariants, resolved.env) || {};
    const variant = variants[resolved.style] ?? 'tonal';
    const ButtonComponent = VARIANT_COMPONENTS[variant] ?? FilledTonalButton;

    const colorMap = nativeConfig?.androidColors?.[variant];
    const pickedColors = useAndroidStyleColors(colorMap) as Record<string, any> | undefined;
    const variantColors = pickedColors ? { ...pickedColors } : {};
    const { tintedContainerColor, tintedContentColor, ...baseColors } = variantColors;
    const explicitTint = isNativeColor(resolved.tint) ? resolved.tint : null;
    let colors: Record<string, any> | undefined;
    if (selected && !explicitTint && isNativeColor(tintedContainerColor)) {
        colors = {
            containerColor: tintedContainerColor,
            contentColor: isNativeColor(tintedContentColor)
                ? tintedContentColor
                : (baseColors.contentColor || explicitTint),
        };
    } else if (explicitTint) {
        if (variant === 'tonal') {
            colors = {
                containerColor: isNativeColor(tintedContainerColor)
                    ? tintedContainerColor
                    : baseColors.containerColor,
                contentColor: explicitTint,
            };
        } else if (TINT_FILLS_CONTAINER.has(variant)) {
            colors = {
                ...baseColors,
                containerColor: explicitTint,
            };
        } else {
            colors = {
                ...baseColors,
                contentColor: explicitTint,
            };
        }
    } else if (Object.keys(baseColors).length) {
        colors = baseColors;
    }

    // The wrapper fires `onPress` on release, so a scroll that starts on the
    // button cancels it. `onPressIn` is the touch-down opt-in: on its own (or
    // as the same handler as `onPress`) it is the action, fired once on
    // touch-down; a different `onPressIn` runs alongside, like the JS button.
    // The Host's own press only counts without a touch (TalkBack).
    const pressInOnly = !!onPressIn && (!onPress || onPressIn === onPress);
    const action = onPress || onPressIn;
    const firePress = action && !disabled && !loading
        ? () => {
              if (resolved.haptics) FeedbackHaptics(resolved.haptics);
              action();
          }
        : undefined;
    const { press, hostPress, touchHandlers } = useNativeButtonPress(firePress);

    const addonMeta = parseNeoButtonAddon(addon);
    const frozen = useFrozenHostSize({
        contentKey: [String(effectiveLabel), rawImage || '', variant, selected ? 'sel' : 'off', addonMeta?.text || ''].join('|'),
        rnOwnsWidth,
        rnOwnsHeight,
    });

    // Label type from the theme, like the JS button and iOS: size from
    // `controlSizes.*.font`, weight from the style's text classes, the app
    // font family. Material's own label style is 14sp Roboto.
    const textCls = typeof resolved.textCls === 'function' ? resolved.textCls(selected ? 'pressedToggle' : 'default') : '';
    const labelStyle = {
        fontSize: fontSizeFromClass(resolved.fontCls, resolved.controlSize),
        fontWeight: COMPOSE_FONT_WEIGHT[fontWeightFromClass(`${resolved.fontCls || ''} ${textCls || ''}`) || 'medium'],
        ...(NATIVE_BUTTON_FONT_FAMILY ? { fontFamily: NATIVE_BUTTON_FONT_FAMILY } : {}),
    };

    const hasLabel = effectiveLabel !== '';
    // Material pads a labelled button 24dp on the sides (12dp for text
    // buttons). Container variants take the theme `paddingX` (or the button's
    // `contentInsets`) instead, like the JS button; vertical stays Material's.
    const insets = typeof contentInsets === 'string'
        ? resolved.contentInsets?.[contentInsets]
        : (contentInsets && typeof contentInsets === 'object' ? contentInsets : null);
    const contentPadding = hasLabel && !isIconOnly && variant !== 'text' && resolved.paddingX != null
        ? {
            start: insets?.left ?? resolved.paddingX,
            end: insets?.right ?? resolved.paddingX,
            top: MATERIAL_PADDING_Y,
            bottom: MATERIAL_PADDING_Y,
        }
        : undefined;
    const icon = iconSource ? (
        <ComposeIcon
            source={iconSource}
            size={resolved.iconSize}
            contentDescription={String(accessibilityLabel || alt || rawImage || '')}
        />
    ) : null;
    const labelGapSpacer = (icon && hasLabel)
        ? <Spacer modifiers={[widthModifier(resolved.labelGap)]} />
        : null;
    // Material centres a Button's content row. When the button is wider than
    // its content, a weighted spacer pushes it to the start / end (`align`),
    // like the iOS frame alignment.
    const alignStart = rnOwnsWidth && resolved.align === 'start';
    const alignEnd = rnOwnsWidth && resolved.align === 'end';
    const alignSpacer = (alignStart || alignEnd) ? <Spacer modifiers={[weight(1)]} /> : null;

    const host = (
        <Host
            matchContents={{
                horizontal: !rnOwnsWidth && !frozen.pinnedWidth,
                vertical: !rnOwnsHeight && !frozen.pinnedHeight,
            }}
            onLayoutContent={frozen.onLayoutContent}
            ignoreSafeAreaKeyboardInsets
            style={[
                hostClassStyle,
                {
                    height: resolved.height,
                    opacity: (disabled || loading) ? 0.6 : 1,
                },
                iconHostWidth != null ? { width: iconHostWidth } : null,
                fillWrapper ? { width: '100%' } : null,
                frozen.style,
            ]}
        >
            <ButtonComponent
                onClick={hostPress}
                enabled={true}
                colors={colors}
                contentPadding={contentPadding}
                modifiers={rnOwnsWidth ? [fillMaxWidth()] : undefined}
            >
                {alignEnd ? alignSpacer : null}
                {resolved.imagePlacement !== 'trailing' ? icon : null}
                {resolved.imagePlacement !== 'trailing' ? labelGapSpacer : null}
                {hasLabel ? <ComposeText style={labelStyle}>{String(effectiveLabel)}</ComposeText> : null}
                {addonMeta ? <Spacer modifiers={[widthModifier(resolved.labelGap)]} /> : null}
                {addonMeta ? <ComposeText style={labelStyle}>{addonMeta.text}</ComposeText> : null}
                {resolved.imagePlacement === 'trailing' ? labelGapSpacer : null}
                {resolved.imagePlacement === 'trailing' ? icon : null}
                {alignStart ? alignSpacer : null}
            </ButtonComponent>
        </Host>
    );

    return wrapNativeButtonHost(host, {
        hitSlop: hitarea === false ? 0 : (hitSlop ?? resolved.hitSlop),
        fill: fillWrapper,
        height: resolved.height,
        width: iconHostWidth,
        // Keyed on the handler, not `disabled`, so toggling disabled never swaps the wrapper (Host remount).
        onPress: onPress && !pressInOnly ? press : undefined,
        onPressIn: pressInOnly ? press : onPressIn,
        touchHandlers,
        disabled: disabled || loading,
        rootStyle: rootClassStyle,
        accessibilityRole,
        accessibilityLabel: accessibilityRole
            ? String(effectiveLabel || accessibilityLabel || alt || '') || undefined
            : undefined,
    });
}
