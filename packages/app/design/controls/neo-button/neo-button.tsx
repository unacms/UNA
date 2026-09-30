/**
 * NeoButton — SwiftUI-faithful Button. Props: neo-button.types.ts.
 *
 * The API mirrors SwiftUI's Button axes:
 *
 *   <Button("Save", systemImage: "tray") { action() }>
 *     .buttonStyle(.borderedProminent)
 *     .controlSize(.large)
 *     .buttonBorderShape(.capsule)
 *     .tint(.blue)
 *
 * is rendered here as:
 *
 *   <NeoButton
 *     label="Save"
 *     image="Save"
 *     style="borderedProminent"
 *     controlSize="large"
 *     borderShape="capsule"
 *     tint="#3b82f6"
 *     onPress={save}
 *   />
 *
 * Anything more complex than label + single image goes via children
 * (a custom HStack-equivalent). There are no startDecorator /
 * endDecorator / leadingDecorator / trailingDecorator props anymore;
 * use `image` + `imagePlacement` for the common case, children for the
 * rest. This keeps the API mappable 1:1 to `@expo/ui/swift-ui` Button.
 *
 * Native: `native.expo_ui_buttons` (configs) routes eligible buttons through
 * Expo UI (`neo-button-expoui.{ios,android}.tsx`). iOS draws Lucide or SF
 * glyphs natively and hosts icon-like custom children (logo) in the SwiftUI
 * label. Long-press, labelled custom children, glyphs with no native asset,
 * and `selected` on non-glass styles stay on the JS surface (Android: also
 * unmapped icons and all custom children). Glass keeps Expo UI for selected
 * (tinted liquid glass) and for `addon` counters (SwiftUI child in the label).
 */

import React, { memo, type ReactNode } from 'react';
import type { ViewStyle } from 'react-native';
import { Pressable, View, MotionView, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Icon } from 'app/ui/atoms/icon';
import Link from 'app/ui/atoms/link';
import Tooltip from 'app/ui/atoms/tooltip';
import Loading from 'app/ui/atoms/loading';
import {
    cn,
    isWeb,
    isEmoji,
    FeedbackHaptics,
    sanitazeUrl,
    isExternalUrl,
    openExternalLink,
} from 'app/lib/util';
import {
    useResolvedNeoButton,
    parseNeoButtonAddon,
    useNeoButtonExpoUI,
    NeoButtonStyleProvider,
    NeoControlSizeProvider,
    useNeoButtonStyle,
    useNeoControlSize,
    usePointerCapability,
    useNeoEnv,
    resolveScoped,
} from 'app/design/controls/neo-button/neo-button-resolver';
import { NeoButtonExpoUI, getNativeIcon, hostsCustomContent } from 'app/design/controls/neo-button/neo-button-expoui';
import type { NeoButtonAddon, NeoButtonClassNames, NeoButtonProps } from 'app/design/controls/neo-button/neo-button.types';

export type { NeoButtonProps } from 'app/design/controls/neo-button/neo-button.types';

// `width="fill"` takes leftover space in a flex parent (`flex-auto`), not
// 100% of the parent (`w-full`) — that would shove siblings out of the row.
// `min-w-0` lets the label ellipsis instead of overflowing. Inner surface
// still uses `w-full` so the chrome fills this flex item.
const FILL_WIDTH_CLASS = 'flex-auto min-w-0';

const ICON_ACCESSIBLE_MAP: Record<string, string> = {
    X: 'Close', ChevronLeft: 'Previous', ChevronRight: 'Next',
    ChevronUp: 'Up', ChevronDown: 'Down', Plus: 'Add', Minus: 'Remove',
    Trash: 'Delete', Trash2: 'Delete', Edit: 'Edit', Edit2: 'Edit', Edit3: 'Edit',
    Search: 'Search', Menu: 'Menu', MoreVertical: 'More options',
    MoreHorizontal: 'More options', Heart: 'Like', Star: 'Favorite',
    Share: 'Share', Share2: 'Share', MessageCircle: 'Comment',
    MessageSquare: 'Messages', Send: 'Send', Bell: 'Notifications',
    Settings: 'Settings', Home: 'Home', User: 'Profile', UserRound: 'Login',
    LogIn: 'Login', LogOut: 'Logout',
};

