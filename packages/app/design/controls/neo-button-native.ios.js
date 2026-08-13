/**
 * SwiftUI NeoButton (`@expo/ui/swift-ui`). Icons are SF Symbols only.
 * Label is framed to `controlSizes` height because SwiftUI hugs ~34pt at
 * `.regular`. Host `matchContents` is mount-only — never toggle it live.
 */

import { StyleSheet } from 'react-native';
import { useResolveClassNames } from 'uniwind';
import { Host, Button, HStack, Image, Text, useNativeState } from '@expo/ui/swift-ui';
import {
    buttonStyle as buttonStyleModifier,
    controlSize as controlSizeModifier,
    buttonBorderShape as buttonBorderShapeModifier,
    tint as tintModifier,
    foregroundStyle,
    disabled as disabledModifier,
    accessibilityLabel as accessibilityLabelModifier,
    frame,
    font as fontModifier,
    symbolEffect,
} from '@expo/ui/swift-ui/modifiers';
import { useResolvedNeoButton, resolveScoped } from 'app/design/controls/neo-button-resolver';
import { useFrozenHostSize, wrapNativeButtonHost } from 'app/design/controls/neo-button-native-host';
import { FeedbackHaptics, findIconFromRemote } from 'app/lib/util';

// SF Symbol names are lowercase dot-separated identifiers ('square.and.arrow.up').
const SF_SYMBOL_RE = /^[a-z0-9]+(\.[a-z0-9]+)*$/;

// NeoButton roles → SwiftUI ButtonRole. 'close' / 'confirm' have no SwiftUI
// counterpart and stay 'default'.
const SWIFTUI_ROLE = { cancel: 'cancel', destructive: 'destructive' };

// Style chrome around the label, per SwiftUI controlSize. Subtracted from
// theme height so the finished control lands on 28/32/44/52/64, not ~34pt.
const SWIFTUI_LABEL_VPAD = { mini: 3, small: 5, regular: 7, large: 15, extraLarge: 20 };

// Fallback pt sizes when `iosFont.size` is omitted — matches the Tailwind
// `text-sm` / `text-base` / `text-lg` used in `controlSizes.font`.
const FONT_SIZE_PT = { mini: 14, small: 14, regular: 16, large: 16, extraLarge: 18 };

function fontSizeFromClass(fontCls, controlSize) {
    if (typeof fontCls === 'string') {
        if (fontCls.includes('text-lg')) return 18;
        if (fontCls.includes('text-sm')) return 14;
        if (fontCls.includes('text-base')) return 16;
    }
    return FONT_SIZE_PT[controlSize] ?? 16;
}

const SWIFTUI_ICON_PT = { mini: 13, small: 14, regular: 17, large: 20, extraLarge: 24 };

const isNativeColor = (color) =>
    typeof color === 'string' && color.length > 0 && !color.includes('var(');

function resolveIosStyleColors(nativeConfig, style, env, explicitTint) {
    const raw = resolveScoped(nativeConfig?.iosColors?.[style], env);
    const fallbackTint = resolveScoped(nativeConfig?.iosTint, env);
    const fromTheme = isNativeColor(raw)
        ? { tint: raw }
        : (raw && typeof raw === 'object' ? raw : {});
    if (isNativeColor(explicitTint)) {
        return { tint: explicitTint, foreground: null };
    }
    return {
        tint: isNativeColor(fromTheme.tint) ? fromTheme.tint
            : (isNativeColor(fallbackTint) ? fallbackTint : null),
        foreground: isNativeColor(fromTheme.foreground) ? fromTheme.foreground : null,
    };
}

function normalizeSymbolEffect(raw) {
    if (raw === false) return false;
    if (typeof raw === 'string') return { effect: raw };
    if (raw && typeof raw === 'object' && typeof raw.effect === 'string') return raw;
    return null;
}

function parseIosSymbol(mapped) {
    if (typeof mapped === 'string') {
        return SF_SYMBOL_RE.test(mapped) ? { name: mapped, effect: null, options: null } : null;
    }
    if (mapped && typeof mapped === 'object' && typeof mapped.name === 'string' && SF_SYMBOL_RE.test(mapped.name)) {
        return {
            name: mapped.name,
            effect: mapped.effect === undefined ? null : normalizeSymbolEffect(mapped.effect),
            options: mapped.options || null,
        };
    }
    return null;
}

