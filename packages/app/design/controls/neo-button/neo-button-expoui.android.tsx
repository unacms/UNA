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
    width as widthModifier,
} from '@expo/ui/jetpack-compose/modifiers';
import { useAndroidStyleColors } from 'app/design/controls/neo-button/native-style-colors';
import { useResolvedNeoButton, resolveScoped, parseNeoButtonAddon } from 'app/design/controls/neo-button/neo-button-resolver';
import { useFrozenHostSize, useLockedNativePress, wrapNativeButtonHost } from 'app/design/controls/neo-button/neo-button-expoui-host';
import { FeedbackHaptics, findIconFromRemote } from 'app/lib/util';
import type { NeoButtonExpoUIConfig, NeoButtonExpoUIProps } from 'app/design/controls/neo-button/neo-button.types';

const VARIANT_COMPONENTS: Record<string, typeof Button> = {
    filled: Button,
    tonal: FilledTonalButton,
    outlined: OutlinedButton,
    elevated: ElevatedButton,
    text: TextButton,
};

const TINT_FILLS_CONTAINER = new Set(['filled', 'elevated']);

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
        accessibilityLabel, alt,
        className, classNames,
        nativeConfig,
    } = props;

    const resolved = useResolvedNeoButton({
        role, style, buttonStyle, controlSize, borderShape, tint,
        image: image ?? systemImage, systemImage,
        imagePlacement, align, width, disabled, haptics,
    });

    const fill = resolved.width === 'fill';

    const hostClasses = [className, classNames?.root].filter(Boolean).join(' ');
    const hostClassStyle = useResolveClassNames(hostClasses || '');
    const flatHost = StyleSheet.flatten(hostClassStyle) || {};

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

    const firePress = (onPress || onPressIn) && !disabled && !loading
        ? () => {
              if (resolved.haptics) FeedbackHaptics(resolved.haptics);
              (onPressIn || onPress)!();
              if (onPress && onPressIn && onPress !== onPressIn) onPress();
          }
        : undefined;
    const handlePress = useLockedNativePress(firePress);

    const addonMeta = parseNeoButtonAddon(addon);
    const frozen = useFrozenHostSize({
        contentKey: [String(effectiveLabel), rawImage || '', variant, selected ? 'sel' : 'off', addonMeta?.text || ''].join('|'),
        rnOwnsWidth,
        rnOwnsHeight,
    });

    const hasLabel = effectiveLabel !== '';
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
                onClick={handlePress}
                enabled={true}
                colors={colors}
                modifiers={rnOwnsWidth ? [fillMaxWidth()] : undefined}
            >
                {resolved.imagePlacement !== 'trailing' ? icon : null}
                {resolved.imagePlacement !== 'trailing' ? labelGapSpacer : null}
                {hasLabel ? <ComposeText>{String(effectiveLabel)}</ComposeText> : null}
                {addonMeta ? <Spacer modifiers={[widthModifier(resolved.labelGap)]} /> : null}
                {addonMeta ? <ComposeText>{addonMeta.text}</ComposeText> : null}
                {resolved.imagePlacement === 'trailing' ? labelGapSpacer : null}
                {resolved.imagePlacement === 'trailing' ? icon : null}
            </ButtonComponent>
        </Host>
    );

    return wrapNativeButtonHost(host, {
        hitSlop: resolved.hitSlop,
        fill: fillWrapper,
        height: resolved.height,
        width: iconHostWidth,
        onPress: handlePress,
        disabled: disabled || loading,
    });
}