const getAccessibleName = (accessibilityLabel: string | undefined, tooltip: unknown, label: unknown, image: unknown): string | undefined => {
    if (accessibilityLabel) return accessibilityLabel;
    if (tooltip && typeof tooltip === 'string') return tooltip;
    if (label && typeof label === 'string') return label;
    if (typeof image === 'string') {
        if (ICON_ACCESSIBLE_MAP[image]) return ICON_ACCESSIBLE_MAP[image];
        return image.replace(/([A-Z])/g, ' $1').trim();
    }
    return undefined;
};

const getAddon = (addon: NeoButtonAddon, hasLabel: boolean) => {
    const parsed = parseNeoButtonAddon(addon);
    if (!parsed) return null;

    const isPrimary = parsed.variant === 'primary';
    const bg = isPrimary ? 'bg-destructive' : 'bg-accent';
    const textColor = isPrimary ? 'text-destructive-foreground' : 'text-accent-foreground';
    const pos = (typeof addon === 'object' ? addon?.position : undefined) === 'bottom' ? 'bottom-0 -end-1' : '-top-2 -end-2';
    const text = parsed.text;

    if (!hasLabel) {
        return (
            <View className={`absolute ${bg} border-2 border-card rounded-full px-1 min-w-6 min-h-6 items-center justify-center ${pos}`}>
                <Text className={`${textColor} text-xs font-semibold`}>{text}</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 items-center flex-row">
            <View className={`${bg} rounded-full min-w-5 min-h-5 px-1.5 py-0.5 border border-card/80 items-center`}>
                <Text className={`${textColor} text-xs font-semibold`}>{text}</Text>
            </View>
        </View>
    );
};

/* --------------------------- image / label render -------------------------- */

const NeoImage = memo(function NeoImage({ source, size, color, className }: {
    source?: unknown;
    size?: number;
    color?: string;
    className?: string;
}) {
    if (source === undefined || source === null || source === '' || source === false) {
        return null;
    }
    if (source === '_loading') return <Loading size="small" />;
    if (React.isValidElement(source)) return source;
    if (typeof source !== 'string') return null;
    if (isEmoji(source)) {
        return <Text className={className} style={color ? { color } : undefined}>{source}</Text>;
    }
    return (
        <Icon
            size={size}
            className={cn(className, 'pointer-events-none')}
            icon={source}
            {...(color ? { color } : {})}
        />
    );
});

/**
 * SwiftUI Label(title:image:) equivalent. Wins over `image`/`label` props
 * when `children` is provided (custom HStack content).
 */
function renderLabel({
    label, image, imagePlacement,
    iconSize, labelGap, labelGapCls, fontCls, textCls, tintColor, classNames, loading,
    spreadContent,
}: {
    label: ReactNode;
    image: unknown;
    imagePlacement: string;
    iconSize: number;
    labelGap: number;
    labelGapCls?: string;
    fontCls?: string;
    textCls?: string;
    tintColor?: string;
    classNames?: NeoButtonClassNames;
    loading?: boolean;
    spreadContent?: boolean;
}) {
    const effectiveImage = loading ? '_loading' : image;
    if (!label && !effectiveImage) return null;

    const spreadTrailing =
        spreadContent && imagePlacement === 'trailing' && !!effectiveImage && !!label;

    // Prefer the gap utility class; fall back to inline columnGap if the
    // resolved value isn't mapped. `spreadTrailing` uses justify-between (no gap).
    const useGapClass = !spreadTrailing && !!labelGapCls;

    return (
        <Row
            className={cn(
                'flex-row items-center min-w-0 max-w-full',
                spreadTrailing && 'flex-1 w-full justify-between',
                useGapClass && labelGapCls,
            )}
            style={(spreadTrailing || useGapClass) ? undefined : { columnGap: labelGap }}
        >
            {imagePlacement === 'leading' && effectiveImage ? (
                <View className="shrink-0">
                    <NeoImage
                        source={effectiveImage}
                        size={iconSize}
                        color={tintColor}
                        className={cn(textCls, classNames?.image)}
                    />
                </View>
            ) : null}
            {label ? (
                <Text
                    className={cn('min-w-0 shrink', fontCls, textCls, classNames?.text)}
                    {...(isWeb ? {} : { numberOfLines: 1 })}
                    style={tintColor ? { color: tintColor } : undefined}
                >
                    {label}
                </Text>
            ) : null}
            {imagePlacement === 'trailing' && effectiveImage ? (
                <View className="shrink-0">
                    <NeoImage
                        source={effectiveImage}
                        size={iconSize}
                        color={tintColor}
                        className={cn(textCls, classNames?.image)}
                    />
                </View>
            ) : null}
        </Row>
    );
}

/* -------------------- transition wrapper (per style) ---------------------- */

const getWebTransition = (press: any, property: string) => {
    const duration = press?.duration ?? (press?.spring ? 140 : 120);
    return {
        transitionProperty: property,
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
        willChange: property,
    };
};

function PressTransition({ active, transition, children, className }: {
    active: boolean;
    transition: any;
    children?: ReactNode;
    className?: string;
}) {
    const press = transition?.press;

    if (!press || press === false || press.type === 'shadow') {
        // Style-driven press feedback via class swap only. No wrapper, so no
        // inline `transform: scale(1)` is left behind on every button.
        return <View className={className}>{children}</View>;
    }

    if (press.type === 'opacity') {
        if (isWeb) {
            return (
                <View
                    className={className}
                    style={{
                        opacity: active ? (press.to ?? 0.85) : (press.from ?? 1),
                        ...getWebTransition(press, 'opacity'),
                    }}
                >
                    {children}
                </View>
            );
        }

        return (
            <MotionView
                className={className}
                animate={{ opacity: active ? (press.to ?? 0.85) : (press.from ?? 1) }}
                transition={press.spring ? { type: 'spring', ...press.spring } : { duration: (press.duration ?? 100) / 1000 }}
            >
                {children}
            </MotionView>
        );
    }

    // Default: 'scale'.
    if (isWeb) {
        const scale = active ? (press.to ?? 0.97) : (press.from ?? 1);
        return (
            <View
                className={className}
                style={{
                    transform: `scale(${scale})`,
                    ...getWebTransition(press, 'transform'),
                }}
            >
                {children}
            </View>
        );
    }

    return (
        <MotionView
            className={className}
            animate={{ scale: active ? (press.to ?? 0.97) : (press.from ?? 1) }}
            transition={press.spring ? { type: 'spring', ...press.spring } : undefined}
        >
            {children}
        </MotionView>
    );
}

function PressHighlight({ active, rounded, color }: { active: boolean; rounded?: string; color?: string }) {
    const className = cn('absolute inset-0 pointer-events-none z-10', rounded);

    if (isWeb) {
        return (
            <View
                className={className}
                style={{
                    backgroundColor: color,
                    opacity: active ? 0.18 : 0,
                    transitionProperty: 'opacity',
                    transitionDuration: '120ms',
                    transitionTimingFunction: 'ease-out',
                } as ViewStyle}
            />
        );
    }

    return (
        <MotionView
            className={className}
            animate={{ opacity: active ? 0.18 : 0 }}
            transition={{ duration: 0.12 }}
            style={{ backgroundColor: color }}
        />
    );
}

/* --------------------------- native mode gating ---------------------------- */

function isNativeGlassStyle(style: unknown) {
    return style === 'glass' || style === 'glassProminent';
}

function canRenderExpoUIButton(props: NeoButtonProps, native: { config: Record<string, any> }) {
    const hasChildren = props.children !== undefined && props.children !== null && props.children !== false;
    if (props.onLongPress) return false;
    const style = props.buttonStyle ?? props.style;
    const glass = isNativeGlassStyle(style);
    // Glass keeps Expo UI for selected + addon. Other styles have no native
    // selected/counter mapping and stay on the JS `selectedState` wash.
    if (parseNeoButtonAddon(props.addon) && !glass) return false;
    if (props.selected !== undefined && !glass) return false;

    const label = props.label ?? props.title;
    const hasLabel = (typeof label === 'string' && label !== '') || typeof label === 'number';
    // Icon-like custom content (header logo, avatar): iOS hosts it in the
    // SwiftUI label so it keeps native glass. Labelled custom rows stay JS.
    if (hasChildren) return hostsCustomContent && !hasLabel && React.isValidElement(props.children);
    const rawImage = props.systemImage ?? props.image;
    const hasImage = (typeof rawImage === 'string' && rawImage !== '') || React.isValidElement(rawImage);
    if (!hasLabel && !hasImage) return false;
    if (!hasImage) return true;
    if (React.isValidElement(rawImage)) return hostsCustomContent;

    return !!getNativeIcon(rawImage, native.config);
}

/* -------------------------- main Button component ------------------------- */

export const NeoButton = (props: NeoButtonProps) => {
    const native = useNeoButtonExpoUI(props);

    if (native && NeoButtonExpoUI && canRenderExpoUIButton(props, native)) {
        return <NeoButtonExpoUI {...props} nativeConfig={native.config} />;
    }

    return <NeoButtonStyled {...props} />;
};

/* ----------------------- JS-styled implementation ------------------------- */

const NeoButtonStyled = (props: NeoButtonProps) => {
    const {
        // SwiftUI core (`buttonStyle` avoids RN `Link` clobbering `style` on native)
        role, style, buttonStyle, controlSize, borderShape, tint,

        // Content
        label, loadingLabel, title, image, systemImage, imagePlacement,

        // Behaviour
        disabled = false,
        loading = false,
        selected = false,
        selectedState = 'pressedToggle',
        addon = '',
        interactive = false,
        haptics,
        onPress,
        onPressIn,
        onPressOut,
        onLongPress,

        // Layout
        width, align, contentInsets,
        showTitleFromSize = '',

        // Accessibility / web
        accessibilityLabel, alt, tooltip = false, tooltipSide,
        hitarea = true, hitSlop, focusRing,

        // Animation override
        transition,
        pressAnimation,
        glassEffect,

        // Style escape hatches
        className = '', textClassName = '', classNames = {},

        // Children = custom HStack-equivalent label content
        children,

        forwardedRef,

        // Link-related: forwarded by NeoButtonLink, ignored here.
        href, target, asExternal, emulate, variant, size, mode, noprefetch,

        // Anything else (e.g. data-* attrs) is forwarded to the surface.
        ...rest
    } = props;

    const resolved = useResolvedNeoButton({
        role, style, buttonStyle, controlSize, borderShape, tint, transition,
        focusRing, pressAnimation, glassEffect,
        image: image ?? systemImage,
        systemImage,
        imagePlacement, align, width, disabled, haptics,
    });

    // Effective content props.
    // While `loading=true`, `loadingLabel` (when provided) replaces the
    // visible label so consumers don't need a `<Text>{loading ? 'Saving…' : 'Save'}</Text>`
    // expression at every call site. The image slot still gets the spinner
    // via `renderLabel`'s loading swap.
    const effectiveLabel = (loading && loadingLabel != null && loadingLabel !== '')
        ? loadingLabel
        : (label ?? title ?? '');
    const effectiveImage = image ?? systemImage ?? resolved.defaultImage;
    const effectivePlacement = imagePlacement ?? resolved.imagePlacement;

    const isCustomChildren = children !== undefined && children !== null && children !== false;
    const isTitle = !!effectiveLabel;
    const hasImage = !!effectiveImage || loading;
    const isIconOnly = hasImage && !isTitle && !isCustomChildren;

    const isPressable = !!(onPress || onLongPress || href);
    const isInteractive = !disabled && (isPressable || interactive);
    const isActive = isPressable && !disabled;
    const isPressedToggle = !!selected;

    const accessibleName =
        accessibilityLabel ?? alt ?? getAccessibleName(undefined, tooltip, effectiveLabel, effectiveImage);

    /* ----------------------- interaction state -------------------------- */

    const [isPressed, setIsPressed] = React.useState(false);
    const [isHovered, setIsHovered] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);

    const stateKey =
        disabled ? 'disabled' :
        isPressedToggle ? selectedState :
        isPressed ? 'pressed' :
        isHovered ? 'hovered' :
        isFocused ? 'focused' :
        'default';

    /* ------------------------------ handlers ---------------------------- */

    // Fire on press-in (finger down), not onPress (finger up). SwiftUI's
    // built-in click is press-in; JS Pressable has none, so this is what
    // makes styled buttons feel like native when `native.expo_ui_buttons` is off.
    const fireHaptics = () => {
        if (resolved.haptics) FeedbackHaptics(resolved.haptics);
    };

    const handlePress = (event: any) => {
        if (isWeb) event?.currentTarget?.blur?.();
        onPress?.(event);
    };

    const handlePressIn = (event: any) => {
        fireHaptics();
        setIsPressed(true);
        onPressIn?.(event);
    };

    const handleLongPress = (event: any) => {
        onLongPress?.(event);
    };

    const refProps = forwardedRef ? { ref: forwardedRef } : {};

    const buttonAttributes = isPressable
        ? {
              ...(accessibleName ? { 'aria-label': accessibleName, alt: accessibleName } : {}),
              role: 'button',
              ...(isPressedToggle ? { 'aria-pressed': true } : {}),
              ...(disabled ? { 'aria-disabled': true } : {}),
          }
        : {};

    // hitSlop (theme `neo_button.controlSizes`) is the single source of truth.
    // Native applies it to the RN Pressable via this prop; web mirrors it with
    // the `hit-area-*` utility class (see `hitAreaClass` below) — RN has no
    // `::before`, so the two platforms diverge in mechanism but not in value.
    const resolvedHitSlop = hitSlop !== undefined
        ? hitSlop
        : (hitarea === false ? undefined : {
            top: resolved.hitSlop, right: resolved.hitSlop,
            bottom: resolved.hitSlop, left: resolved.hitSlop,
        });

    /* --------------------------- sizing / padding ----------------------- */

    // Sizing comes from utility classes (theme numbers → classes in the
    // resolver). When a value isn't mapped we fall back to inline styles so
    // nothing silently breaks.
    const sizeClass = resolved.heightCls ?? '';
    const needsSizeFallback = !resolved.heightCls;

    const resolvedContentInsets = typeof contentInsets === 'string'
        ? resolved.contentInsets?.[contentInsets]
        : contentInsets;
    // contentInsets (when present) override padding per-side via inline style so
    // asymmetric media insets still work; the common case uses the px-* class.
    const insetLeft = resolvedContentInsets?.left ?? resolvedContentInsets?.start ?? resolvedContentInsets?.x;
    const insetRight = resolvedContentInsets?.right ?? resolvedContentInsets?.end ?? resolvedContentInsets?.x;
    // Icon-only normally drops to `px-0` so the box is square. Shapes flagged
    // `iconOnlyPadded` (capsule) keep the labelled button's padding instead, so
    // they stay visibly wider than a circle.
    const keepsPaddingWhenIconOnly = !isIconOnly || resolved.iconOnlyPadded;
    const pinIconOnlySquare = isIconOnly && !resolved.iconOnlyPadded;
    const paddingClass = keepsPaddingWhenIconOnly ? (resolved.paddingXCls ?? '') : 'px-0';
    const needsPaddingFallback = keepsPaddingWhenIconOnly && !resolved.paddingXCls;

    // Web-only hit-area utility (RN uses the hitSlop prop instead). See the
    // `hit-area-*` @utility in global.css.
    const hitAreaClass = (hitarea !== false && isPressable && isWeb)
        ? (resolved.hitAreaCls ?? '')
        : '';

    /* ------------------- container / text classes ----------------------- */

    const containerCls = cn(
        'flex-row items-center web:transition-[background-color,box-shadow,opacity] web:duration-200 web:ease-out',
        isInteractive && 'web:cursor-pointer',
        resolved.rounded,
        (resolved.aspectSquare || pinIconOnlySquare) ? 'aspect-square' : '',
        sizeClass,
        paddingClass,
        `justify-${resolved.align}`,
        resolved.containerCls(stateKey),
        // `min-w-0` is for labelled ellipsis. On icon-only it tw-merges away
        // `min-w-*` from the size class and the box collapses to the glyph.
        resolved.width === 'fill'
            ? 'w-full'
            : (pinIconOnlySquare ? '' : 'min-w-0 max-w-full'),
        className,
        classNames?.container,
        classNames?.surface,
    );

    const textCls = cn(
        'whitespace-nowrap text-ellipsis overflow-hidden',
        resolved.textCls(stateKey),
        textClassName,
    );

    // Styles where `tint` repaints the surface as a fully opaque fill
    // (and the text inherits the prominent foreground colour, not the tint).
    // Mirrors SwiftUI's simple split: prominent styles use tint as fill;
    // non-prominent styles use tint for the label/image accent.
    const tintFillsSurface =
        resolved.tint && (resolved.style === 'borderedProminent' || resolved.style === 'glassProminent');

    // Only the values that have no utility-class equivalent remain inline:
    // unmapped size/padding fallbacks, asymmetric contentInsets overrides, and
    // the arbitrary `tint` colour.
    const containerStyle = {
        ...(needsSizeFallback
            ? (resolved.aspectSquare
                ? { height: resolved.height, width: resolved.height }
                : { minHeight: resolved.height, minWidth: resolved.height })
            : null),
        ...(needsPaddingFallback ? { paddingLeft: resolved.paddingX, paddingRight: resolved.paddingX } : null),
        ...(insetLeft != null ? { paddingLeft: insetLeft } : null),
        ...(insetRight != null ? { paddingRight: insetRight } : null),
        ...(tintFillsSurface ? { backgroundColor: resolved.tint } : null),
    };

    /* --------------------------- web ergonomics ------------------------- */

    const ringClass = !resolved.behaviors.focusRing
        ? 'u-neo-btn-ring-never'
        : (isInteractive ? 'u-neo-btn-ring' : '');

    /* ----------------------------- surface ------------------------------ */

    // Web Pressable does not surface onPressIn/Out to the DOM (see view.web.tsx).
    // Use View + pointer handlers for press visuals; onPress maps to onClick there.
    // Native keeps RN Pressable for press-in/out, hitSlop, and long-press.
    const useNativePressable = isPressable && !isWeb;
    const Cnt = useNativePressable ? Pressable : View;

    const hoverHandlers = resolved.behaviors.hover && isInteractive ? {
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => {
            setIsHovered(false);
            setIsPressed(false);
        },
    } : {};

    const pointerPressHandlers = isInteractive && isWeb ? {
        onPointerDown: (event: any) => {
            if (disabled) return;
            if (event.pointerType === 'mouse' && event.button !== 0) return;
            fireHaptics();
            setIsPressed(true);
        },
        onPointerUp: () => setIsPressed(false),
        onPointerCancel: () => setIsPressed(false),
        onPointerLeave: () => setIsPressed(false),
    } : {};

    const cntProps: Record<string, any> = {
        ...rest,
        className: cn(
            `neo-btn neo-btn-${resolved.style} neo-btn-${resolved.controlSize}`,
            resolved.glassFx && cn('neo-glass', resolved.style === 'glassProminent' && 'neo-glass-prominent'),
            hitAreaClass,
            ringClass,
            classNames?.ring,
        ),
        style: containerStyle,
        ...refProps,
        ...buttonAttributes,
        ...(useNativePressable ? {
            disabled: !isActive,
            hitSlop: resolvedHitSlop,
            onPressIn: handlePressIn,
            onPressOut: (event: any) => {
                setIsPressed(false);
                onPressOut?.(event);
            },
            onFocus: () => setIsFocused(true),
            onBlur: () => setIsFocused(false),
            ...hoverHandlers,
            ...(onPress ? { onPress: handlePress } : {}),
            ...(onLongPress && resolved.behaviors.longPress ? { onLongPress: handleLongPress } : {}),
        } : {
            ...hoverHandlers,
            ...pointerPressHandlers,
            ...(isPressable ? {
                disabled: !isActive,
                onFocus: () => setIsFocused(true),
                onBlur: () => setIsFocused(false),
                ...(onPress ? { onPress: handlePress } : {}),
            } : {}),
        }),
    };

    /* ------------------------------ content ----------------------------- */

    const tintColor = (() => {
        if (!resolved.tint) return undefined;
        // When tint repaints the surface (borderedProminent / glassProminent),
        // the label/image keep the prominent foreground colour from the theme
        // so contrast stays correct on the freshly-tinted background.
        if (tintFillsSurface) return undefined;
        return resolved.tint;
    })();

    const labelContent = isCustomChildren
        ? children
        : renderLabel({
            label: effectiveLabel,
            image: effectiveImage,
            imagePlacement: effectivePlacement,
            iconSize: resolved.iconSize,
            labelGap: resolved.labelGap,
            labelGapCls: resolved.labelGapCls,
            fontCls: resolved.fontCls,
            textCls,
            tintColor,
            classNames,
            loading,
            spreadContent: resolved.align === 'between',
        });
    const addonContent = getAddon(addon, isTitle);

    const glassFx = resolved.glassFx;

    const buttonElement = (
        <Cnt {...cntProps} className={cn(cntProps.className, containerCls)}>
            {glassFx ? <View className="neo-glass-rim" aria-hidden /> : null}
            {labelContent}
            {addonContent && (
                isTitle ? <View className="z-10 ml-1">{addonContent}</View> : <View className="absolute top-0 right-0 w-full h-full z-20 pointer-events-none">{addonContent}</View>
            )}
            {/* press highlight overlay (visual feedback, runs in addition to
                the per-style transition). Glass effect draws its own. */}
            {glassFx ? (
                <View className="neo-glass-shine" aria-hidden />
            ) : (resolved.style !== 'plain' && resolved.style !== 'link') ? (
                <PressHighlight
                    active={isPressed}
                    rounded={resolved.rounded}
                    color={resolved.highlightBg}
                />
            ) : null}
        </Cnt>
    );

    const wrapperClass = cn(
        resolved.width === 'fill'
            ? FILL_WIDTH_CLASS
            : (pinIconOnlySquare ? 'self-start' : 'self-start max-w-full min-w-0'),
        classNames?.root,
    );

    // Glass effect: press/hover motion is CSS keyed off `data-neo-glass`,
    // so the JS PressTransition scale is skipped.
    const wrapped = glassFx ? (
        <View
            className={cn(
                'neo-glass-wrap',
                `neo-glass-${resolved.controlSize}`,
                !resolved.behaviors.pressAnimation && 'neo-glass-still',
                wrapperClass,
            )}
            data-neo-glass={stateKey}
        >
            <View className={cn('neo-glass-shadow', resolved.rounded)} aria-hidden />
            {buttonElement}
        </View>
    ) : (
        <PressTransition
            active={isPressed}
            transition={resolved.behaviors.pressAnimation ? resolved.transition : false}
            className={wrapperClass}
        >
            {buttonElement}
        </PressTransition>
    );

    /* ---------------------------- tooltip wrap -------------------------- */

    const isDesktop = useNeoEnv().isDesktop;
    if (tooltip && isDesktop) {
        return <Tooltip content={tooltip} side={tooltipSide} enabled>{wrapped}</Tooltip>;
    }
    return wrapped;
};

