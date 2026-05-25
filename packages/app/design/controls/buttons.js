import React, { memo } from 'react';
import { Pressable, View, MotionView } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'
import Link from 'app/ui/atoms/link'
import { appSetting, isEmoji, FeedbackHaptics, cn, sanitazeUrl, isExternalUrl, openExternalLink, roundedClassToRadius } from 'app/lib/util'
import Tooltip from 'app/ui/atoms/tooltip';
import Loading from 'app/ui/atoms/loading'
import { useIsDesktop } from 'app/context/measure';
import { Platform } from 'react-native';
import { useThemeName } from 'app/design/theme';


const BtnCls = appSetting('theme', 'button_styles');
const BtnClsSize = appSetting('theme', 'button_sizes');

const isWeb = Platform.OS === 'web';

const springTransition = BtnCls.motion.springTransition;

const ICON_ACCESSIBLE_MAP = {
    'X': 'Close',
    'ChevronLeft': 'Previous',
    'ChevronRight': 'Next',
    'ChevronUp': 'Up',
    'ChevronDown': 'Down',
    'Plus': 'Add',
    'Minus': 'Remove',
    'Trash': 'Delete',
    'Trash2': 'Delete',
    'Edit': 'Edit',
    'Edit2': 'Edit',
    'Edit3': 'Edit',
    'Search': 'Search',
    'Menu': 'Menu',
    'MoreVertical': 'More options',
    'MoreHorizontal': 'More options',
    'Heart': 'Like',
    'Star': 'Favorite',
    'Share': 'Share',
    'Share2': 'Share',
    'MessageCircle': 'Comment',
    'MessageSquare': 'Messages',
    'Send': 'Send',
    'Bell': 'Notifications',
    'Settings': 'Settings',
    'Home': 'Home',
    'User': 'Profile',
    'UserRound': 'Login',
    'LogIn': 'Login',
    'LogOut': 'Logout',
};

