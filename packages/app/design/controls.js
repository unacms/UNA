import React, { useMemo, forwardRef } from 'react';
import { TextInput as TextInputDef, Modal as ModalDef, Platform, Switch as SwitchDef } from 'react-native'
import { Pressable, View, ScrollView, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon'
import { appSetting, isEmoji, LAYOUT_BREAKPOINTS } from 'app/lib/util'
import { Picker as PickerDef } from '@react-native-picker/picker';
import { Theme } from 'app/design/theme';
import Tooltip from 'app/ui/atoms/tooltip';
import { useWindowDimensions } from 'react-native';
import Loading from 'app/ui/atoms/loading'
import { RemoveScroll } from 'react-remove-scroll';

/* inputs */
const inputSettings = appSetting('theme', 'inputs');

export const TextInputClear = TextInputDef

export const Input = ({ className, ...props }) => (
    <TextInputDef className={inputSettings.default} {...props} />
);

export const InputRef = forwardRef(({ className, ...props }, ref) => (
    <TextInputDef className={inputSettings.default} {...props} />
));

export const InputMulti = ({ className, ...props }) => (
    <TextInputDef className={inputSettings.multi} {...props} />
);

export const InputRounded = ({ className, ...props }) => (
    <TextInputDef className={inputSettings.rounded} {...props} />
);

export const InputRoundedRef = forwardRef(({ className, ...props }, ref) => (
    <TextInputDef className={inputSettings.rounded} ref={ref} {...props}  />
));

export const InputRoundedSmall = ({ className, ...props }) => (
    <TextInputDef className={inputSettings.roundedsmall} ref={ref} {...props} />
);

export const InputSmall = ({ className, ...props }) => (
    <TextInputDef className={inputSettings.small} {...props} />
);

export const Hidden = ({ className, ...props }) => (
    <TextInputDef className={'hidden'} {...props} />
);

export const Switch = (props) => Platform.OS == 'web' ? <View className="w-16 h-8 pl-2 pt-1.5"><SwitchDef {...props} style={{
    ...(props.size != 'sm' ? { transform: [{ scaleX: 1.4 }, { scaleY: 1.4 }] } : {}),
    ...props.style
  }} /></View> : <SwitchDef {...props} style={props.style} />;


const PickerStyles = ' appearance-none bg-bgrinput  border border-bdrinput dark:border-bdrinput-d focus:bg-bgrinput-focus focus:outline-none  focus:border-bdrinput-focus dark:focus:border-bdrinput-df  text-neutral-900 rounded-lg  flex-auto px-3 py-2 dark:bg-bgrinput-d dark:focus:bg-bgrinput-dafocus dark:text-neutral-100 text-base '
export const PickerStyled = ({ className, ...props }) => (
    <PickerDef className={PickerStyles} {...props} />
);

export const PickerStyledRef = forwardRef(({ className, ...props }, ref) => (
    <PickerDef ref={ref} className={PickerStyles} {...props} />
  ));

export const PickerStyledIos = ({ className, ...props }) => (
    <PickerDef className={PickerStyles} {...props} />
);

const modalSettings = appSetting('theme', 'modal');

export function Modal({
    animation = 'fade',
    position = 'center',
    onClose,
    outerClickClose = true,
    onVisible,
    title,
    textAlign = 'center',
    headerBorder = true,
    fullWidth = true,
    children,
    padding = " p-3 sm:p-4 sm:pt-0  ",
    scrollable = false
}) {
    const { width, height } = useWindowDimensions();
    const offset = (title || onClose  ? (width > LAYOUT_BREAKPOINTS.md ? 100 : 68)  : 0);
    const styles = { maxHeight: height - offset };
    const isWeb = Platform.OS === 'web';

    const isOuterClose = (onClose !== 'undefined' && outerClickClose !== false);
    const Wrapper = isOuterClose ? Pressable : View;
    const positionClasses = {
        'top': 'items-start py-8 px-4',
        'bottom': 'items-end py-8 px-4',
        'center': 'sm:items-center items-start sm:p-4',
    };

    const sClassPosition = positionClasses[position] || positionClasses['center'];

    const align = !title && onClose ? 'end' : textAlign;

    const type = typeof title;

    const Cnt = scrollable ? ScrollView : View

    const layoutShift = isWeb ? 'sm' : '2xl';

    const Content = <View className={`flex-row justify-center left-0 right-0 z-50 w-full overflow-x-hidden overflow-y-auto ${layoutShift}:inset-0 h-modal h-full ${sClassPosition}`}>
    <View className={`w-full ${fullWidth ? '' : `${layoutShift}:w-auto`} relative h-full ${modalSettings.container.replaceAll("{ls}", layoutShift)} `}>
        <View className={`relative h-full ${modalSettings.content.replaceAll("{ls}", layoutShift)}`}>
            {
                (title || onClose) && <Row className={`items-center justify-${align} ${headerBorder && modalSettings.header}  ${layoutShift}:px-4 ${layoutShift}:pt-4`}>
                    {(title && type === 'string') && (
                        <View className='flex-auto absolute left-0 right-0'>
                            <Text className='text-neutral-800 dark:text-neutral-200 text-2xl font-bold tracking-tight text-center '>{title}</Text>
                        </View>
                    )}
                    {(title && type !== 'string') && (title)}
                    {onClose && (
                        <View className='ml-auto'>
                            <Button variant='secondary' size='base' rounded startDecorator='X' onPress={onClose} />
                        </View>
                    )}
                </Row>
            }
            <Cnt style={styles} className={`${padding} overflow-y-auto flex-auto ${layoutShift}:h-auto `}>{children}</Cnt>
        </View>
    </View>
</View>

    return (
        <ModalDef visible={onVisible} presentationStyle={'pageSheet'} animationType={animation} transparent={isWeb}>
            <Wrapper className={`pointerEvents cursor-default flex justify-end w-full h-full ${modalSettings.fog}`} {...(isOuterClose && { onPress: onClose })}>
               {isWeb ? <RemoveScroll className='flex-1'>{Content}</RemoveScroll> : Content}
            </Wrapper>

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
        sClassText = sClassText.replace('text-lg', ' text-3xl text-center leading-[32px]  ');
        sClassText = sClassText.replace('text-base', ' group-hover:no-underline text-2xl leading-[26px] ');
        sClassText = sClassText.replace('text-sm', ' group-hover:no-underline text-[21px] leading-[24px] text-center justify-center ');
        sClassText = sClassText.replace('text-xs', ' group-hover:no-underline text-[16px] leading-[20px] text-center justify-center');
        return (
            <Text key={iIndex} className={classIconName ? classIconName : sClassText + sIconContainer}>{sIcon}</Text>
        );
    }
    return (
        <Icon key={iIndex} className={classIconName ? classIconName : sClassText + sIconContainer} size={iIconSize} color={colorIcon} icon={sIcon}></Icon>
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
            sButtonAddonBg = ' bg-contrast dark:bg-contrast-d';
    }
    else {
        sButtonAddonText = addon;
    }

    const position = addon?.position == 'bottom' ? 'bottom-0' : '-top-2';

    if (!isTitle && sButtonAddonText)
        return <View className={`absolute ${sButtonAddonBg} border-2 border-white dark:border-neutral-900 rounded-full  px-1.5 items-center justify-center -right-1 ${position}`}><Text className='text-white text-xs font-semibold'>{sButtonAddonText}</Text></View>

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
        children,
        ...rest
    } = props;

    const isIcon = !!startDecorator || !!endDecorator;

    const { colors } = Theme();
    const { width } = useWindowDimensions();
    const showTooltip = useMemo(() => width >= LAYOUT_BREAKPOINTS.lg && tooltip, [width, tooltip]);

    const colorIcon = useMemo(() => {
        if (variant === 'link') return colors.primary;
        if (variant === 'primary') return 'rgb(243, 244, 246)';
        return '';
    }, [variant, colors]);

  

    const sClassContainer = useMemo(() => {
        let classes = '  flex-row items-center ';
        classes += fullWidth ? ' flex-auto w-full ' : ' w-fit ';
        if (disabled) classes += 'opacity-50 ';
        if (variant !== 'custom') {
            classes += (solid ? '' : ThemeCssClassesButton[`u-btn-${variant}-trans`]) +ThemeCssClassesButton[`u-btn-${variant}-cnt`]+ '  ';
        } else {
            classes += className;
        }
        if (bgColor){
            classes = classes.replaceAll(/bg-\S+/g, '').replaceAll(/ring-\S+/g, '') + ` ${bgColor} `;
        }
        if (variant === 'group-item-none') {
            classes += 'justify-start ';
        } else {
            classes += `justify-${align} `;
        }
        if (pressed) {
            classes= classes.replace(/\b(bg-[^\s]*)\b|\b(dark:bg-[^\s]*)\b/g, "").replace(/\s+/g, " ").trim();
            classes += ` ${pressedClasses?.pressed_container || ThemeCssClassesButton[`u-btn-${variant}-pressed-cnt`] || ThemeButtonSizes.pressed_container} `;
        }
        return classes;
    }, [fullWidth, disabled, variant, solid, ThemeCssClassesButton, className, align, pressed, bgColor, pressedClasses]);

    const sClassText = useMemo(() => {
        let classes = ' whitespace-nowrap text-ellipsis overflow-hidden tracking-tight';
        if (variant !== 'custom') {
            classes += ThemeCssClassesButton[`u-btn-${variant}-text`];
        } else {
            classes += ` ${classTextName}`;
        }
        if (textColor){
            classes = classes.replaceAll(/text-\S+/g, '') + ` ${textColor} `;
        }
        if (pressed) {
            classes += ` ${pressedClasses?.pressed_text || ThemeCssClassesButton[`u-btn-${variant}-pressed-text`] || ThemeButtonSizes.pressed_text} `;
            
        }
        classes += ' text-' + size + ' ';
        return classes;
    }, [variant, ThemeCssClassesButton, classTextName, pressed, size, pressedClasses]);

    const { sIconContainer, iIconSize, sTitleContainer, sizeClasses } = useMemo(() => {
        const titleVisible = !isIcon || !isNaN(title) || showTitleFromSize == '';
        let iconSize = 24;
        let iconContainerClass = '';
        let titleContainerClass = titleVisible ? '' : ' hidden ' + (showTitleFromSize ? showTitleFromSize : 'sm') + ':block ';
        let sizeClasses = '';

        const sClassDefaultRounding = !variant.startsWith('group-item') ? ThemeButtonSizes[size]?.rounded : '';
        const sClassFullRounding = !variant.startsWith('group-item') ? 'rounded-full' : '';
        const roundingClass = rounded ? sClassFullRounding : sClassDefaultRounding;

        if (variant != 'custom') {
            sizeClasses = `${roundingClass} ${padding || ThemeButtonSizes[size]?.padding} `;
            iconContainerClass = `${ThemeButtonSizes[size]?.icon_sizes} ${title ? ThemeButtonSizes[size]?.icon_margin : ''}`;
            iconSize = ThemeButtonSizes[size]?.icon_size;
            titleContainerClass += title ? ThemeButtonSizes[size]?.min_height + ThemeButtonSizes[size]?.margin : '';
        }
        return {
            sIconContainer: iconContainerClass,
            iIconSize: iconSize,
            sTitleContainer: titleContainerClass,
            sizeClasses,
        };
    }, [size, rounded, padding, variant, title, isIcon, showTitleFromSize]);

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

    const Cnt = onPress && !disabled ? Pressable : View;
    const refProps = forwardedRef ? { ref: forwardedRef } : {};

  

    const buttonAttributes = onPress && !disabled  ?{
        ...(rest.alt ? { 
            'aria-label': rest.alt,
            alt: rest.alt 
        } : {}),
        role: rest['aria-haspopup'] === 'menu' ? 'menubutton' : 'button',
    } : {};
    const buttonContent = (
        <>
            <Cnt
                className={`${sClassContainer} ${sizeClasses}`}
                {...rest}
                {...buttonAttributes}
                onPress={onPress && !disabled ? onPress : undefined}
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
            </Cnt>
            {!isTitle && oButtonAddon}
        </>
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