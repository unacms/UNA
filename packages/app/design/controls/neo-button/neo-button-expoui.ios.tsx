/**
 * SwiftUI NeoButton (`@expo/ui/swift-ui`). Glyphs are Lucide template assets
 * (`Lucide/<kebab>`) or SF Symbols per `iosIconSource`; icon-like custom
 * content (header logo) is hosted in the label via `RNHostView`.
 * Label is framed to `controlSizes` height because SwiftUI hugs ~34pt at
 * `.regular`. Host `matchContents` is mount-only — never toggle it live.
 */

import { StyleSheet, View } from 'react-native';
import { useResolveClassNames } from 'uniwind';
import { isValidElement, type ComponentProps } from 'react';
import { Host, Button, HStack, Image, RNHostView, Text, useNativeState } from '@expo/ui/swift-ui';
import {
    buttonStyle as buttonStyleModifier,
    controlSize as controlSizeModifier,
    buttonBorderShape as buttonBorderShapeModifier,
    tint as tintModifier,
    foregroundStyle,
    accessibilityLabel as accessibilityLabelModifier,
    frame,
    font as fontModifier,
    symbolEffect,
    glassEffect,
    background,
    padding,
    resizable,
    shapes,
} from '@expo/ui/swift-ui/modifiers';
import { useThemeValue } from 'app/design/theme';
import { useIosStyleColors, useNativeTokenColor } from 'app/design/controls/neo-button/native-style-colors';
import { lucideAssetName } from 'app/lib/platform/lucide-assets';
import { toHexColor } from 'app/lib/platform/native-color';
import { useResolvedNeoButton, resolveScoped, parseNeoButtonAddon } from 'app/design/controls/neo-button/neo-button-resolver';
import { useFrozenHostSize, useLockedNativePress, wrapNativeButtonHost } from 'app/design/controls/neo-button/neo-button-expoui-host';
import { FeedbackHaptics, appSetting, findIconFromRemote } from 'app/lib/util';
import type { NeoButtonExpoUIConfig, NeoButtonExpoUIProps } from 'app/design/controls/neo-button/neo-button.types';

type SwiftUIModifier = ReturnType<typeof frame>;
type FontParams = Parameters<typeof fontModifier>[0];
type FontWeight = NonNullable<FontParams['weight']>;
type SymbolEffectConfig = { effect: string; [key: string]: any };
type SFSymbol = NonNullable<ComponentProps<typeof Image>['systemName']>;

// SF Symbol names are lowercase dot-separated identifiers ('square.and.arrow.up').
const SF_SYMBOL_RE = /^[a-z0-9]+(\.[a-z0-9]+)*$/;

// NeoButton roles → SwiftUI ButtonRole. 'close' / 'confirm' have no SwiftUI
// counterpart and stay 'default'.
const SWIFTUI_ROLE: Record<string, 'cancel' | 'destructive'> = { cancel: 'cancel', destructive: 'destructive' };

// Style chrome around the label, per SwiftUI controlSize. Subtracted from
// theme height so the finished control lands on 28/32/44/52/64, not ~34pt.
const SWIFTUI_LABEL_VPAD: Record<string, number> = { mini: 3, small: 5, regular: 7, large: 15, extraLarge: 20 };

// Fallback pt sizes when `iosFont.size` is omitted — matches the Tailwind
// `text-sm` / `text-base` / `text-lg` used in `controlSizes.font`.
const FONT_SIZE_PT: Record<string, number> = { mini: 14, small: 14, regular: 16, large: 16, extraLarge: 18 };

function fontSizeFromClass(fontCls: unknown, controlSize: string) {
    if (typeof fontCls === 'string') {
        if (fontCls.includes('text-xl')) return 20;
        if (fontCls.includes('text-lg')) return 18;
        if (fontCls.includes('text-base')) return 16;
        if (fontCls.includes('text-sm')) return 14;
        if (fontCls.includes('text-xs')) return 12;
    }
    return FONT_SIZE_PT[controlSize] ?? 16;
}

