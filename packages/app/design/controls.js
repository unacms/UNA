import React, { useMemo, forwardRef, useEffect, useCallback } from 'react';
import { TextInput as TextInputDef, Modal as ModalDef, Platform } from 'react-native'
import { Pressable, View, ScrollView, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'
import { appSetting, isEmoji, LAYOUT_BREAKPOINTS } from 'app/lib/util'
import { Picker as PickerDef } from '@react-native-picker/picker';
import { Theme, ThemeName } from 'app/design/theme';
import Tooltip from 'app/ui/atoms/tooltip';
import Loading from 'app/ui/atoms/loading'
import { RemoveScroll } from 'react-remove-scroll';
import { useSafeAreaInsets } from 'app/lib/hooks/router'
import { useIsDesktop, useBreakpoint, useWindowHeight } from 'app/context/measure';
/* inputs */
const inputSettings = appSetting('theme', 'inputs');

export const TextInputClear = TextInputDef

export const Input = ({ className, startDecorator, endDecorator, ...props }) => (
    <Row className={`items-center flex-auto`}>
        {startDecorator && (
            <View className="absolute left-3.5 h-full items-center justify-center">
                <Icon icon={startDecorator} size={24} className="text-neutral-700 dark:text-neutral-300" />
            </View>
        )}
        <TextInputDef className={`${className} ${inputSettings.default} ${startDecorator ? 'pl-12' : ''} ${endDecorator ? 'pr-11' : ''}`} {...props} />
        {endDecorator && (
            <View className="absolute right-3 h-full items-center justify-center">
                <Icon icon={endDecorator} size={24} className="text-neutral-700 dark:text-neutral-300" />
            </View>
        )}
    </Row>
);

export const InputRef = forwardRef(({ className, startDecorator, endDecorator, ...props }, ref) => (
    <Row className={`items-center flex-auto`}>
        {startDecorator && (
            <View className="absolute left-3.5 h-full items-center justify-center">
                <Icon icon={startDecorator} size={24} className="text-neutral-700 dark:text-neutral-300" />
            </View>
        )}
        <TextInputDef className={`${className} ${inputSettings.default} ${startDecorator ? 'pl-12' : ''} ${endDecorator ? 'pr-11' : ''}`} ref={ref} {...props} />
        {endDecorator && (
            <View className="absolute right-3 items-center justify-center">
                <Icon icon={endDecorator} size={24} className="text-neutral-700 dark:text-neutral-300" />
            </View>
        )}
    </Row>
));

export const InputMulti = forwardRef(({ className, startDecorator, endDecorator, onHeight, ...props }, ref) => (
     <Row className={`items-center flex-auto`}>
        {startDecorator && (
            <View className="absolute left-3.5 h-full items-center justify-center">
                <Icon icon={startDecorator} size={24} className="text-neutral-700 dark:text-neutral-300" />
            </View>
        )}
        <TextInputDef
            className={`${className} ${inputSettings.multi} ${startDecorator ? 'pl-12' : ''} ${endDecorator ? 'pr-11' : ''}`}
            ref={ref}
            {...props}
            onContentSizeChange={(e) => {
                // Call the original onContentSizeChange if provided
                if (props.onContentSizeChange) {
                    props.onContentSizeChange(e);
                }
                // Also call onHeight callback if provided (for messenger auto-grow)
                if (onHeight && e.nativeEvent?.contentSize?.height) {
                    onHeight(e.nativeEvent.contentSize.height);
                }
            }}
        />
        {endDecorator && (
            <View className="absolute right-3 items-center justify-center">
                <Icon icon={endDecorator} size={24} className="text-neutral-700 dark:text-neutral-300" />
            </View>
        )}
    </Row>
));

export const InputRounded = ({ className, startDecorator, endDecorator, ...props }) => (
    <Row className={`items-center flex-auto`}>
        {startDecorator && (
            <View className="absolute left-3.5 h-full items-center justify-center">
                <Icon icon={startDecorator} size={24} className="text-neutral-700 dark:text-neutral-300" />
            </View>
        )}
        <TextInputDef className={`${className} ${inputSettings.default} ${startDecorator ? 'pl-12' : ''} ${endDecorator ? 'pr-11' : ''}`} {...props} />
        {endDecorator && (
            <View className="absolute right-3 h-full items-center justify-center">
                <Icon icon={endDecorator} size={24} className="text-neutral-700 dark:text-neutral-300" />
            </View>
        )}
    </Row>
);

export const InputRoundedRef = forwardRef(({ className, startDecorator, endDecorator, ...props }, ref) => (
    <Row className={`items-center flex-auto`}>
        {startDecorator && (
            <View className="absolute left-3.5 h-full items-center justify-center">
                <Icon icon={startDecorator} size={24} className="text-neutral-700 dark:text-neutral-300" />
            </View>
        )}
        <TextInputDef className={`${className} ${inputSettings.rounded} ${startDecorator ? 'pl-12' : ''} ${endDecorator ? 'pr-11' : ''}`} ref={ref} {...props} />
        {endDecorator && (
            <View className="absolute right-2.5 h-full items-center justify-center">
                <Icon icon={endDecorator} size={24} className="text-neutral-700 dark:text-neutral-300" />
            </View>
        )}
    </Row>
));

export const InputRoundedSmall = ({ className, startDecorator, endDecorator, ...props }) => (
    <Row className={`items-center flex-auto`}>
        {startDecorator && (
            <View className="absolute left-3.5 h-full items-center justify-center">
                <Icon icon={startDecorator} size={24} className="text-neutral-700 dark:text-neutral-300" />
            </View>
        )}
        <TextInputDef className={`${className} ${inputSettings.roundedsmall} ${startDecorator ? 'pl-12' : ''} ${endDecorator ? 'pr-11' : ''}`} {...props} />
        {endDecorator && (
            <View className="absolute right-2.5 h-full items-center justify-center">
                <Icon icon={endDecorator} size={24} className="text-neutral-700 dark:text-neutral-300" />
            </View>
        )}
    </Row>
);

export const InputSmall = ({ className, startDecorator, endDecorator, ...props }) => (
    <Row className={`items-center`}>
        {startDecorator && (
            <View className="absolute left-3.5 h-full items-center justify-center">
                <Icon icon={startDecorator} size={24} className="text-neutral-700 dark:text-neutral-300" />
            </View>
        )}
        <TextInputDef className={`${className} ${inputSettings.small} ${startDecorator ? 'pl-12' : ''} ${endDecorator ? 'pr-11' : ''}`} {...props} />
        {endDecorator && (
            <View className="absolute right-3 h-full items-center justify-center">
                <Icon icon={endDecorator} size={24} className="text-neutral-700 dark:text-neutral-300" />
            </View>
        )}
    </Row>
);

export const Hidden = ({ className, ...props }) => (
    <TextInputDef className={'hidden'} {...props} />
);

const PickerStyles = inputSettings.select;

export const PickerStyled = ({ className, ...props }) => (
    <PickerDef className={PickerStyles} {...props} />
);

export const PickerStyledRef = forwardRef(({ classes, className, ...props }, ref) => (
    <View className={`relative flex-auto items-center flex-row`}>
        <PickerDef ref={ref} className={`${classes ? classes : PickerStyles} w-full`} {...props} />
        <View className="absolute right-3 pointer-events-none">
            <Icon icon="ChevronDown" size={20} className="text-neutral-500" />
        </View>
    </View>
));

export const PickerStyledIos = ({ className, ...props }) => (
    <PickerDef className={PickerStyles} {...props} />
);

const modalSettings = appSetting('theme', 'modal');
const isWeb = Platform.OS === 'web';

export function Modal({
    animation,
    position = 'center',
    onClose,
    outerClickClose = true,
    onVisible,
    title,
    textAlign = 'center',
    headerBorder = true,
    fullWidth = true,
    maxWidth = 'max-w-2xl',
    children,
    padding = " p-4 ",
    scrollable = false,
    autoHeight = false
}) {
    // Cleanup guard to prevent removeChild errors
    useEffect(() => {
        return () => {
            // Cleanup function to prevent removeChild errors
            if (Platform.OS === 'web' && typeof window !== 'undefined' && document.body) {
                const portals = document.querySelectorAll('[data-react-native-modal]');
                portals.forEach(portal => {
                    if (portal.parentNode) {
                        try {
                            portal.parentNode.removeChild(portal);
                        } catch (e) {
                            // Ignore removeChild errors - they're harmless
                        }
                    }
                });
            }
        };
    }, []);
    const currentBreakpoint = useBreakpoint();
    const height = useWindowHeight();
    const offset = (title || onClose  ? (currentBreakpoint >= LAYOUT_BREAKPOINTS.md ? 100 : 68)  : 0);

    if (!animation){
        animation = currentBreakpoint >= LAYOUT_BREAKPOINTS.md ? 'fade' : 'slide';
    }

    const styles = !autoHeight ? { maxHeight: height - offset } : {};
    const isIOS = Platform.OS === 'ios';

    const isOuterClose = (onClose !== 'undefined' && outerClickClose !== false);
    const positionClasses = {
        'top': 'items-start py-8 px-4',
        'bottom': 'items-end py-8 px-4',
        'center': 'sm:items-center items-start ',
    };

    const sClassPosition = positionClasses[position] || positionClasses['center'];

    const align = !title && onClose ? 'end' : textAlign;

    const type = typeof title;

    const Cnt = scrollable ? ScrollView : View

    const layoutShift = isWeb ? 'sm' : '2xl';

    if (!title && padding == " p-4 sm:pt-0  "){
        padding = 'p-4';
    }

    const insets = useSafeAreaInsets();

    const Content = (
        <View  style={{ paddingTop: isIOS? insets?.top : 0 }} className={`flex-row justify-center left-0 right-0 z-50 w-full overflow-x-hidden overflow-y-auto ${layoutShift}:inset-0 h-full h-modal ${sClassPosition}`}>
    <View className={`w-full ${maxWidth} ${fullWidth ? '' : `${layoutShift}:w-auto`} relative ${modalSettings.container.replaceAll("{ls}", layoutShift)} `}>
        <View className={`relative ${!autoHeight ? 'h-full' : ''} ${modalSettings.content.replaceAll("{ls}", layoutShift)}`}>
            {
                (title || onClose) && <Row className={`items-center justify-${align} ${headerBorder && modalSettings.header} `}>
                    {(title && type === 'string') && (
                        <View className='flex-auto absolute left-0 right-0'>
                            <Text className='text-xl text-center leading-9 font-bold text-card-foreground '>{title}</Text>
                        </View>
                    )}
                    {(title && type !== 'string') && (title)}
                    {onClose && (
                        <View className='ml-auto'>
                            <Button variant='secondary' size='sm' rounded startDecorator='X' onPress={onClose} />
                        </View>
                    )}
                </Row>
            }
            <Cnt style={styles} className={`${padding} flex-auto `}>{children}</Cnt>{/*overflow-y-auto*/}
        </View>
    </View>
</View>)

    return (
        <ModalDef visible={onVisible} animationType={animation} transparent={isWeb}>
            <Pressable className={`pointerEvents cursor-default flex justify-end w-full h-full 
                ${modalSettings.fog}`} 
                onPress={(event) => {   isOuterClose ? onClose : undefined; event.stopPropagation();}}


            >
               {isWeb ? <RemoveScroll className='flex-1'>{Content}</RemoveScroll> : Content}
            </Pressable>
        </ModalDef>
    );
}

/* buttons */
export function MenuButton(props) {
    return <Button>TODO</Button>
}

const ThemeCssClassesButtonGroups = appSetting('theme', 'buttons_group_styles');

/* buttons group */
export function ButtonsGroup({
    className = '',
    variant = 'default',
    size = 'base',
    fullWidth = false,
    showTitleFromSize = '',
    rounded = false,
    children = [],
    ...rest
}) {
    let sClassContainer = 'web:group';
    sClassContainer += fullWidth ? ' flex-auto w-full items-stretch' : ' w-fit m-0 truncate ';
    
    sClassContainer += ThemeCssClassesButtonGroups['u-btn-' + variant + '-cnt'] ? ThemeCssClassesButtonGroups['u-btn-' + variant + '-cnt'] + ' ' : ' ';
    sClassContainer += className;

    const bTextContainer = !!variant && variant == 'text';
    const ThemeButtonsGroupSizes = appSetting('theme', 'buttons_group_sizes');
    const ThemeButtonsGroupItemSizes = appSetting('theme', 'buttons_group_items_sizes');
    const ThemeButtonItemStyles = appSetting('theme', 'button_styles');
    const groupSizeCfg = ThemeButtonsGroupSizes?.[size] || {};
    const itemSizeCfg = ThemeButtonsGroupItemSizes?.[size] || {};

    const aChildren = children.map((child, iIndex) => {
        const childProps = child?.props || {};
        const { variant: childVariant, size: childSize, fullWidth: childFullWidth, ...restChild } = childProps;

        // If child is a Button: size and style it as a group item and return directly
        if (child.type === Button) {
            const hasTitle = !!restChild.title;
            const paddingOverride = hasTitle ? (groupSizeCfg.item_padding || '') : (groupSizeCfg.item_padding_icon_only || groupSizeCfg.item_padding || '');
            return (
                <Button
                    key={iIndex}
                    showTitleFromSize={showTitleFromSize}
                    variant={'group-item' + (!!childVariant ? '-' + childVariant : '')}
                    size={childSize}
                    fullWidth={childFullWidth ?? fullWidth}
                    padding={paddingOverride}
                    {...restChild}
                />
            );
        }

        // If child is a wrapper (e.g., Link) around a Button: replace inner Button with sized group item
        const inner = childProps.children;
        if (React.isValidElement(inner) && inner.type === Button) {
            const innerProps = inner.props || {};
            const innerVariant = innerProps.variant;
            const { fullWidth: innerFullWidth, ...restInner } = innerProps;
            const hasTitle = !!restInner.title;
            const paddingOverride = hasTitle ? (groupSizeCfg.item_padding || '') : (groupSizeCfg.item_padding_icon_only || groupSizeCfg.item_padding || '');
            const sizedInner = (
                <Button
                    showTitleFromSize={showTitleFromSize}
                    variant={'group-item' + (!!innerVariant ? '-' + innerVariant : '')}
                    size={innerProps.size}
                    fullWidth={innerFullWidth ?? fullWidth}
                    padding={paddingOverride}
                    {...restInner}
                />
            );
            return React.cloneElement(child, { key: iIndex, children: sizedInner });
        }

        // Fallback: non-Button child — wrap with group item container styles and padding
        const paddingOverride = groupSizeCfg.item_padding || '';
        const itemCntClass = ThemeButtonItemStyles[`u-btn-group-item-${variant}-cnt`] || '';
        const itemTextClass = ThemeButtonItemStyles[`u-btn-group-item-${variant}-text`] || '';
        return (
            <View key={iIndex} className={`${itemCntClass} ${itemTextClass} ${paddingOverride} items-center justify-center ${itemSizeCfg?.container || ''} ${rounded ? (itemSizeCfg?.rounded || '') : ''}`}>{child}</View>
        );
    });

    // Insert dividers between items when there are multiple children
    const dividerSizeClass = groupSizeCfg?.divider || '';
    const dividerStyleClass =
        (ThemeButtonItemStyles[`u-btn-group-divider-${variant}-cnt`] ||
            ThemeCssClassesButtonGroups[`u-btn-group-divider-${variant}-cnt`] ||
            ThemeButtonItemStyles[`u-btn-group-divider-${variant}-text`] ||
            ThemeCssClassesButtonGroups[`u-btn-group-divider-${variant}-text`] ||
            ThemeButtonItemStyles[`u-btn-group-divider-${variant}`] ||
            ThemeCssClassesButtonGroups[`u-btn-group-divider-${variant}`] ||
            ThemeButtonItemStyles['u-btn-group-divider-cnt'] ||
            ThemeCssClassesButtonGroups['u-btn-group-divider-cnt'] ||
            ThemeButtonItemStyles['u-btn-group-divider-text'] ||
            ThemeCssClassesButtonGroups['u-btn-group-divider-text'] ||
            ThemeButtonItemStyles['u-btn-group-divider'] ||
            ThemeCssClassesButtonGroups['u-btn-group-divider'] ||
            '');
    const itemsWithDividers = [];
    aChildren.forEach((item, index) => {
        itemsWithDividers.push(item);
        if (index < aChildren.length - 1) {
            itemsWithDividers.push(
                <View key={`divider-${index}`} className={`${dividerStyleClass} ${dividerSizeClass}`}></View>
            );
        }
    });

    // Apply group container sizing on the same wrapper
    const groupHeightClass = groupSizeCfg?.container || '';
    const groupRoundedClass = rounded ? ' rounded-full ' : (groupSizeCfg.rounded || '');
    return (
        <View className={`${fullWidth ? 'flex-auto w-full' : 'w-fit'} ${groupRoundedClass} overflow-hidden ${sClassContainer} ${groupHeightClass}`} {...rest}>
            {itemsWithDividers}
        </View>
    );
}

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
        sClassText = sClassText.replace(' text-base', ' group-hover:no-underline text-2xl leading-6.5 ');
        sClassText = sClassText.replace('text-sm', ' group-hover:no-underline text-xl leading-5 text-center justify-center ');
        sClassText = sClassText.replace('text-xs', ' group-hover:no-underline text-xl native: text-base tracking-normal leading-5 text-center justify-center');
        return (
            <Text key={iIndex} className={classIconName ? classIconName : sClassText + sIconContainer}>{sIcon}</Text>
        );
    }
    return (
        <Icon key={iIndex+sIcon} className={classIconName ? classIconName : sClassText + sIconContainer} size={iIconSize} icon={sIcon}></Icon>
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

    const position = addon?.position == 'bottom' ? 'bottom-0' : ' -top-1 -end-1';

    if (!isTitle && sButtonAddonText)
        return <View className={`absolute ${sButtonAddonBg} border border-card web:border-0 web:ring-1 web:ring-card rounded-full px-1 min-w-5 min-h-5 min items-center justify-center ${position}`}><Text className='text-white text-xs font-semibold'>{sButtonAddonText}</Text></View>

    return sButtonAddonText && sButtonAddonText ? <View className='flex-1 items-end '>
        <View className={sButtonAddonBg + ' rounded-full px-2 py-0.5 text-center items-center'}>
            <Text className="text-white text-xs font-semibold">{sButtonAddonText}</Text></View></View> : null;
}