const getAddon = (addon, isTitle) => {
    if (!addon) return null;

    const isObj = typeof addon === 'object' && addon !== null;
    const text = isObj ? addon.text : addon;

    if (!text) return null;
    if (isObj && addon.hideZero && text == '0') return null;

    const bg = isObj && addon.variant === 'primary' ? 'bg-destructive' : 'bg-accent';
    const textColor = isObj && addon.variant === 'primary' ? 'text-destructive-foreground' : 'text-accent-foreground';
    const pos = isObj && addon.position === 'bottom' ? 'bottom-0 -end-1' : '-top-2 -end-2';

    if (!isTitle) {
        return (
            <View className={`absolute ${bg} border-2 border-card rounded-full px-1 min-w-6 min-h-6 items-center justify-center ${pos}`}>
                <Text className={`${textColor} text-xs font-semibold`}>{text}</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 items-center flex-row">
            <View className={`${bg} rounded-full min-w-5 min-h-5 px-1.5 py-0.5 border border-card/80  items-center`}>
                <Text className={`${textColor} text-xs font-semibold`}>{text}</Text>
            </View>
        </View>
    );
};

const ButtonIcon = memo(({ icon, className, size }) => {
    if (!icon) return null;

    const renderOne = (one, key) => {
        if (!one) return null;
        if (one === "_loading") return <Loading key={key} size="small" />;

        if (React.isValidElement(one)) return <React.Fragment key={key}>{one}</React.Fragment>;

        if (typeof one !== "string") return null;

        if (isEmoji(one)) {
            return (
                <Text key={key} className={className}>
                    {one}
                </Text>
            );
        }

        return <Icon key={key} size={size} className={cn(className, "pointer-events-none")} icon={one} />;
    };

    if (!Array.isArray(icon)) {
        return renderOne(icon, "icon");
    }

    return icon.map((one, idx) => renderOne(one, idx));
});

const getAccessibleName = (alt, tooltip, title, startDecorator, endDecorator) => {
    // Priority order: explicit alt > tooltip > title > icon name
    if (alt) return alt;
    if (tooltip && typeof tooltip === 'string') return tooltip;
    if (title && typeof title === 'string') return title;

    // For icon-only buttons, derive name from icon
    const iconName = startDecorator || endDecorator;
    if (iconName && !title) {
        if (ICON_ACCESSIBLE_MAP[iconName]) return ICON_ACCESSIBLE_MAP[iconName];
        // Fallback: convert CamelCase to readable text
        return iconName.replace(/([A-Z])/g, ' $1').trim();
    }

    return undefined;
};

const getStateClasses = (active, pressed, hovered, focused, disabled, variant, type = 'container') => {
    const classes = BtnCls[variant]?.[type];
    if (disabled) return classes?.disabled || '';
    if (pressed) return classes?.pressed || '';
    if (active) return classes?.active || '';
    if (hovered) return classes?.hovered || '';
    if (focused) return classes?.focused || '';
    return classes?.default || '';
};

const ButtonContent = React.memo(({
    as: Cmp = View,
    cntProps = {},
    pressed = false,
    hovered = false,
    focused = false,
    active = false,
    fullWidth = false,
    className,
    classTextName,
    variant,
    align,
    size,
    isIconOnly,
    disabled,
    startDecorator,
    endDecorator,
    isTitle,
    title,
    addon,
    showTitleFromSize,
    roundingClass,
    children
}) => {
    const { className: cntClassName, ...restCntProps } = cntProps;
    const themeName = useThemeName();
    const hasNoIcons = !startDecorator && !endDecorator;
    const isTitleVisible = hasNoIcons || showTitleFromSize === '';
    const breakpoint = showTitleFromSize || 'sm';
    const titleVisibility = cn(!isTitleVisible && `hidden ${breakpoint}:block`);

    const baseContainerClasses = cn(
        'flex-row items-center',
        cntClassName,
        roundingClass,
        //isIconOnly ? '' : 'overflow-hidden',
        className,
        BtnCls[variant]?.container?.base,
        `justify-${align}`,
        isIconOnly ? BtnClsSize[size]?.container_icon_only : BtnClsSize[size]?.container,
    );

    const baseTextClasses = cn(
        'whitespace-nowrap text-ellipsis overflow-hidden',
        classTextName,
        BtnCls[variant]?.text?.base,
        BtnClsSize[size]?.text,
    );

    const oButtonAddon = getAddon(addon, isTitle);

    const stateContainer = getStateClasses(active, pressed, hovered, focused, disabled, variant, 'container');
    const stateText = getStateClasses(active, pressed, hovered, focused, disabled, variant, 'text');
    const containerClasses = cn(baseContainerClasses, stateContainer);
    const textClasses = `${baseTextClasses} ${stateText}`;
    const highlightBackground = BtnCls.motion['highlightBackground' + themeName];

    const buttonElement = (
        <Cmp
            className={containerClasses}
            {...restCntProps}

        >
            <ButtonIcon size={BtnClsSize[size]?.icon_size} icon={startDecorator} className={textClasses.replace("overflow-hidden")} />

            {isTitle && (
                <Text className={`${textClasses} ${titleVisibility}`} numberOfLines={1}>
                    {title}
                </Text>
            )}

            <ButtonIcon size={BtnClsSize[size]?.icon_size} icon={endDecorator} className={textClasses} />
            {oButtonAddon && (
                isTitle ? <View className="z-10">{oButtonAddon}</View> : <View className="absolute top-0 right-0 w-full h-full z-20 pointer-events-none">{oButtonAddon}</View>
            )}
            {children}

            <MotionView
                className={`absolute inset-0 pointer-events-none z-10 ${roundingClass}`}
                animate={{ opacity: active ? 1 : 0 }}
                transition={springTransition}
                style={{ backgroundColor: highlightBackground }}
            />
        </Cmp>
    );

    return (
        <MotionView

            className={fullWidth ? 'w-full' : ''}
            animate={{ scale: active ? BtnCls.motion.scale : 1 }}
            transition={springTransition}

        >
            {buttonElement}
        </MotionView>
    );
});


export const Button = ({
    variant = BtnClsSize.default_variant,
    size = BtnClsSize.default_size,
    disabled = false,
    forwardedRef,
    tooltip = false,
    onPress,
    onTouchStart,
    grouped,
    title = '',
    haptics,
    className = '',
    classTextName = '',
    showTitleFromSize = '',
    pressed = false,
    startDecorator = '',
    endDecorator = '',
    align = 'center',
    fullWidth = false,
    addon = '',
    rounded = false,
    hitarea = true,
    hitSlop,
    alt,
    role = 'button',
    children,
}) => {
    const isTitle = !!title;
    const isIcon = !!(startDecorator || endDecorator);
    const isIconOnly = isIcon && !isTitle;
    const isDesktop = useIsDesktop();
    const isTooltip = isDesktop && tooltip;

    const isActive = !!onPress && !disabled;

    const flexClasses =
        fullWidth ? "flex-auto web:w-full" :
            isIconOnly ? "flex-none " :
                isTitle ? "flex-none w-fit" : "w-fit";

    const handlePress = (event) => {
        if (haptics && onPress) FeedbackHaptics(haptics);
        if (isWeb) {
            event?.currentTarget?.blur?.();
        }
        onPress?.(event);
    };

    const handleTouchStart = (event) => {
        if (onTouchStart) FeedbackHaptics(haptics);
        onTouchStart?.(event);
    };

    const accessibleName = getAccessibleName(alt, tooltip, title, startDecorator, endDecorator);
    const refProps = forwardedRef ? { ref: forwardedRef } : {};

    const buttonAttributes =
        isActive && accessibleName
            ? { 'aria-label': accessibleName, alt: accessibleName, role }
            : isActive
                ? { role }
                : {};

    const resolvedHitSlop =
        hitSlop !== undefined ? hitSlop :
            hitarea === false ? undefined :
                { top: BtnClsSize[size].hit_slop, right: BtnClsSize[size].hit_slop, bottom: BtnClsSize[size].hit_slop, left: BtnClsSize[size].hit_slop };

    const hitareaClass = hitarea === false ? '' : `u-action-hitarea u-action-hitarea-${size}`;

    const canRound = !grouped;
    const roundingClass = !canRound ? '' :
        rounded ? 'rounded-full' :
            BtnClsSize[size]?.rounded ?? '';

    const isPressable = !!(onPress || onTouchStart);
    const Cnt = isPressable ? Pressable : View;

    const [isPressed, setIsPressed] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);
    const [isHovered, setIsHovered] = React.useState(false);
    const [webPointerPressed, setWebPointerPressed] = React.useState(false);

    const effectivePressed = isPressable ? isPressed : webPointerPressed;

    const cntProps = {
        className: `btn-${variant}-${size} ${flexClasses} ${hitareaClass}`,

        ...(isPressable ? {
            disabled: isPressable ? !isActive : disabled,
            hitSlop: resolvedHitSlop,
            onPressIn: () => setIsPressed(true),
            onPressOut: () => setIsPressed(false),
            onFocus: () => setIsFocused(true),
            onBlur: () => setIsFocused(false),
            ...(isWeb ? {
                onMouseEnter: () => setIsHovered(true),
                onMouseLeave: () => setIsHovered(false),
            } : {}),
            ...(onTouchStart ? { onTouchStart: handleTouchStart } : {}),
            ...(onPress ? { onPress: handlePress } : {}),
        } : {
            ...(isWeb ? {
                onMouseEnter: () => setIsHovered(true),
                onMouseLeave: () => setIsHovered(false),
            } : {}),
            ...(!disabled && isWeb ? {
                onPointerDown: (e) => {
                    if (e.pointerType === 'mouse' && e.button !== 0) return;
                    setWebPointerPressed(true);
                },
                onPointerUp: () => setWebPointerPressed(false),
                onPointerCancel: () => setWebPointerPressed(false),
                onPointerLeave: () => setWebPointerPressed(false),
            } : {}),
        }),

        ...refProps,
        ...buttonAttributes,
    };

    const content = (
        <ButtonContent
            as={Cnt}
            cntProps={cntProps}
            className={className}
            classTextName={classTextName}
            roundingClass={roundingClass}
            variant={variant}
            align={align}
            showTitleFromSize={showTitleFromSize}
            size={size}
            isIconOnly={isIconOnly}
            disabled={disabled}
            pressed={pressed}
            startDecorator={startDecorator}
            endDecorator={endDecorator}
            isTitle={isTitle}
            title={title}
            addon={addon}
            active={effectivePressed}
            hovered={isHovered}
            focused={isFocused}
            fullWidth={fullWidth}
        >
            {children}
        </ButtonContent>
    );

    return (
        <Tooltip content={tooltip} enabled={isTooltip}>
            {content}
        </Tooltip>
    );
}

export const ButtonRef = React.forwardRef((props, forwardedRef) => {
    return (
        <Button {...props} forwardedRef={forwardedRef} />
    );
});

export const ButtonLink = ({
    href = '',
    target = '',
    asExternal = false,
    size = BtnClsSize.default_size,
    ...props
}) => {
    const finalHref = sanitazeUrl(href);
    const isExternal = isExternalUrl(finalHref) || asExternal === true;

    if (isExternal && !isWeb) {
        return (
            <Button
                {...props}
                onPress={() => openExternalLink(finalHref)}
            />
        );
    }

    return (
        <Link
            href={href}
            target={target}
            asExternal={asExternal}
            mode="plain"
            className={`u-action-hitarea u-action-hitarea-${size} ${BtnClsSize[size]?.rounded} block`}
        >
            <Button {...props} hitarea={false} size={size} />
        </Link>
    );
};