const FONT_WEIGHT_FROM_CLASS: [string, FontWeight][] = [
    ['font-extralight', 'ultraLight'],
    ['font-thin', 'thin'],
    ['font-light', 'light'],
    ['font-semibold', 'semibold'],
    ['font-extrabold', 'heavy'],
    ['font-black', 'black'],
    ['font-bold', 'bold'],
    ['font-medium', 'medium'],
    ['font-normal', 'regular'],
];

function fontWeightFromClass(cls: unknown): FontWeight | null {
    if (typeof cls !== 'string' || !cls) return null;
    for (const [token, weight] of FONT_WEIGHT_FROM_CLASS) {
        if (cls.includes(token)) return weight;
    }
    return null;
}

const SWIFTUI_ICON_PT: Record<string, number> = { mini: 13, small: 14, regular: 17, large: 20, extraLarge: 24 };

const isNativeColor = (color: unknown): color is string =>
    typeof color === 'string' && color.length > 0 && !color.includes('var(');

function resolveIosStyleColors(
    style: string,
    explicitTint: unknown,
    selected: boolean,
    raw: any,
    fallbackTint: unknown,
): { tint: string | null; foreground: string | null } {
    // Unselected glass: no hex at all. SwiftUI `.glass` tints the *label*
    // when you set `.tint()`, so a resting `#27272a` / `#dbeafe` pins ink
    // and kills the invert over dark content behind the capsule.
    if (style === 'glass' && !selected && !isNativeColor(explicitTint)) {
        return { tint: null, foreground: null };
    }
    const fromTheme = isNativeColor(raw)
        ? { tint: raw }
        : (raw && typeof raw === 'object' ? raw : {});
    if (isNativeColor(explicitTint) && !(style === 'glass' && selected)) {
        return { tint: explicitTint, foreground: null };
    }
    return {
        tint: isNativeColor(fromTheme.tint) ? fromTheme.tint
            : (isNativeColor(fallbackTint) ? fallbackTint : null),
        foreground: isNativeColor(fromTheme.foreground) ? fromTheme.foreground : null,
    };
}

type IosStyleColors = { tint?: string; foreground?: string };

/** Counter badges match the JS `CounterIndicator`: `primary` is an alert count. */
const ADDON_PALETTE = { tint: 'bg-accent', foreground: 'text-accent-foreground' };
const ADDON_PRIMARY_PALETTE = { tint: 'bg-destructive', foreground: 'text-destructive-foreground' };
/**
 * Soft fill behind a badge on selected glass, whose wash already carries the
 * accent: the foreground token at low alpha (applied here, so no extra class).
 */
const ADDON_WASH = 'bg-foreground';
const ADDON_WASH_ALPHA = 0.1;

/**
 * Counter badge (`addon`) beside the label, colored from theme tokens. Its own
 * component so plain buttons resolve none of these colors. On selected glass
 * the text follows the label (`labelColor`) over a soft wash.
 */
function AddonBadge({ text, variant, palette, labelColor, onSelectedGlass }: {
    text: string;
    variant?: string;
    palette?: unknown;
    labelColor?: string | null;
    onSelectedGlass: boolean;
}) {
    const regular = useIosStyleColors(palette ?? ADDON_PALETTE) as IosStyleColors | undefined;
    const primary = useIosStyleColors(ADDON_PRIMARY_PALETTE) as IosStyleColors | undefined;
    const washBase = useNativeTokenColor(ADDON_WASH);
    const wash = washBase ? toHexColor(washBase, ADDON_WASH_ALPHA) ?? undefined : undefined;
    const isPrimary = variant === 'primary';
    const ink = isPrimary ? primary?.foreground : (labelColor || regular?.foreground);
    const fill = isPrimary ? primary?.tint : (onSelectedGlass ? wash : regular?.tint);
    return (
        <Text
            modifiers={[
                fontModifier({ size: 11, weight: 'semibold' }),
                ...(ink ? [foregroundStyle(ink)] : []),
                padding({ horizontal: 6, vertical: 1 }),
                ...(fill ? [background(fill, shapes.capsule())] : []),
            ]}
        >
            {text}
        </Text>
    );
}