const ThemeCssClassesButton = appSetting('theme', 'button_styles');
const ThemeButtonSizes = appSetting('theme', 'button_sizes');


export const Button = (props) => {
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
        let classes = 'flex-row items-center';
        
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
        if (bgColor){
            classes = classes.replaceAll(/bg-\S+/g, '').replaceAll(/ring-\S+/g, '') + ` ${bgColor}`;
        }
        if (variant === 'group-item-none') {
            classes += ' justify-start';
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
        if (textColor){
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

        const sClassDefaultRounding = !variant.startsWith('group-item') ? ThemeButtonSizes[size]?.rounded : '';
        const sClassFullRounding = !variant.startsWith('group-item') ? 'rounded-full' : '';
        const roundingClass = rounded ? sClassFullRounding : sClassDefaultRounding;

        if (variant != 'custom') {
            // Determine which padding to use based on button content
            const hasTitle = !!title;
            const hasIcon = !!(startDecorator || endDecorator);
            const isIconOnly = hasIcon && !hasTitle;
            
            let paddingClass;
            if (isIconOnly && ThemeButtonSizes[size]?.padding_icon_only) {
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
            // Lazy import FeedbackHaptics only when actually needed
            import('app/lib/util').then(({ FeedbackHaptics }) => {
                FeedbackHaptics(haptics);
            });
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

  

    const buttonAttributes = onPress && !disabled  ?{
        ...(rest.alt ? { 
            'aria-label': rest.alt,
            alt: rest.alt 
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
            {sButtonIconStart}
            {isTitle && (
                <Text className={`${sClassText} ${sTitleContainer}`} numberOfLines={1}>
                    {title}
                </Text>
            )}
            {sButtonIconEnd}
            {isTitle && oButtonAddon}
            {children}
            {!isTitle && oButtonAddon}
        </Cnt>
    );

    return showTooltip ? <Tooltip content={tooltip}>{buttonContent}</Tooltip> : buttonContent;
};

export const ButtonRef = React.forwardRef((props, forwardedRef) => {
    return (
        <Button {...props} forwardedRef={forwardedRef} />
    );
});

export function ButtonsGroupMenu(props) {
    const {
        variant,
        size = 'xs',
        rounded = true,
        ...rest
    } = props;

    const _variant = variant || appSetting('layout', 'button_style_for_actions');

    return (
        <ButtonsGroup 
            fullWidth={true}  
            variant={_variant} 
            size={size} 
            rounded={rounded}
            {...rest}
        >
            {props.children}
        </ButtonsGroup>
    )
}

export function ButtonMenuGroupItem(props) {
    const {
        variant,
        size = 'sm',
        rounded = true,
        pressed = false,
        disabled = false,
        fullWidth= false,
        ...rest
    } = props;

    return (
        <Button 
            variant={'group-item' + (!!variant ? '-' + variant : '')} 
            size={size} 
            rounded={rounded} 
            pressed={pressed}
            disabled={disabled}
            fullWidth = {!!variant && variant == 'none' ? 'true' : fullWidth}
            {...rest}
        >
            {props.children}
        </Button>
    );
}

export function ButtonMenuActionDefault(props) {
    return _ButtonMenuAction(props)
}

export function ButtonMenuActionText(props) {
    const { text = 'text', ...rest } = props;
    return _ButtonMenuAction({ ...rest, text }); 
}

export function ButtonMenuCounterDefault(props) {
    return _ButtonMenuCounter(props)
}

export function ButtonMenuCounterText(props) {
    return _ButtonMenuCounter(props)
}

function _ButtonMenuAction(props) {
    const {
        variant,
        size = 'sm',
        rounded = true,
        pressed = false,
        disabled = false,
        fullWidth= false,
        ...rest
    } = props;
    const _variant = variant || appSetting('layout', 'button_style_for_actions');
    return <Button 
        variant={_variant} 
        size={size} 
        rounded = {rounded}
        pressed = {pressed}
        disabled = {disabled}
        fullWidth = {fullWidth}
        {...rest}
    />
}

function _ButtonMenuCounter(props) {
    const {
        variant,
        size = 'sm',
        rounded = true,
        pressed = false,
        disabled = false,
        fullWidth= false,
        ...rest
    } = props;
    const _variant = variant || appSetting('layout', 'button_style_for_actions');

    return <Button 
        variant={_variant}
        size = {size}
        rounded = {rounded}
        pressed = {pressed}
        disabled = {disabled}
        fullWidth = {fullWidth}
        {...rest}
    />
}