function resolveIosSymbol(rawImage, config) {
    if (typeof rawImage !== 'string' || rawImage === '') return null;
    const lucideName = findIconFromRemote(rawImage);
    return parseIosSymbol(config?.iosSymbols?.[lucideName] || lucideName);
}

export function getNativeIcon(rawImage, config) {
    return resolveIosSymbol(rawImage, config)?.name ?? null;
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
    const mapping = resolved.nativeMapping;
    const fill = resolved.width === 'fill';

    const hostClasses = [className, classNames?.root].filter(Boolean).join(' ');
    const hostClassStyle = useResolveClassNames(hostClasses || '');
    const flatHost = StyleSheet.flatten(hostClassStyle) || {};

    const effectiveLabel = (loading && loadingLabel != null && loadingLabel !== '')
        ? loadingLabel
        : (label ?? title ?? '');

    const parsedSymbol = resolveIosSymbol(systemImage ?? image, nativeConfig);
    const sfSymbol = parsedSymbol?.name;
    const isIconOnly = !!sfSymbol && !effectiveLabel;
    // `.circle` clips chrome but SwiftUI still reports capsule intrinsic
    // width (regular horizontal padding). Pin layout to a square — same as
    // JS `aspectSquare`. hitSlop does not affect layout.
    const pinToSquare = isIconOnly && resolved.aspectSquare;

    const rnOwnsWidth = pinToSquare || fill
        || flatHost.width != null || flatHost.flexGrow != null
        || flatHost.flex != null || flatHost.flexBasis != null;
    const rnOwnsHeight = pinToSquare
        || flatHost.height != null || flatHost.minHeight != null;
    const defaultSymbolEffect = normalizeSymbolEffect(
        resolveScoped(nativeConfig?.iosSymbolEffect, resolved.env),
    );
    const iconEffect = parsedSymbol?.effect === false
        ? null
        : (parsedSymbol?.effect || defaultSymbolEffect);
    const symbolTrigger = useNativeState(0);
    const nativeLabel = String(
        effectiveLabel
        || accessibilityLabel
        || alt
        || (sfSymbol ? sfSymbol.split('.')[0] : ''),
    );
    const nativeControlSize =
        nativeConfig?.iosControlSize?.[resolved.controlSize] ?? mapping.controlSize;

    const iosIconSizeCfg = resolveScoped(nativeConfig?.iosIconSize, resolved.env);
    const nativeIconSize = typeof iosIconSizeCfg === 'number'
        ? iosIconSizeCfg
        : (iosIconSizeCfg?.[nativeControlSize]
            ?? iosIconSizeCfg?.[resolved.controlSize]
            ?? SWIFTUI_ICON_PT[nativeControlSize]
            ?? resolved.iconSize);

    const vPad = SWIFTUI_LABEL_VPAD[nativeControlSize] ?? SWIFTUI_LABEL_VPAD.regular;
    const targetHeight = (rnOwnsHeight
        && [flatHost.height, flatHost.minHeight].find((v) => typeof v === 'number'))
        || resolved.height;
    const labelFrameHeight = Math.max(resolved.iconSize, targetHeight - vPad * 2);

    // FrameModifier drops min/max when `height` is set — use minHeight/maxHeight
    // so fill can also set maxWidth: Infinity on the label (not the Button).
    const fillAlignment =
        resolved.align === 'start' ? 'leading'
        : resolved.align === 'end' ? 'trailing'
        : 'center';
    const labelModifiers = [];
    if (isIconOnly) {
        labelModifiers.push(frame({
            width: borderShape === 'circle'
                ? labelFrameHeight
                : Math.max(Math.round(resolved.iconSize * 1.5), labelFrameHeight),
            height: labelFrameHeight,
        }));
    } else {
        const labelFrame = {
            minHeight: labelFrameHeight,
            maxHeight: labelFrameHeight,
        };
        if (rnOwnsWidth) {
            labelFrame.maxWidth = Infinity;
            labelFrame.alignment = fillAlignment;
        }
        labelModifiers.push(frame(labelFrame));
    }

    const styleColors = resolved.role === 'destructive'
        ? { tint: null, foreground: null }
        : resolveIosStyleColors(nativeConfig, resolved.style, resolved.env, mapping.tint);
    const tintValue = styleColors.tint;
    const foregroundValue = styleColors.foreground;

    // iosFont.family is a PostScript name — CSS `font-main` does not resolve here.
    const iosFont = resolveScoped(nativeConfig?.iosFont, resolved.env);
    const textModifiers = [];
    if (iosFont && typeof iosFont === 'object') {
        const fontParams = {};
        if (typeof iosFont.family === 'string' && iosFont.family) {
            fontParams.family = iosFont.family;
        }
        if (iosFont.weight) fontParams.weight = iosFont.weight;
        if (iosFont.design) fontParams.design = iosFont.design;
        if (iosFont.textStyle) fontParams.textStyle = iosFont.textStyle;
        fontParams.size = typeof iosFont.size === 'number'
            ? iosFont.size
            : fontSizeFromClass(resolved.fontCls, nativeControlSize);
        if (fontParams.family || fontParams.weight || fontParams.design || fontParams.textStyle) {
            textModifiers.push(fontModifier(fontParams));
        }
    }
    if (foregroundValue) textModifiers.push(foregroundStyle(foregroundValue));

    const modifiers = [
        buttonStyleModifier(mapping.buttonStyle),
        controlSizeModifier(nativeControlSize),
    ];

    if (borderShape) {
        modifiers.push(
            borderShape === 'rectangle'
                ? buttonBorderShapeModifier('roundedRectangle', 0)
                : buttonBorderShapeModifier(mapping.buttonBorderShape),
        );
    }

    if (tintValue) modifiers.push(tintModifier(tintValue));
    if (foregroundValue) labelModifiers.push(foregroundStyle(foregroundValue));
    if (isIconOnly && nativeLabel) modifiers.push(accessibilityLabelModifier(nativeLabel));
    if (disabled || loading) modifiers.push(disabledModifier(true));
    if (pinToSquare) {
        modifiers.push(frame({ width: targetHeight, height: targetHeight }));
    } else if (rnOwnsWidth) {
        modifiers.push(frame({ maxWidth: Infinity, alignment: fillAlignment }));
    }

    const handlePress = onPress
        ? () => {
              if (sfSymbol && iconEffect) symbolTrigger.set(symbolTrigger.get() + 1);
              if (resolved.haptics) FeedbackHaptics(resolved.haptics);
              onPress();
          }
        : undefined;

    const imageModifiers = (sfSymbol && iconEffect)
        ? [symbolEffect(iconEffect, {
            value: symbolTrigger,
            options: parsedSymbol?.options || { repeat: 'nonRepeating' },
        })]
        : undefined;

    const frozen = useFrozenHostSize({
        contentKey: [
            nativeLabel, sfSymbol || '', nativeControlSize, targetHeight,
            mapping.buttonStyle, borderShape || '', 'host-fit',
            iosFont?.family || '', iosFont?.weight || '', String(nativeIconSize),
            tintValue || '', foregroundValue || '',
        ].join('|'),
        rnOwnsWidth,
        rnOwnsHeight,
    });

    const host = (
        <Host
            matchContents={{
                horizontal: !rnOwnsWidth && !frozen.pinnedWidth,
                vertical: !rnOwnsHeight && !frozen.pinnedHeight,
            }}
            onLayoutContent={frozen.onLayoutContent}
            ignoreSafeArea="container"
            collapsable={false}
            style={[
                hostClassStyle,
                pinToSquare ? { width: targetHeight, height: targetHeight } : null,
                fill ? { width: '100%' } : null,
                frozen.style,
            ]}
        >
            <Button
                role={SWIFTUI_ROLE[resolved.role]}
                onPress={handlePress}
                modifiers={modifiers}
            >
                <HStack spacing={resolved.labelGap} modifiers={labelModifiers}>
                    {(sfSymbol && resolved.imagePlacement !== 'trailing') ? (
                        <Image systemName={sfSymbol} size={nativeIconSize} color={foregroundValue || undefined} modifiers={imageModifiers} />
                    ) : null}
                    {!isIconOnly ? (
                        <Text modifiers={textModifiers.length ? textModifiers : undefined}>
                            {nativeLabel}
                        </Text>
                    ) : null}
                    {(sfSymbol && resolved.imagePlacement === 'trailing') ? (
                        <Image systemName={sfSymbol} size={nativeIconSize} color={foregroundValue || undefined} modifiers={imageModifiers} />
                    ) : null}
                </HStack>
            </Button>
        </Host>
    );

    return wrapNativeButtonHost(host, {
        hitSlop: resolved.hitSlop,
        fill,
        onPress: handlePress,
        disabled: disabled || loading,
    });
}
