/**
 * Material3 NeoButton (`@expo/ui/jetpack-compose`).
 * Style → component via `androidVariants`. Icons via `androidIcons` only.
 */

import { StyleSheet } from 'react-native';
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
import { useResolvedNeoButton, resolveScoped } from 'app/design/controls/neo-button-resolver';
import { useFrozenHostSize, wrapNativeButtonHost } from 'app/design/controls/neo-button-native-host';
import { FeedbackHaptics, findIconFromRemote } from 'app/lib/util';

const VARIANT_COMPONENTS = {
    filled: Button,
    tonal: FilledTonalButton,
    outlined: OutlinedButton,
    elevated: ElevatedButton,
    text: TextButton,
};

const TINT_FILLS_CONTAINER = new Set(['filled', 'elevated']);

const isNativeColor = (color) =>
    typeof color === 'string' && color.length > 0 && !color.includes('var(');

export function getNativeIcon(rawImage, config) {
    if (typeof rawImage !== 'string' || rawImage === '') return null;
    return config?.androidIcons?.[findIconFromRemote(rawImage)] ?? null;
}

export function NeoButtonNative(props) {
    const {
        role, style, buttonStyle, controlSize, borderShape, tint,
        label, title, loadingLabel, image, systemImage, imagePlacement,
        disabled = false, loading = false,
        haptics, onPress,
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

    const rnOwnsWidth = fill
        || flatHost.width != null || flatHost.flexGrow != null
        || flatHost.flex != null || flatHost.flexBasis != null;
    const rnOwnsHeight = flatHost.height != null || flatHost.minHeight != null;

    const effectiveLabel = (loading && loadingLabel != null && loadingLabel !== '')
        ? loadingLabel
        : (label ?? title ?? '');

    const rawImage = systemImage ?? image;
    const iconSource = getNativeIcon(rawImage, nativeConfig);

    const variants = resolveScoped(nativeConfig?.androidVariants, resolved.env) || {};
    const variant = variants[resolved.style] ?? 'tonal';
    const ButtonComponent = VARIANT_COMPONENTS[variant] ?? FilledTonalButton;

    const colorsConfig = resolveScoped(nativeConfig?.androidColors, resolved.env);
    const variantColors = colorsConfig?.[variant] ? { ...colorsConfig[variant] } : {};
    const { tintedContainerColor, ...baseColors } = variantColors;
    const explicitTint = isNativeColor(resolved.tint) ? resolved.tint : null;
    let colors;
    if (explicitTint) {
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

    const handlePress = onPress
        ? () => {
              if (resolved.haptics) FeedbackHaptics(resolved.haptics);
              onPress();
          }
        : undefined;

    const frozen = useFrozenHostSize({
        contentKey: [String(effectiveLabel), rawImage || '', variant].join('|'),
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
            style={[hostClassStyle, fill ? { width: '100%' } : null, frozen.style]}
        >
            <ButtonComponent
                onClick={handlePress}
                enabled={!disabled && !loading}
                colors={colors}
                modifiers={rnOwnsWidth ? [fillMaxWidth()] : undefined}
            >
                {resolved.imagePlacement !== 'trailing' ? icon : null}
                {resolved.imagePlacement !== 'trailing' ? labelGapSpacer : null}
                {hasLabel ? <ComposeText>{String(effectiveLabel)}</ComposeText> : null}
                {resolved.imagePlacement === 'trailing' ? labelGapSpacer : null}
                {resolved.imagePlacement === 'trailing' ? icon : null}
            </ButtonComponent>
        </Host>
    );

    return wrapNativeButtonHost(host, {
        hitSlop: resolved.hitSlop,
        fill,
        onPress: handlePress,
        disabled: disabled || loading,
    });
}
