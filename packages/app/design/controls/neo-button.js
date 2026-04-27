/**
 * NeoButton — SwiftUI-faithful Button.
 *
 * Full prop reference and usage examples:
 *   packages/app/design/controls/neo-button.md
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
 * rest. This keeps the API mappable 1:1 to `@expo/ui/swift-ui` Button
 * when the `appearance="native"` switch lands.
 */

import React, { memo } from 'react';
import { Platform } from 'react-native';
import { Pressable, View, MotionView, Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Icon } from 'app/ui/atoms/icon';
import Link from 'app/ui/atoms/link';
import Tooltip from 'app/ui/atoms/tooltip';
import Loading from 'app/ui/atoms/loading';
import {
    cn,
    isEmoji,
    FeedbackHaptics,
    sanitazeUrl,
    isExternalUrl,
    openExternalLink,
} from 'app/lib/util';
import {
    useResolvedNeoButton,
    NeoButtonStyleProvider,
    NeoControlSizeProvider,
    useNeoButtonStyle,
    useNeoControlSize,
    usePointerCapability,
    useNeoEnv,
    resolveScoped,
} from 'app/design/controls/neo-button-resolver';

const isWeb = Platform.OS === 'web';

const ICON_ACCESSIBLE_MAP = {
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

const getAccessibleName = (accessibilityLabel, tooltip, label, image) => {
    if (accessibilityLabel) return accessibilityLabel;
    if (tooltip && typeof tooltip === 'string') return tooltip;
    if (label && typeof label === 'string') return label;
    if (typeof image === 'string') {
        if (ICON_ACCESSIBLE_MAP[image]) return ICON_ACCESSIBLE_MAP[image];
        return image.replace(/([A-Z])/g, ' $1').trim();
    }
    return undefined;
};

/* --------------------------- image / label render -------------------------- */

const NeoImage = memo(function NeoImage({ source, size, color, className }) {
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
    iconSize, labelGap, fontCls, textCls, tintColor, classNames, loading,
}) {
    const effectiveImage = loading ? '_loading' : image;
    if (!label && !effectiveImage) return null;

    return (
        <Row className="flex-row items-center" style={{ columnGap: labelGap }}>
            {imagePlacement === 'leading' && effectiveImage ? (
                <NeoImage
                    source={effectiveImage}
                    size={iconSize}
                    color={tintColor}
                    className={cn(textCls, classNames?.image)}
                />
            ) : null}
            {label ? (
                <Text
                    className={cn(fontCls, textCls, classNames?.text)}
                    numberOfLines={1}
                    style={tintColor ? { color: tintColor } : undefined}
                >
                    {label}
                </Text>
            ) : null}
            {imagePlacement === 'trailing' && effectiveImage ? (
                <NeoImage
                    source={effectiveImage}
                    size={iconSize}
                    color={tintColor}
                    className={cn(textCls, classNames?.image)}
                />
            ) : null}
        </Row>
    );
}

/* -------------------- transition wrapper (per style) ---------------------- */

function PressTransition({ active, transition, children, className }) {
    const press = transition?.press;

    if (!press || press === false || press.type === 'shadow') {
        // Style-driven press feedback via class swap only. No wrapper, so no
        // inline `transform: scale(1)` is left behind on every button.
        return <View className={className}>{children}</View>;
    }

    if (press.type === 'opacity') {
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

/* -------------------------- main Button component ------------------------- */

export const NeoButton = (props) => {
    const {
        // SwiftUI core
        role, style, controlSize, borderShape, tint,

        // Content
        label, loadingLabel, title, image, systemImage, imagePlacement,

        // Behaviour
        disabled = false,
        loading = false,
        selected = false,
        haptics,
        onPress,
        onLongPress,

        // Layout
        width, align,
        showTitleFromSize = '',

        // Accessibility / web
        accessibilityLabel, alt, tooltip = false,
        hitarea = true, hitSlop, focusRing,

        // Animation override
        transition,
        pressAnimation,

        // Style escape hatches
        className = '', textClassName = '', classNames = {},

        // Children = custom HStack-equivalent label content
        children,

        forwardedRef,

        // Link-related: forwarded by NeoButtonLink, ignored here.
        href, target, asExternal, // eslint-disable-line no-unused-vars

        // Anything else (e.g. data-* attrs) is forwarded to the surface.
        ...rest
    } = props;

    const resolved = useResolvedNeoButton({
        role, style, controlSize, borderShape, tint, transition,
        focusRing, pressAnimation,
        image: image ?? systemImage,
        systemImage,
        imagePlacement, align, width, disabled,
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
        isPressedToggle ? 'pressedToggle' :
        isPressed ? 'pressed' :
        isHovered ? 'hovered' :
        isFocused ? 'focused' :
        'default';

    /* ------------------------------ handlers ---------------------------- */

    const handlePress = (event) => {
        if (haptics && onPress) FeedbackHaptics(haptics);
        if (isWeb) event?.currentTarget?.blur?.();
        onPress?.(event);
    };

    const handleLongPress = (event) => {
        if (haptics && onLongPress) FeedbackHaptics(haptics);
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

    const resolvedHitSlop = hitSlop !== undefined
        ? hitSlop
        : (hitarea === false ? undefined : {
            top: resolved.hitSlop, right: resolved.hitSlop,
            bottom: resolved.hitSlop, left: resolved.hitSlop,
        });

    /* ------------------- container / text classes ----------------------- */

    const containerCls = cn(
        'flex-row items-center',
        resolved.rounded,
        resolved.aspectSquare ? 'aspect-square' : '',
        `justify-${resolved.align}`,
        resolved.containerCls(stateKey),
        resolved.width === 'fill' ? 'w-full' : '',
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
    // Mirrors SwiftUI: `.borderedProminent` and `.glassProminent` both treat
    // `.tint(.color)` as the new fill.
    const tintFillsSurface =
        resolved.tint && (resolved.style === 'borderedProminent' || resolved.style === 'glassProminent');

    const containerStyle = {
        height: resolved.aspectSquare ? resolved.height : undefined,
        minHeight: resolved.aspectSquare ? undefined : resolved.height,
        width: resolved.aspectSquare ? resolved.height : undefined,
        minWidth: resolved.aspectSquare ? undefined : resolved.height,
        paddingLeft: isIconOnly ? 0 : resolved.paddingX,
        paddingRight: isIconOnly ? 0 : resolved.paddingX,
        ...(tintFillsSurface ? { backgroundColor: resolved.tint } : {}),
    };

    /* --------------------------- web ergonomics ------------------------- */

    const hitareaSizeClass =
        resolved.height >= 56 ? 'lg' :
        resolved.height >= 44 ? 'md' :
        resolved.height >= 36 ? 'sm' : 'xs';

    const hitareaClass = (hitarea !== false && isPressable)
        ? `u-neo-btn-hitarea u-neo-btn-hitarea-${hitareaSizeClass}`
        : '';

    const ringClass = !resolved.behaviors.focusRing
        ? 'u-neo-btn-ring-never'
        : (isPressable ? 'u-neo-btn-ring' : '');

    /* ----------------------------- surface ------------------------------ */

    const Cnt = isPressable ? Pressable : View;

    const cntProps = {
        className: cn(
            `neo-btn neo-btn-${resolved.style} neo-btn-${resolved.controlSize}`,
            hitareaClass,
            ringClass,
            classNames?.ring,
        ),
        style: containerStyle,
        ...(isPressable ? {
            disabled: !isActive,
            hitSlop: resolvedHitSlop,
            onPressIn: () => setIsPressed(true),
            onPressOut: () => setIsPressed(false),
            onFocus: () => setIsFocused(true),
            onBlur: () => setIsFocused(false),
            ...(resolved.behaviors.hover ? {
                onMouseEnter: () => setIsHovered(true),
                onMouseLeave: () => setIsHovered(false),
            } : {}),
            ...(onPress ? { onPress: handlePress } : {}),
            ...(onLongPress && resolved.behaviors.longPress ? { onLongPress: handleLongPress } : {}),
        } : {}),
        ...refProps,
        ...buttonAttributes,
        ...rest,
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
            fontCls: resolved.fontCls,
            textCls,
            tintColor,
            classNames,
            loading,
        });

    const buttonElement = (
        <Cnt {...cntProps} className={cn(cntProps.className, containerCls)}>
            {labelContent}
            {/* press highlight overlay (visual feedback, runs in addition to
                the per-style transition) */}
            <MotionView
                className={cn('absolute inset-0 pointer-events-none z-10', resolved.rounded)}
                animate={{ opacity: isPressed ? 0.18 : 0 }}
                transition={{ duration: 0.12 }}
                style={{ backgroundColor: resolved.highlightBg }}
            />
        </Cnt>
    );

    const wrapperClass = cn(
        resolved.width === 'fill' ? 'w-full' : 'self-start',
        classNames?.root,
    );

    const wrapped = (
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
        return <Tooltip content={tooltip} enabled>{wrapped}</Tooltip>;
    }
    return wrapped;
};

/* ------------------------------- ref wrapper ------------------------------ */

export const NeoButtonRef = React.forwardRef((props, forwardedRef) => (
    <NeoButton {...props} forwardedRef={forwardedRef} />
));

/* ------------------------------ link wrapper ------------------------------ */

export const NeoButtonLink = ({
    href = '',
    target = '',
    asExternal = false,
    ...props
}) => {
    const finalHref = sanitazeUrl(href);
    const isExternal = isExternalUrl(finalHref) || asExternal === true;

    if (isExternal) {
        return <NeoButton {...props} onPress={() => openExternalLink(finalHref)} />;
    }

    return (
        <Link href={href} target={target} asExternal={asExternal} mode="plain" className="block">
            <NeoButton {...props} hitarea={false} />
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
    usePointerCapability,
    resolveScoped,
};

/* ----------------------------- internals ---------------------------------- */

export const __neoButtonInternals = {
    renderLabel,
    PressTransition,
    NeoImage,
    getAccessibleName,
};