function normalizeSymbolEffect(raw: any): SymbolEffectConfig | false | null {
    if (raw === false) return false;
    if (typeof raw === 'string') return { effect: raw };
    if (raw && typeof raw === 'object' && typeof raw.effect === 'string') return raw;
    return null;
}

function parseIosSymbol(mapped: any): { name: string; effect: SymbolEffectConfig | false | null; options: any } | null {
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

type IosGlyph =
    | { kind: 'sf'; name: string; effect: SymbolEffectConfig | false | null; options: any }
    | { kind: 'asset'; name: string };

/**
 * `expo_ui.iosIconSource: 'lucide'` prefers the generated `Lucide/<kebab>`
 * template asset, `'sf'` the `iosSymbols` SF Symbol; each falls back to the
 * other. SF names (`systemImage`) never match a Lucide asset, so they stay SF.
 */
function resolveIosGlyph(rawImage: unknown, config?: NeoButtonExpoUIConfig): IosGlyph | null {
    if (typeof rawImage !== 'string' || rawImage === '') return null;
    const lucideName = findIconFromRemote(rawImage);
    const symbol = parseIosSymbol(config?.iosSymbols?.[lucideName] || lucideName);
    const sf: IosGlyph | null = symbol ? { kind: 'sf', ...symbol } : null;
    const assetName = lucideAssetName(lucideName);
    const asset: IosGlyph | null = assetName ? { kind: 'asset', name: assetName } : null;
    return appSetting('theme', 'expo_ui', 'iosIconSource') === 'sf' ? (sf ?? asset) : (asset ?? sf);
}

export function getNativeIcon(rawImage: unknown, config?: NeoButtonExpoUIConfig): string | null {
    return resolveIosGlyph(rawImage, config)?.name ?? null;
}

/** Icon-like custom content (logo, avatar) renders inside the SwiftUI label via RNHostView. */
export const hostsCustomContent = true;

const HOSTED_CONTENT_STYLE = StyleSheet.create({
    box: { alignItems: 'center', justifyContent: 'center' },
}).box;

export function NeoButtonExpoUI(props: NeoButtonExpoUIProps) {
    const {
        role, style, buttonStyle, controlSize, borderShape, tint,
        label, title, loadingLabel, image, systemImage, imagePlacement,
        disabled = false, loading = false, selected = false, addon,
        haptics, onPress, onPressIn,
        width, align,
        accessibilityLabel, alt,
        className, classNames,
        children, contentInsets,
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

    const glyph = resolveIosGlyph(systemImage ?? image, nativeConfig);
    const sfSymbol = glyph?.kind === 'sf' ? glyph.name : undefined;
    const assetName = glyph?.kind === 'asset' ? glyph.name : undefined;
    // Icon-like custom content (header logo, avatar): children, or an element `image`.
    const customContent = glyph
        ? null
        : (isValidElement(children) ? children : (isValidElement(image) ? image : null));
    const isIconOnly = !!glyph && !effectiveLabel;
    const isCustomOnly = !!customContent && !effectiveLabel;
    const pinToSquare = isIconOnly && resolved.aspectSquare;
    // Own width for every icon-only control. Capsule keeps JS paddingX so
    // bordered chrome is not clipped to the plus glyph (composer Plus).
    const rnOwnsWidth = isIconOnly || fill
        || flatHost.width != null || flatHost.flexGrow != null
        || flatHost.flex != null || flatHost.flexBasis != null;
    // Always pin Host height to controlSizes so icon-only and labelled
    // buttons share one baseline (matchContents hugs SwiftUI chrome).
    const rnOwnsHeight = true;
    const defaultSymbolEffect = normalizeSymbolEffect(
        resolveScoped(nativeConfig?.iosSymbolEffect, resolved.env),
    );
    const sfEffect = glyph?.kind === 'sf' ? glyph.effect : null;
    const iconEffect = sfEffect === false ? null : (sfEffect || defaultSymbolEffect);
    const symbolTrigger = useNativeState(0);
    const nativeLabel = String(
        effectiveLabel
        || accessibilityLabel
        || alt
        || (sfSymbol ? sfSymbol.split('.')[0] : '')
        || (assetName ? assetName.slice(assetName.indexOf('/') + 1) : ''),
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

    const vPad = SWIFTUI_LABEL_VPAD[nativeControlSize] ?? SWIFTUI_LABEL_VPAD.regular!;
    const isSelectedGlass = resolved.style === 'glass' && !!selected;
    const targetHeight = (rnOwnsHeight
        && [flatHost.height, flatHost.minHeight].find((v) => typeof v === 'number'))
        || resolved.height;
    const iconHostWidth = !isIconOnly
        ? null
        : (pinToSquare
            ? targetHeight
            : Math.max(targetHeight, (resolved.paddingX ?? 0) * 2 + (resolved.iconSize ?? 0)));
    // JS NeoButton stretches when classNames.root has w-full/flex. Host with
    // width="auto" used alignSelf:flex-start and collapsed to 0.
    const fillWrapper = fill || (rnOwnsWidth && iconHostWidth == null);
    const labelFrameHeight = Math.max(resolved.iconSize, targetHeight - vPad * 2);

    // FrameModifier drops min/max when `height` is set — use minHeight/maxHeight
    // so fill can also set maxWidth: Infinity on the label (not the Button).
    const fillAlignment =
        resolved.align === 'start' ? 'leading'
        : resolved.align === 'end' ? 'trailing'
        : 'center';
    const labelModifiers: SwiftUIModifier[] = [];
    if (isIconOnly) {
        labelModifiers.push(frame({
            width: borderShape === 'circle'
                ? labelFrameHeight
                : Math.max(Math.round(resolved.iconSize * 1.5), labelFrameHeight),
            height: labelFrameHeight,
        }));
    } else {
        const labelFrame: Parameters<typeof frame>[0] = {
            minHeight: labelFrameHeight,
            maxHeight: labelFrameHeight,
        };
        if (rnOwnsWidth) {
            labelFrame.maxWidth = Infinity;
            labelFrame.alignment = fillAlignment;
        }
        labelModifiers.push(frame(labelFrame));
    }
    // Glass uses `.plain` + `glassEffect` in both states so selected
    // does not remount or swap chrome. Pad once — same capsule either way.
    const isGlass = resolved.style === 'glass';
    // `contentInsets.x` sizes the capsule around custom content (logo: 32pt
    // mark + 2×6 = a 44pt circle at `regular`), like the JS path.
    const customInsetX = customContent && contentInsets && typeof contentInsets === 'object'
        && typeof contentInsets.x === 'number' ? contentInsets.x : null;
    if (isGlass) {
        labelModifiers.push(padding({
            horizontal: customInsetX ?? resolved.paddingX ?? 12,
            vertical: vPad,
        }));
    }

    const tintMap = nativeConfig?.iosTint;
    const fallbackTint = useThemeValue(tintMap?.default ?? tintMap, tintMap?.dark);
    const styleColorMap = nativeConfig?.iosColors?.[resolved.style];
    const stylePalette = (selected ? styleColorMap?.selected : null) || styleColorMap;
    const styleRaw = useIosStyleColors(stylePalette);
    const styleColors = resolved.role === 'destructive'
        ? { tint: null, foreground: null }
        : resolveIosStyleColors(resolved.style, mapping.tint, !!selected, styleRaw, fallbackTint);
    const tintValue = styleColors.tint;
    const foregroundValue = styleColors.foreground;
    // `.tint()` on `.glass` paints the label. Tinted liquid glass is
    // `.plain` + `glassEffect`. Keep that recipe for resting *and*
    // selected so Host/matchContents never remount on tab switch.
    const nativeButtonStyle = isGlass ? 'plain' : mapping.buttonStyle;
    const addonMeta = parseNeoButtonAddon(addon);

    // Size comes from `controlSizes.*.font` (`text-sm` …). Weight comes from
    // style text classes (`font-medium` on glass). `iosFont` overrides both.
    // Previously a null `iosFont` skipped the modifier entirely, so SwiftUI
    // ignored theme type and subtabs looked unstyled.
    const iosFont = resolveScoped(nativeConfig?.iosFont, resolved.env);
    const textState = selected ? 'pressedToggle' : 'default';
    const textCls = typeof resolved.textCls === 'function' ? resolved.textCls(textState) : '';
    const fontParams: FontParams = {};
    if (iosFont && typeof iosFont === 'object') {
        if (typeof iosFont.family === 'string' && iosFont.family) {
            fontParams.family = iosFont.family;
        }
        if (iosFont.weight) fontParams.weight = iosFont.weight;
        if (iosFont.design) fontParams.design = iosFont.design;
        if (iosFont.textStyle) fontParams.textStyle = iosFont.textStyle;
        if (typeof iosFont.size === 'number') fontParams.size = iosFont.size;
    }
    if (fontParams.size == null) {
        fontParams.size = fontSizeFromClass(resolved.fontCls, nativeControlSize);
    }
    if (!fontParams.weight) {
        fontParams.weight = fontWeightFromClass(`${resolved.fontCls || ''} ${textCls || ''}`) || 'medium';
    }
    const textModifiers = [fontModifier(fontParams)];
    if (foregroundValue) textModifiers.push(foregroundStyle(foregroundValue));

    const frozen = useFrozenHostSize({
        // Do not key on selected / tint — that remounts Host and the
        // capsule flashes at 0 before matchContents measures.
        contentKey: [
            nativeLabel, sfSymbol || assetName || (customContent ? 'custom' : ''), nativeControlSize, targetHeight,
            mapping.buttonStyle, borderShape || '', 'host-fit-v5',
            iosFont?.family || '', fontParams.weight || '', String(fontParams.size ?? ''), String(nativeIconSize),
            addonMeta?.text || '',
        ].join('|'),
        rnOwnsWidth,
        rnOwnsHeight,
    });

    const modifiers: SwiftUIModifier[] = [
        buttonStyleModifier(nativeButtonStyle as Parameters<typeof buttonStyleModifier>[0]),
        controlSizeModifier(nativeControlSize),
    ];

    if (borderShape) {
        modifiers.push(
            borderShape === 'rectangle'
                ? buttonBorderShapeModifier('roundedRectangle', 0)
                : buttonBorderShapeModifier(mapping.buttonBorderShape as Parameters<typeof buttonBorderShapeModifier>[0]),
        );
    }

    if (isGlass) {
        modifiers.push(glassEffect({
            glass: {
                variant: 'regular',
                interactive: true,
                ...(isSelectedGlass && tintValue ? { tint: tintValue } : {}),
            },
            shape: borderShape === 'circle' ? 'circle' : 'capsule',
        }));
    } else if (tintValue) {
        modifiers.push(tintModifier(tintValue));
    }
    if (foregroundValue) labelModifiers.push(foregroundStyle(foregroundValue));
    if ((isIconOnly || isCustomOnly) && nativeLabel) modifiers.push(accessibilityLabelModifier(nativeLabel));
    // Do not use SwiftUI `disabled` — it changes intrinsic layout when the
    // control toggles. Fade + block presses on the RN wrapper instead.
    if (iconHostWidth != null) {
        modifiers.push(frame({ width: iconHostWidth, height: targetHeight }));
    } else if (rnOwnsWidth) {
        modifiers.push(frame({
            height: targetHeight,
            maxWidth: Infinity,
            alignment: fillAlignment,
        }));
    } else {
        modifiers.push(frame({ height: targetHeight, alignment: 'center' }));
    }

    const firePress = (onPress || onPressIn) && !disabled && !loading
        ? () => {
              if (sfSymbol && iconEffect) symbolTrigger.set(symbolTrigger.get() + 1);
              if (resolved.haptics) FeedbackHaptics(resolved.haptics);
              (onPressIn || onPress)!();
              if (onPress && onPressIn && onPress !== onPressIn) onPress();
          }
        : undefined;
    const handlePress = useLockedNativePress(firePress);

    const imageModifiers = (sfSymbol && iconEffect)
        ? [symbolEffect(iconEffect as Parameters<typeof symbolEffect>[0], {
            value: symbolTrigger,
            options: (glyph?.kind === 'sf' && glyph.options) || { repeat: 'nonRepeating' },
        })]
        : undefined;

    // One glyph node for leading/trailing placement. Lucide assets are template
    // images: SwiftUI tints them like SF Symbols (glass label vibrancy, selected
    // `foregroundValue`) and the system caches the rasterized vector.
    const glyphView = sfSymbol ? (
        <Image systemName={sfSymbol as SFSymbol} size={nativeIconSize} color={foregroundValue || undefined} modifiers={imageModifiers} />
    ) : assetName ? (
        <Image
            assetName={assetName}
            color={foregroundValue || undefined}
            modifiers={[resizable(), frame({ width: nativeIconSize, height: nativeIconSize })]}
        />
    ) : customContent ? (
        <RNHostView matchContents>
            <View collapsable={false} pointerEvents="none" style={HOSTED_CONTENT_STYLE}>
                {customContent}
            </View>
        </RNHostView>
    ) : null;

    const addonView = addonMeta ? (
        <AddonBadge
            text={addonMeta.text}
            variant={addonMeta.variant}
            palette={nativeConfig?.iosColors?.glass?.selected}
            labelColor={foregroundValue}
            onSelectedGlass={isSelectedGlass}
        />
    ) : null;

    const host = (
        <Host
            matchContents={{
                horizontal: !rnOwnsWidth && !frozen.pinnedWidth,
                vertical: !rnOwnsHeight && !frozen.pinnedHeight,
            }}
            onLayoutContent={frozen.onLayoutContent}
            // `container` still applies keyboard safe area — Host box grows
            // and the visible control sits above it. `all` = Yoga size == chrome.
            ignoreSafeArea="all"
            // @ts-expect-error Not in HostProps, but Host spreads the rest onto its native view.
            collapsable={false}
            style={[
                hostClassStyle,
                {
                    height: targetHeight,
                    opacity: (disabled || loading) ? 0.6 : 1,
                },
                iconHostWidth != null ? { width: iconHostWidth } : null,
                fillWrapper ? { width: '100%' } : null,
                frozen.style,
            ]}
        >
            <Button
                role={SWIFTUI_ROLE[resolved.role]}
                onPress={handlePress}
                modifiers={modifiers}
            >
                <HStack spacing={resolved.labelGap} modifiers={labelModifiers}>
                    {resolved.imagePlacement !== 'trailing' ? glyphView : null}
                    {!isIconOnly && !isCustomOnly ? (
                        <Text modifiers={textModifiers.length ? textModifiers : undefined}>
                            {nativeLabel}
                        </Text>
                    ) : null}
                    {resolved.imagePlacement === 'trailing' ? glyphView : null}
                    {addonView}
                </HStack>
            </Button>
        </Host>
    );

    return wrapNativeButtonHost(host, {
        hitSlop: resolved.hitSlop,
        fill: fillWrapper,
        height: targetHeight,
        width: iconHostWidth,
        onPress: handlePress,
        disabled: disabled || loading,
    });
}
