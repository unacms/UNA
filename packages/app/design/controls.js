import React, { useMemo, forwardRef } from 'react';
import { TextInput as TextInputDef, Modal as ModalDef, Platform } from 'react-native'
import SwitchDef from 'app/ui/atoms/switcher'
import { Pressable, View, ScrollView, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'
import { appSetting, isEmoji, LAYOUT_BREAKPOINTS } from 'app/lib/util'
import { Picker as PickerDef } from '@react-native-picker/picker';
import { Theme, ThemeName } from 'app/design/theme';
import Tooltip from 'app/ui/atoms/tooltip';
import { useWindowDimensions } from 'react-native';
import Loading from 'app/ui/atoms/loading'
import { RemoveScroll } from 'react-remove-scroll';
import { useSafeAreaInsets } from 'app/lib/hooks/router'
/* inputs */
const inputSettings = appSetting('theme', 'inputs');

export const TextInputClear = TextInputDef

export const Input = ({ className, startDecorator, endDecorator, ...props }) => (
    <Row className="items-center flex-auto">
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
    <Row className=" items-center flex-auto">
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

export const InputMulti = forwardRef(({ className, startDecorator, endDecorator, ...props }, ref) => (
     <Row className=" items-center flex-auto">
        {startDecorator && (
            <View className="absolute left-3.5 h-full items-center justify-center">
                <Icon icon={startDecorator} size={24} className="text-neutral-700 dark:text-neutral-300" />
            </View>
        )}
        <TextInputDef className={`${className} ${inputSettings.multi} ${startDecorator ? 'pl-12' : ''} ${endDecorator ? 'pr-11' : ''}`} ref={ref} {...props} />
        {endDecorator && (
            <View className="absolute right-3 items-center justify-center">
                <Icon icon={endDecorator} size={24} className="text-neutral-700 dark:text-neutral-300" />
            </View>
        )}
    </Row>
));

export const InputRounded = ({ className, startDecorator, endDecorator, ...props }) => (
    <Row className=" items-center flex-auto">
        {startDecorator && (
            <View className="absolute left-3.5 h-full items-center justify-center">
                <Icon icon={startDecorator} size={24} className="text-neutral-700 dark:text-neutral-300" />
            </View>
        )}
        <TextInputDef className={`${className} ${inputSettings.rounded} ${startDecorator ? 'pl-12' : ''} ${endDecorator ? 'pr-11' : ''}`} {...props} />
        {endDecorator && (
            <View className="absolute right-2.5 h-full items-center justify-center">
                <Icon icon={endDecorator} size={24} className="text-neutral-700 dark:text-neutral-300" />
            </View>
        )}
    </Row>
);

export const InputRoundedRef = forwardRef(({ className, startDecorator, endDecorator, ...props }, ref) => (
    <Row className="items-center flex-auto">
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
    <Row className="items-center flex-auto">
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
    <Row className="items-center">
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
export const Switch = SwitchDef

const PickerStyles = inputSettings.select;

export const PickerStyled = ({ className, ...props }) => (
    <PickerDef className={PickerStyles} {...props} />
);

export const PickerStyledRef = forwardRef(({ classes, className, ...props }, ref) => (
    <View className="relative flex-auto items-center flex-row">
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
    const { width, height } = useWindowDimensions();
    const offset = (title || onClose  ? (width > LAYOUT_BREAKPOINTS.md ? 100 : 68)  : 0);

    if (!animation){
        animation = width > LAYOUT_BREAKPOINTS.md ? 'fade' : 'slide';
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
                            <Text className='text-xl sm:text-2xl text-center leading-[none] tracking-tight font-semibold text-neutral-800 dark:text-neutral-200 '>{title}</Text>
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
            <Cnt style={styles} className={`${padding}  flex-auto h-full `}>{children}</Cnt>{/*overflow-y-auto*/}
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
    let sClassContainer = 'group';
    sClassContainer += fullWidth ? ' flex-auto' : ' w-fit m-0 truncate';

    
    sClassContainer += ThemeCssClassesButtonGroups['u-btn-' + variant + '-cnt'] ? ThemeCssClassesButtonGroups['u-btn-' + variant + '-cnt'] + ' ' : ' ';
    sClassContainer += rounded ? 'rounded-full ' : 'rounded-lg ';
    sClassContainer += className;

    const bTextContainer = !!variant && variant == 'text';

    const aChildren = children.map((child, iIndex) => {
        const { variant, size, fullWidth, ...restChild } = child.props;
        const isLastChild = iIndex < children.length - 1;
        const childClass = 'flex-auto ' + (isLastChild && !bTextContainer ? ' border-r border-bdr dark:border-bdr-d' : '');

        let childItem;
        if (child.type === Button) {
            childItem = <Button  showTitleFromSize={showTitleFromSize} variant={'group-item' + (!!variant ? '-' + variant : '')} size={size} fullWidth={fullWidth} {...restChild} />;
        } else {
            childItem = child;
        }

        return (
            <View key={iIndex} className={' ' + childClass}>
                {childItem}
            </View>
        );
    });

    return <View className={sClassContainer} {...rest}>{aChildren}</View>;
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
        <Icon key={iIndex+sIcon} className={classIconName ? classIconName : sClassText + sIconContainer} size={iIconSize} color={colorIcon} icon={sIcon}></Icon>
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
    let sButtonAddonBg = "bg-neutral-500 dark:bg-neutral-500";
    if (typeof addon === 'object') {
        sButtonAddonText = addon?.text;
        if (addon?.hideZero && sButtonAddonText == '0')
            return null;
        if (addon?.variant == 'primary')
            sButtonAddonBg = ' bg-pop dark:bg-pop-d';
    }
    else {
        sButtonAddonText = addon;
    }

    const position = addon?.position == 'bottom' ? 'bottom-0' : 'top-0 end-0';

    if (!isTitle && sButtonAddonText)
        return <View className={`absolute ${sButtonAddonBg} shadow-sm rounded-full px-1.5 items-center justify-center ${position}`}><Text className='text-white text-sm font-medium'>{sButtonAddonText}</Text></View>

    return sButtonAddonText && sButtonAddonText ? <View className='flex-1 items-end '>
        <View className={sButtonAddonBg + ' rounded-full px-2 py-0.5 mx-1 text-center items-center'}>
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
        ring,
        children,
        ...rest
    } = props;

    const { colors } = Theme();
    const themeName = ThemeName();
    const { width } = useWindowDimensions();
    const ringClass = useMemo(() => {
        if (ring === true) {
            return ThemeButtonSizes.default_ring ?? '';
        }
        if (typeof ring === 'string') {
            return ring;
        }
        return '';
    }, [ring]);
    const showTooltip = useMemo(() => width >= LAYOUT_BREAKPOINTS.lg && tooltip, [width, tooltip]);

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
            classes += fullWidth ? ' flex-auto w-full' : ' flex-none';
        } else {
            // Fallback to original behavior
            classes += fullWidth ? ' flex-auto w-full' : ' w-fit';
        }
        
        if (disabled) classes += ' opacity-50';
        if (variant !== 'custom') {
            classes += (solid ? '' : ' ' + ThemeCssClassesButton[`u-btn-${variant}-trans`]) + ' ' + ThemeCssClassesButton[`u-btn-${variant}-cnt`];
        } else {
            classes += ' ' + className;
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
        let classes = 'whitespace-nowrap text-ellipsis overflow-hidden tracking-tight';
        if (variant !== 'custom') {
            classes += ' ' + ThemeCssClassesButton[`u-btn-${variant}-text`];
        } else {
            classes += ` ${classTextName}`;
        }
        if (textColor){
            classes = classes.replaceAll(/text-\S+/g, '') + ` ${textColor}`;
        }
        if (pressed) {
            classes += ` ${pressedClasses?.pressed_text || ThemeCssClassesButton[`u-btn-${variant}-pressed-text`] || ThemeButtonSizes.pressed_text}`;
        }
        classes += ` text-${size}`;
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
            
            sizeClasses = `${roundingClass} ${padding || paddingClass}`;
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

    const Cnt = onPress && !disabled /*&& !isWeb*/ ? Pressable : View;
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
            className={`${ringClass} ${fullWidth ? 'flex-auto ' : ''}`}
            {...rest}
            {...buttonAttributes}
            onPress={onPress && !disabled ? onPress : undefined}
            {...refProps}
        >
            <View className={`${sClassContainer} ${sizeClasses}`}>
                {sButtonIconStart}
                {isTitle && (
                    <Text className={`${sClassText} ${sTitleContainer}`} numberOfLines={1}>
                        {title}
                    </Text>
                )}
                {sButtonIconEnd}
                {isTitle && oButtonAddon}
                {children}
            </View>
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
        ring,
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
        ring={ring}
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
        ring,
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
        ring={ring}
        {...rest}
    />
}