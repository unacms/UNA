import React, { useMemo, useCallback } from 'react';
import { Pressable, View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'
import { appSetting, isEmoji, FeedbackHaptics } from 'app/lib/util'
import { Theme, ThemeName } from 'app/design/theme';
import Tooltip from 'app/ui/atoms/tooltip';
import Loading from 'app/ui/atoms/loading'
import { useIsDesktop } from 'app/context/measure';


const ThemeCssClassesButton = appSetting('theme', 'button_styles');
const BtnCls = appSetting('theme', 'button_styles_neo');
const BtnClsSize = appSetting('theme', 'button_sizes_neo');
const ThemeButtonSizes = appSetting('theme', 'button_sizes');

/* buttons */
const getIcon = (sIcon, iIndex, classIconName, sClassText, sIconContainer, iIconSize, colorIcon, buttonIconStart) => {

    if (!sIcon)
        return;

    if (sIcon == '_loading')
        return <Loading size="small" />

    if (typeof (sIcon) == 'object')
        return buttonIconStart;

    sClassText = sClassText.replace('overflow-hidden', '');

    if (isEmoji(sIcon)) {
        sClassText = sClassText.replace('text-lg', ' text-3xl text-center leading-8  ');
        sClassText = sClassText.replace(' text-base', ' web:group-hover:no-underline text-2xl leading-6.5 ');
        sClassText = sClassText.replace('text-sm', ' web:group-hover:no-underline text-xl leading-5 text-center justify-center ');
        sClassText = sClassText.replace('text-xs', ' web:group-hover:no-underline text-xl native: text-base tracking-normal leading-5 text-center justify-center');
        return (
            <Text key={iIndex} className={classIconName ? classIconName : sClassText + sIconContainer}>{sIcon}</Text>
        );
    }
    return (
        <Icon key={iIndex + sIcon} className={classIconName ? classIconName : sClassText + sIconContainer} size={iIconSize} icon={sIcon}></Icon>
    );
};

const getIcon2 = (buttonInfo, classIconName, sClassText, sIconContainer, iIconSize, colorIcon, buttonIconStart) => {
    if (Array.isArray(buttonInfo)) {
        return buttonInfo.map((sIcon, iIndex) => {
            return getIcon(sIcon, iIndex, classIconName, sClassText, sIconContainer, iIconSize, colorIcon, buttonIconStart);
        });
    }
    else {
        return getIcon(buttonInfo, null, classIconName, sClassText, sIconContainer, iIconSize, colorIcon, buttonIconStart);
    }
}

const getAddon = (addon, isTitle) => {
    let sButtonAddonText = "";
    let sButtonAddonBg = "bg-muted";
    if (typeof addon === 'object') {
        sButtonAddonText = addon?.text;
        if (addon?.hideZero && sButtonAddonText == '0')
            return null;
        if (addon?.variant == 'primary')
            sButtonAddonBg = ' bg-destructive ';
    }
    else {
        sButtonAddonText = addon;
    }

    const position = addon?.position == 'bottom' ? 'bottom-0 -end-1' : '-top-2 -end-2';

    if (!isTitle && sButtonAddonText)
        return <View className={`absolute ${sButtonAddonBg} border-2 border-card rounded-full px-1 min-w-6 min-h-6 min items-center justify-center ${position}`}><Text className='text-white text-xs font-semibold'>{sButtonAddonText}</Text></View>

    return sButtonAddonText && sButtonAddonText ? <View className='flex-1 items-end '>
        <View className={sButtonAddonBg + ' rounded-full min-w-5 min-h-5 px-1.5 py-0.5 text-center items-center'}>
            <Text className="text-white text-xs font-semibold">{sButtonAddonText}</Text></View></View> : null;
}

const AddonNeo = ({addon, isTitle}) => {
    let sButtonAddonText = "";
    let sButtonAddonBg = "bg-muted";
    if (typeof addon === 'object') {
        sButtonAddonText = addon?.text;
        if (addon?.hideZero && sButtonAddonText == '0')
            return null;
        if (addon?.variant == 'primary')
            sButtonAddonBg = ' bg-destructive ';
    }
    else {
        sButtonAddonText = addon;
    }

    const position = addon?.position == 'bottom' ? 'bottom-0 -end-1' : '-top-2 -end-2';

    let addOn = <></>
    if (!isTitle && sButtonAddonText)
        addOn = <View className={`absolute ${sButtonAddonBg} border-2 border-card rounded-full px-1 min-w-6 min-h-6 min items-center justify-center ${position}`}><Text className='text-white text-xs font-semibold'>{sButtonAddonText}</Text></View>

    addOn = sButtonAddonText && sButtonAddonText ? <View className='flex-1 items-end '>
        <View className={sButtonAddonBg + ' rounded-full min-w-5 min-h-5 px-1.5 py-0.5 text-center items-center'}>
            <Text className="text-white text-xs font-semibold">{sButtonAddonText}</Text></View></View> : null;

    return <View className={`${isTitle ? 'z-10' : 'absolute top-0 right-0 w-full h-full z-20 pointer-events-none'}`}>{addOn}</View>
}

const NeoIcon = ({icon, className}) => {

    if (!icon)
        return;

    if (icon == '_loading')
        return <Loading size="small" />

    if (typeof (icon) !== 'string')
        return icon;

    if (isEmoji(icon)) {
        return (
            <Text className={className}>{icon}</Text>
        );
    }
    return (
        <Text className={className}><Icon className={className} icon={icon}/></Text>
    );
};

const getAccessibleNameNeo = (alt, tooltip, title, startDecorator, endDecorator) => {
        // Priority order: explicit alt > tooltip > title > icon name
        if (alt) return alt;
        if (tooltip && typeof tooltip === 'string') return tooltip;
        if (title && typeof title === 'string') return title;

        // For icon-only buttons, derive name from icon
        const iconName = startDecorator || endDecorator;
        if (iconName && !title) {
            // Convert icon name to human-readable format
            // e.g., "ChevronLeft" -> "Chevron Left", "X" -> "Close"
            const iconMap = {
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

            if (iconMap[iconName]) return iconMap[iconName];

            // Fallback: convert CamelCase to readable text
            return iconName.replace(/([A-Z])/g, ' $1').trim();
        }

        return undefined;
    };

export const NeoButton = ({
    variant = ThemeButtonSizes.default_variant,
    size = ThemeButtonSizes.default_size,
    disabled = false,
    tooltip = false,
    onPress,
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
    pressedClasses,
    addon = '',
    rounded = false,
    hitarea = true,
    hitSlop,
    alt,
    role = 'button',
    children,
    solid = false,
    padding,
}) => {
    const isTitle = !!title;
    const isIcon = !!(startDecorator || endDecorator);
    const isIconOnly = isIcon && !isTitle;
    const isDesktop = useIsDesktop();
    const isTooltip = useMemo(() => isDesktop && tooltip, [isDesktop, tooltip]);
    const isActive = onPress && !disabled;

    const flexClasses =
        isIconOnly ? "flex-none" :
            fullWidth ? "flex-auto web:w-full" :
                isTitle ? "flex-none" :
                    "w-fit";

    const handlePress = useMemo(() => {
        if (!haptics || !onPress) return onPress;

        return (event) => {
            FeedbackHaptics(haptics);
            onPress(event);
        };
    }, [haptics, onPress]);

    const canRound = !variant.startsWith('group-item') && !(variant === 'link' || variant.includes('-link'));

const roundingClass = !canRound
  ? ''
  : rounded
    ? 'rounded-full'
    : BtnClsSize[size]?.rounded ?? '';

    const buttonContent1 = ({ pressed: active, hovered, focused }) => {
        const containerClasses = [
            'overflow-hidden asdas',
            className,
            roundingClass,
            BtnCls[variant]?.container?.base,
            variant === 'group-item-none' ? 'justify-between' : `justify-${align}`,
            !active && !pressed && !hovered && !focused && !disabled ? BtnCls[variant]?.container?.default : '',
            pressed ? pressedClasses ? pressedClasses?.pressed_container : BtnCls[variant]?.container?.pressed : '',
            active ? BtnCls[variant]?.container?.active : '',
            hovered ? BtnCls[variant]?.container?.hovered : '',
            focused ? BtnCls[variant]?.container?.focused : '',
            disabled ? BtnCls[variant]?.container?.disabled : '',
            isIconOnly ? BtnClsSize[size]?.container_icon_only : BtnClsSize[size]?.container,
        ].join(' ');

        const textClasses = [
            'whitespace-nowrap text-ellipsis overflow-hidden',
            classTextName,
            BtnCls[variant]?.text?.base,
            !pressed && !hovered && !focused && !disabled ? BtnCls[variant]?.text?.default : '',
            pressed ? pressedClasses ? pressedClasses?.pressed_text : BtnCls[variant]?.text?.pressed : '',
            active ? BtnCls[variant]?.text?.active : '',
            hovered ? BtnCls[variant]?.text?.hovered : '',
            focused ? BtnCls[variant]?.text?.focused : '',
            disabled ? BtnCls[variant]?.text?.disabled : '',
            BtnClsSize[size]?.text,
        ].join(' ');

        const isTitleVisible = !startDecorator && !endDecorator || !isNaN(title) || showTitleFromSize == '';
        const titleVisibility = isTitleVisible ? '' : ' hidden ' + (showTitleFromSize ? showTitleFromSize : 'sm') + ':block';

        return (
            <Row className={`items-center ${containerClasses}`}>
                <NeoIcon icon={startDecorator} className={textClasses} />
                {isTitle && (
                    <Text className={`${textClasses} ${titleVisibility}`} numberOfLines={1}>
                        {title} 
                    </Text>
                )}
                <NeoIcon icon={endDecorator} className={textClasses} />
                {(isTitle && addon) && <AddonNeo addon={addon} isTitle={isTitle} />}
                {children && <View className="z-10">{children}</View>}
            </Row>
        )
    };

    const accessibleName = getAccessibleNameNeo(alt, tooltip, title, startDecorator, endDecorator)

    const hitareaClass = hitarea === false ? '' : `u-action-hitarea u-action-hitarea-${size}`;

    const resolvedHitSlop = useMemo(() => {
        if (hitSlop !== undefined) return hitSlop;
        if (hitarea === false) return undefined;
        return { top: BtnClsSize[size].hit_slop, right: BtnClsSize[size].hit_slop, bottom: BtnClsSize[size].hit_slop, left: BtnClsSize[size].hit_slop };
    }, [hitSlop, hitarea, size]);


    const buttonAttributes = isActive ? {
        ...(accessibleName ? {
            'aria-label': accessibleName,
            alt: accessibleName
        } : {}),
        role: role,
    } : {};

    const buttonContent = !isActive ? (
        <View 
            className={`${flexClasses} ${hitareaClass}`}
        >
            {buttonContent1({ pressed: false, hovered: false, focused: false })}
        </View>
    ) : (
        <Pressable
            hitSlop={resolvedHitSlop}
            onPress={handlePress}
            {...buttonAttributes}
            className={`${flexClasses} ${hitareaClass}`}
        >
            {({ pressed, hovered, focused }) => buttonContent1({ pressed, hovered, focused })}
        </Pressable>
    );

    if (!isTitle && addon) {
        const wrapper = (
            <Row className={`items-center justify-center ${fullWidth ? 'flex-auto w-full' : 'w-fit'}`}>
                {buttonContent}
                <AddonNeo addon={addon} isTitle={isTitle} />
            </Row>
        );
        return isTooltip ? <Tooltip content={tooltip}>{wrapper}</Tooltip> : wrapper;
    }

    return isTooltip ? <Tooltip content={tooltip}>{buttonContent}</Tooltip> : buttonContent;
}

export const Button = (props) => {
    if (appSetting('theme', 'neo_button') && !props.old)
        return <NeoButton {...props}/>
    const {
        className = '',
        classTextName = '',
        classIconName = '',
        bgColor = '',
        textColor = '',
        onPress,
        haptics,
        forwardedRef,
        variant = ThemeButtonSizes.default_variant,
        size = ThemeButtonSizes.default_size,
        showTitleFromSize = '',
        tooltip = false,
        pressed = false,
        disabled = false,
        startDecorator = '',
        endDecorator = '',
        align = 'center',
        fullWidth = false,
        pressedClasses,
        title = '',
        addon = '',
        rounded = false,
        solid = false,
        padding,
        children,
        hitarea = true,
        ...rest
    } = props;

    const { colors } = Theme();
    const themeName = ThemeName();
    const isDesktop = useIsDesktop();
    const showTooltip = useMemo(() => isDesktop && tooltip, [isDesktop, tooltip]);

    const sClassContainer = useMemo(() => {
        let classes = 'web:group flex-row items-center ';

        // Determine if button has title for width calculation
        const hasTitle = !!title;
        const hasIcon = !!(startDecorator || endDecorator);
        const isIconOnly = hasIcon && !hasTitle;

        // Handle width based on button content type
        if (isIconOnly) {
            // Icon-only buttons get explicit width (handled in sizeClasses)
            classes += ' flex-none';
        } else if (hasTitle) {
            // Buttons with title get flexible width
            classes += fullWidth ? ' flex-auto web:w-full' : ' flex-none';
        } else {
            // Fallback to original behavior
            classes += fullWidth ? ' flex-auto web:w-full' : ' w-fit';
        }

        if (disabled) classes += ' opacity-50';
        if (variant !== 'custom') {
            classes += ` ${!solid && ThemeCssClassesButton[`u-btn-${variant}-trans`]} ${className} ${ThemeCssClassesButton[`u-btn-${variant}-cnt`]} `;
        } else {
            classes += ` ${className} `;
        }
        if (bgColor) {
            classes = classes.replaceAll(/bg-\S+/g, '').replaceAll(/ring-\S+/g, '') + ` ${bgColor}`;
        }
        if (variant === 'group-item-none') {
            classes += ' justify-between';
        } else {
            classes += ` justify-${align}`;
        }
        if (pressed) {
            classes = classes.replace(/\b(bg-[^\s]*)\b|\b(dark:bg-[^\s]*)\b/g, "").replace(/\s+/g, " ").trim();
            classes += ` ${pressedClasses?.pressed_container || ThemeCssClassesButton[`u-btn-${variant}-pressed-cnt`] || ThemeButtonSizes.pressed_container}`;
        }
        return classes;
    }, [fullWidth, disabled, variant, solid, ThemeCssClassesButton, className, align, pressed, bgColor, pressedClasses, title, startDecorator, endDecorator]);

    const sClassText = useMemo(() => {
        let classes = 'whitespace-nowrap text-ellipsis overflow-hidden';
        if (variant !== 'custom' && !pressed) {
            classes += ` ${ThemeCssClassesButton[`u-btn-${variant}-text`]}`;
        } else {
            classes += ` ${classTextName}`;
        }
        if (textColor) {
            classes = classes.replaceAll(/text-\S+/g, '') + ` ${textColor}`;
        }
        if (pressed) {
            classes += ` ${pressedClasses?.pressed_text || ThemeCssClassesButton[`u-btn-${variant}-pressed-text`] || ThemeButtonSizes.pressed_text}`;
        }
        return classes;
    }, [variant, ThemeCssClassesButton, classTextName, pressed, size, pressedClasses, textColor]);

    const colorIcon = useMemo(() => {
        let a = ThemeCssClassesButton[`u-btn-${variant}-color-icon-${themeName}`];
        return a;
    }, [variant, ThemeName, colors, ThemeCssClassesButton]);

    const { sIconContainer, iIconSize, sTitleContainer, sizeClasses } = useMemo(() => {
        const titleVisible = !startDecorator && !endDecorator || !isNaN(title) || showTitleFromSize == '';
        let iconSize = 24;
        let iconContainerClass = '';
        let titleContainerClass = titleVisible ? '' : ' hidden ' + (showTitleFromSize ? showTitleFromSize : 'sm') + ':block';
        let sizeClasses = '';

        const isLinkVariant = variant === 'link' || variant.includes('-link');
        const sClassDefaultRounding = !variant.startsWith('group-item') && !isLinkVariant ? ThemeButtonSizes[size]?.rounded : '';
        const sClassFullRounding = !variant.startsWith('group-item') && !isLinkVariant ? 'rounded-full' : '';
        const roundingClass = rounded ? sClassFullRounding : sClassDefaultRounding;

        if (variant != 'custom') {
            // Determine which padding to use based on button content
            const hasTitle = !!title;
            const hasIcon = !!(startDecorator || endDecorator);
            const isIconOnly = hasIcon && !hasTitle;

            let paddingClass;
            if (isLinkVariant) {
                // Link variants don't use padding
                paddingClass = '';
            } else if (isIconOnly && ThemeButtonSizes[size]?.padding_icon_only) {
                paddingClass = ThemeButtonSizes[size].padding_icon_only;
            } else if (hasTitle && ThemeButtonSizes[size]?.padding_with_title) {
                paddingClass = ThemeButtonSizes[size].padding_with_title;
            } else {
                paddingClass = ThemeButtonSizes[size]?.padding;
            }

            const hitareaClass = hitarea === false ? '' : (ThemeButtonSizes[size]?.hitarea_class || '');
            sizeClasses = `${roundingClass} ${padding || paddingClass} ${hitareaClass}`;
            iconContainerClass = `${ThemeButtonSizes[size]?.icon_container} ${title ? ThemeButtonSizes[size]?.icon_margin : ''}`;
            iconSize = ThemeButtonSizes[size]?.icon_size;
            titleContainerClass += title ? ThemeButtonSizes[size]?.title_container + (startDecorator || endDecorator ? ThemeButtonSizes[size]?.title_margin : '') : '';
        }
        return {
            sIconContainer: iconContainerClass,
            iIconSize: iconSize,
            sTitleContainer: titleContainerClass,
            sizeClasses,
        };
    }, [size, rounded, padding, variant, title, startDecorator, endDecorator, showTitleFromSize]);

    const sButtonIconStart = useMemo(
        () =>
            startDecorator
                ? getIcon2(
                    startDecorator,
                    classIconName,
                    sClassText,
                    sIconContainer,
                    iIconSize,
                    colorIcon,
                    startDecorator
                )
                : null,
        [startDecorator, classIconName, sClassText, sIconContainer, iIconSize, colorIcon]
    );

    const sButtonIconEnd = useMemo(
        () =>
            endDecorator
                ? getIcon2(
                    endDecorator,
                    classIconName,
                    sClassText,
                    sIconContainer,
                    iIconSize,
                    colorIcon,
                    endDecorator
                )
                : null,
        [endDecorator, classIconName, sClassText, sIconContainer, iIconSize, colorIcon]
    );
    const isTitle = !!title;
    const oButtonAddon = getAddon(addon, isTitle);

    // Performance-optimized haptics handler - only created when haptics prop is provided
    const handlePress = useMemo(() => {
        if (!haptics || !onPress) return onPress;

        return (event) => {
            FeedbackHaptics(haptics);
            onPress(event);
        };
    }, [haptics, onPress]);

    const Cnt = onPress && !disabled /*&& !isWeb*/ ? Pressable : View;
    // Resolve default native hitSlop from theme size unless explicitly overridden via rest.hitSlop
    const resolvedHitSlop = useMemo(() => {
        if (rest.hitSlop !== undefined) return rest.hitSlop;
        if (hitarea === false) return undefined;
        return ThemeButtonSizes?.[size]?.hitSlop;
    }, [rest.hitSlop, hitarea, size]);
    const refProps = forwardedRef ? { ref: forwardedRef } : {};



    // Generate accessible name for buttons
    const getAccessibleName = useCallback(() => {
        // Priority order: explicit alt > tooltip > title > icon name
        if (rest.alt) return rest.alt;
        if (tooltip && typeof tooltip === 'string') return tooltip;
        if (title && typeof title === 'string') return title;

        // For icon-only buttons, derive name from icon
        const iconName = startDecorator || endDecorator;
        if (iconName && !title) {
            // Convert icon name to human-readable format
            // e.g., "ChevronLeft" -> "Chevron Left", "X" -> "Close"
            const iconMap = {
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

            if (iconMap[iconName]) return iconMap[iconName];

            // Fallback: convert CamelCase to readable text
            return iconName.replace(/([A-Z])/g, ' $1').trim();
        }

        return undefined;
    }, [rest.alt, tooltip, title, startDecorator, endDecorator]);

    const accessibleName = getAccessibleName();

    const buttonAttributes = onPress && !disabled ? {
        ...(accessibleName ? {
            'aria-label': accessibleName,
            alt: accessibleName
        } : {}),
        role: rest['aria-haspopup'] === 'menu' ? 'menubutton' : 'button',
    } : {};
    const buttonContent = (
        <Cnt
            className={`${fullWidth ? 'flex-auto ' : ''} ${sClassContainer} ${sizeClasses} ${(ThemeCssClassesButton['u-btn-' + variant + '-focus'] || ThemeCssClassesButton['u-btn-focus'] || '')}`}
            {...rest}
            {...buttonAttributes}
            onPress={onPress && !disabled ? handlePress : undefined}
            hitSlop={resolvedHitSlop}
            {...refProps}
        >

            {sButtonIconStart && <Row className="z-10 gap-x-0.5">{sButtonIconStart}</Row>}
            {isTitle && (
                <Text className={`z-10 ${sClassText} ${sTitleContainer}`} numberOfLines={1}>
                    {title}
                </Text>
            )}
            {sButtonIconEnd && <View className="z-10">{sButtonIconEnd}</View>}
            {isTitle && oButtonAddon && <View className="z-10">{oButtonAddon}</View>}
            {children && <View className="z-10">{children}</View>}
        </Cnt>
    );

    if (!isTitle && oButtonAddon) {
        const wrapper = (
            <Row className={`items-center justify-center ${fullWidth ? 'flex-auto w-full' : 'w-fit'}`}>
                {buttonContent}
                <View className="absolute top-0 right-0 w-full h-full z-20 pointer-events-none" style={{ pointerEvents: 'none' }}>
                    {oButtonAddon}
                </View>
            </Row>
        );
        return showTooltip ? <Tooltip content={tooltip}>{wrapper}</Tooltip> : wrapper;
    }

    return showTooltip ? <Tooltip content={tooltip}>{buttonContent}</Tooltip> : buttonContent;
};

export const ButtonRef = React.forwardRef((props, forwardedRef) => {
    return (
        <Button {...props} forwardedRef={forwardedRef} />
    );
});