/* ------------------------------- ref wrapper ------------------------------ */

export const NeoButtonRef = React.forwardRef<any, NeoButtonProps>((props, forwardedRef) => (
    <NeoButton {...props} forwardedRef={forwardedRef} />
));

/* ------------------------------ link wrapper ------------------------------ */

export const NeoButtonLink = ({
    href = '',
    target = '',
    asExternal = false,
    style,
    emulate,
    ...props
}: NeoButtonProps) => {
    const finalHref = sanitazeUrl(href);
    const isExternal = isExternalUrl(finalHref) || asExternal === true;

    // For an internal link the actual click target is the <a> wrapper, not the
    // inner (non-pressable) NeoButton — so the hit area must live on the anchor.
    // Resolve it from the same control size the button uses (hitSlop depends
    // only on controlSize + env scope). External links render a pressable
    // NeoButton directly, which draws its own hit area.
    const { hitAreaCls } = useResolvedNeoButton({ controlSize: props.controlSize });

    if (isExternal) {
        const neoProps = { ...props, buttonStyle: style, interactive: true };
        return <NeoButton {...neoProps} onPress={() => openExternalLink(finalHref)} />;
    }

    const linkClassName = cn(
        'u-neo-btn-link',
        hitAreaCls,
        props.width === 'fill'
            ? cn('block', FILL_WIDTH_CLASS)
            : 'inline-flex items-center max-w-full min-w-0 shrink',
    );
    const neoProps = { ...props, buttonStyle: style, hitarea: false, interactive: true };
    const linkAccessibleName =
        props.accessibilityLabel ||
        props.alt ||
        (typeof props.label === 'string' && props.label !== '' ? props.label : undefined);

    return (
        <Link href={href} target={target} asExternal={asExternal} emulate={emulate} mode="plain" className={linkClassName} alt={linkAccessibleName}>
            <NeoButton {...neoProps} />
        </Link>
    );
};

/* ----------------------- providers + resolver re-exports ------------------ */

export {
    NeoButtonStyleProvider,
    NeoControlSizeProvider,
    useNeoButtonStyle,
    useNeoControlSize,
    useResolvedNeoButton,
    useNeoButtonExpoUI,
    usePointerCapability,
    resolveScoped,
};

export {
    isExpoUI,
    isNativeTabsEnabled,
    isTabBarLabelsEnabled,
} from 'app/lib/util';

/* ----------------------------- internals ---------------------------------- */

export const __neoButtonInternals = {
    renderLabel,
    PressTransition,
    NeoImage,
    getAccessibleName,
};