import React, { memo, useMemo, useEffect } from 'react';
import { TextInput as TextInputDef, Modal as ModalDef, Platform, Switch as SwitchDef } from 'react-native'
import { Pressable, View, ScrollView, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { styled } from 'nativewind'
import { Icon } from 'app/ui/atoms/icon'
import { appSetting, isEmoji, LAYOUT_BREAKPOINTS } from 'app/lib/util'
import { Picker as PickerDef } from '@react-native-picker/picker';
import { Theme } from 'app/design/theme';
import Tooltip from 'app/ui/atoms/tooltip';
import { useWindowDimensions } from 'react-native';
import Loading from 'app/ui/atoms/loading'
import { RemoveScroll } from 'react-remove-scroll';

let h11 = '';
if (Platform.OS === 'android') {
    h11 = ' h-11'
}

//import { Dropdown as DropdownDef} from 'react-native-element-dropdown';

/* inputs */
export const Input = styled(TextInputDef, ' bg-bgrinput dark:bg-bgrinput-d focus:bg-bgrinput-f dark:focus:bg-bgrinput-df border border-bdrinput dark:border-bdrinput-d focus:outline-none focus:outline-primary dark:focus-outline-primary-d placeholder-neutral-500 duration-100 text-neutral-900 rounded-lg flex-auto px-3  dark:text-neutral-100 text-base leading-5 h-11 ')
export const InputMulti = styled(TextInputDef, ' placeholder-neutral-500 bg-bgrinput dark:bg-bgrinput-d border border-bdrinput dark:border-bdrinput-d focus:bg-bgrinput-f focus:outline-none  focus:border-bdrinput-f dark:focus:border-bdrinput-df  text-neutral-900 rounded-lg flex-auto p-2 dark:focus:bg-bgrinput-df   dark:text-neutral-100 text-base leading-5 ')
export const InputRounded = styled(TextInputDef, ' placeholder-neutral-500 bg-bgritem dark:bg-bgritem-d focus:bg-bgrinput-f dark:focus:bg-bgrinput-df border border-transparent focus:border-bdrinput dark:focus:border-bdrinput-d focus:outline-none focus:outline-primary dark:focus-outline-primary-d duration-100 text-neutral-900 rounded-full flex-auto px-3 dark:text-neutral-100 text-base leading-5 h-11  ')
export const InputRoundedSmall = styled(TextInputDef, ' placeholder-neutral-500 bg-bgrinput dark:bg-bgrinput-d border border-bdrinput dark:border-bdrinput-d focus:bg-bgrinput-f focus:outline-none  focus:border-bdrinput-f dark:focus:border-bdrinput-df  text-neutral-900 rounded-full flex-auto px-3 dark:focus:bg-bgrinput-df   dark:text-neutral-100 text-base leading-5 h-[34px] ')
export const InputSmall = styled(TextInputDef, ' placeholder-neutral-500 bg-bgrinput dark:bg-bgrinput-d border border-bdrinput dark:border-bdrinput-d focus:bg-bgrinput-f focus:outline-none  focus:border-bdrinput-f dark:focus:border-bdrinput-df  text-neutral-900 rounded-lg flex-auto px-3 dark:focus:bg-bgrinput-df   dark:text-neutral-100 text-base leading-5 h-[36px] ')

export const Switch = (props) => Platform.OS == 'web' ? <View className="w-16 h-8 pl-2 pt-1.5"><SwitchDef {...props} style={{
    ...(props.size != 'sm' ? { transform: [{ scaleX: 1.4 }, { scaleY: 1.4 }] } : {}),
    ...props.style
  }} /></View> : <SwitchDef {...props} style={props.style} />;
export const Hidden = styled(TextInputDef, 'hidden')
//export const Dropdown = styled(DropdownDef, ' bg-bgrinput  border border-bdrinput dark:border-bdrinput-d focus:bg-bgrinput-focus focus:outline-none  focus:border-bdrinput-focus dark:focus:border-bdrinput-df  text-neutral-900 rounded-lg   w-full p-2 dark:bg-bgrinput-d dark:focus:bg-bgrinput-dafocus   dark:text-neutral-100 text-base leading-5 h-[40px]')

const PickerStyles = ' appearance-none bg-bgrinput  border border-bdrinput dark:border-bdrinput-d focus:bg-bgrinput-focus focus:outline-none  focus:border-bdrinput-focus dark:focus:border-bdrinput-df  text-neutral-900 rounded-lg  flex-auto px-3 py-2 dark:bg-bgrinput-d dark:focus:bg-bgrinput-dafocus   dark:text-neutral-100 text-base '
export const PickerStyled = styled(PickerDef, PickerStyles + ' ')
export const PickerStyledIos = styled(PickerDef, PickerStyles)

/* modal */
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
    padding = " px-4 py-2 ",
    scrollable = false
}) {
    const { width, height } = useWindowDimensions();
    const isWeb = Platform.OS === 'web';
    const styles = width > LAYOUT_BREAKPOINTS.md && !isWeb ? { maxHeight: height - 100 } : {};
    const isOuterClose = (onClose !== 'undefined' && outerClickClose !== false);
    const Wrapper = isOuterClose ? Pressable : View;

    const layoutShift = isWeb ? 'sm' : '2xl';
    const layoutShift2 = isWeb ? 'sm' : '2xl';// may be need to fix

    const positionClasses = {
        'top': 'items-start py-8 px-4',
        'bottom': 'items-end py-8 px-4',
        'center': `sm:items-center items-start ${layoutShift}:p-4`,
    };

    const sClassPosition = positionClasses[position] || positionClasses['center'];

    const align = !title && onClose ? 'end' : textAlign;

    const type = typeof title;

    const Cnt = scrollable ? ScrollView : View

    const Content = <View className={`flex-row justify-center left-0 right-0 z-50 w-full overflow-x-hidden overflow-y-auto ${layoutShift2}:inset-0 h-modal h-full ${sClassPosition}`}>
    <View className={`w-full ${fullWidth ? '' : 'sm:w-auto'} relative h-full ${isWeb && 'max-w-2xl'} ${layoutShift2}:h-auto `}>
        <Pressable onPress={() => { }} className={`relative bg-bgrmodal dark:bg-bgrmodal-d h-full ${layoutShift2}:h-auto ${layoutShift}:border ${layoutShift}:border-bdrmodal ${layoutShift}:dark:border-bdrmodal-d ${layoutShift}:rounded-2xl ${layoutShift}:shadow-sm`}>
            {
                (title || onClose) && <Row className={`items-center justify-${align} ${headerBorder ? ' border-b border-bdr dark:border-bdr-d ' : ''} px-1 py-2.5 ${layoutShift}:p-4 ${layoutShift}:py-3`}>
                    {(title && type === 'string') && (
                        <View className='flex-auto pl-1'>
                            <Text className='text-neutral-700 dark:text-neutral-200 text-xl font-bold '>{title}</Text>
                        </View>
                    )}
                    {(title && type !== 'string') && (title)}
                    {onClose && (
                        <View className=''>
                            <Button variant='text' size='sm' rounded startDecorator='X' onPress={onClose} />
                        </View>
                    )}
                </Row>
            }
            <Cnt style={styles} className={`${padding} overflow-y-auto flex-auto ${layoutShift2}:h-auto justify-center`}>{children}</Cnt>
        </Pressable>
    </View>
</View>

    return (
        <ModalDef visible={onVisible} presentationStyle={'pageSheet'} animationType={animation} transparent={isWeb}>

            <Wrapper className="pointerEvents flex justify-end w-full h-full bg-white/80 dark:bg-black/80 backdrop-blur" {...(isOuterClose && { onPress: onClose })}>
               {isWeb ? <RemoveScroll className='flex-1'>{Content}</RemoveScroll> : Content}
            </Wrapper>

        </ModalDef>
    );
}

/* buttons */
export function MenuButton(props) {
    return <Button>TODO</Button>
}

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

    const ThemeCssClasses = appSetting('theme', 'buttons_group_styles');
    sClassContainer += ThemeCssClasses['u-btn-' + variant + '-cnt'] ? ThemeCssClasses['u-btn-' + variant + '-cnt'] + ' ' : ' ';
    sClassContainer += rounded ? 'rounded-full ' : 'rounded-lg ';
    sClassContainer += className;

    const bTextContainer = !!variant && variant == 'text';

    const aChildren = children.map((child, iIndex) => {
        const { variant, size, fullWidth, ...restChild } = child.props;
        const isLastChild = iIndex < children.length - 1;
        const childClass = 'flex-auto ' + (isLastChild ? ' border-none border-bdr dark:border-bdr-d' : '');

        let childItem;
        if (child.type === Button) {
            childItem = <Button showTitleFromSize={showTitleFromSize} variant={'group-item' + ((!!variant && variant == 'text') || bTextContainer ? '-text' : '')} size={size} fullWidth={fullWidth} {...restChild} />;
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
        sClassText = sClassText.replace('text-lg', 'text-[32px] leading-[32px]  ');
        sClassText = sClassText.replace('text-base', 'text-[24px] leading-[24px]');
        sClassText = sClassText.replace('text-sm', 'text-[20px]  leading-[20px]');
        sClassText = sClassText.replace('text-xs', 'text-[16px] leading-[16px]');
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

const getAddon = (addon) => {
    let sButtonAddonText = "";
    let sButtonAddonBg = "bg-neutral-500 dark:bg-neutral-500";
    if (typeof addon === 'object') {
        sButtonAddonText = addon?.text;
        if (addon?.variant == 'primary')
            sButtonAddonBg = 'bg-contrast dark:bg-contrast-d';
    }
    else {
        sButtonAddonText = addon;
    }

    return sButtonAddonText && sButtonAddonText != '' ? <View className='flex-1 items-end '>
        <View className={sButtonAddonBg + ' rounded-full px-2 py-0.5 mx-1 text-center items-center'}>
            <Text className="text-white text-xs font-semibold">{sButtonAddonText}</Text></View></View> : null;
}

export const Button = (props) => {
    const {
        className = '',
        classTextName = '',
        classIconName = '',
        bgColor = '',
        textColor = '',
        onPress,
        forwardedRef,
        variant = 'default',
        size = 'base',
        showTitleFromSize = '',
        tooltip = false,
        pressed = false,
        disabled = false,
        startDecorator = '',
        endDecorator = '',
        align = 'center',
        fullWidth = false,
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

    const ThemeCssClasses = useMemo(() => appSetting('theme', 'button_styles'), []);

    const sClassContainer = useMemo(() => {
        let classes = 'group relative flex-row items-center ';
        classes += fullWidth ? 'flex-auto w-full ' : ' truncate w-fit ';
        if (disabled) classes += 'opacity-50 ';
        if (variant !== 'custom') {
            classes +=
                (solid ? '' : ThemeCssClasses[`u-btn-${variant}-trans`]) +
                ThemeCssClasses[`u-btn-${variant}-cnt`];
        } else {
            classes += className;
        }
        if (bgColor){
            classes = classes.replaceAll(/bg-\S+/g, '').replaceAll(/ring-\S+/g, '') + ` ${bgColor} `;
        }
        if (variant === 'none') {
            classes += 'justify-start ';
        } else {
            classes += `justify-${align} `;
        }
        if (pressed) {
            classes += ' bg-primary/10 dark:bg-primary-d/10 hover:bg-primary/20 dark:hover:bg-primary-d/20 ';
        }
        return classes;
    }, [fullWidth, disabled, variant, solid, ThemeCssClasses, className, align, pressed, bgColor]);

    const sClassText = useMemo(() => {
        let classes = 'whitespace-nowrap text-ellipsis overflow-hidden tracking-tight';
        if (variant !== 'custom') {
            classes += ThemeCssClasses[`u-btn-${variant}-text`];
        } else {
            classes += ` ${classTextName}`;
        }
        if (textColor){
            classes = classes.replaceAll(/text-\S+/g, '') + ` ${textColor} `;
        }
        if (pressed) {
            classes += ' text-primary-700 dark:text-primary-600 group-hover:text-primary-800 dark:group-hover:text-primary-500';
        }
        classes += ' text-' + size + ' ';
        return classes;
    }, [variant, ThemeCssClasses, classTextName, pressed, size]);

    const { sIconContainer, iIconSize, sTitleContainer, sizeClasses } = useMemo(() => {
        const titleVisible = !isIcon || !isNaN(title) || showTitleFromSize == '';
        let iconSize = 24;
        let iconContainerClass = '';
        let titleContainerClass = titleVisible ? '' : ' hidden ' + (showTitleFromSize ? showTitleFromSize : 'sm') + ':block ';
        let sizeClasses = '';

        const sClassDefaultRounding = variant !== 'group-item' ? `rounded-${size === 'lg' ? 'xl' : 'lg'}` : '';
        const sClassFullRounding = variant !== 'group-item' ? 'rounded-full' : '';
        const roundingClass = rounded ? sClassFullRounding : sClassDefaultRounding;

        if (variant != 'custom') {
            switch (size) {
                case 'xs':
                    sizeClasses = `${roundingClass} p-1.5`;
                    iconContainerClass = `h-4 w-4 ${title ? 'mx-[1px]' : ''}`;
                    iconSize = 16;
                    titleContainerClass += title ? 'mx-1 ' : '';
                    break;
                case 'sm':
                    sizeClasses = `${roundingClass} p-2 `;
                    iconContainerClass = `h-5 w-5 ${title ? '' : ''}`;
                    iconSize = 20;
                    titleContainerClass += title ? 'mx-2 ' : '';
                    break;
                case 'base':
                    sizeClasses = `lalal ${padding} ${roundingClass} ${padding ? `p-${padding}` : 'p-2.5'} `;
                    iconContainerClass = `h-6 w-6 ${title ? 'mx-1' : ''}`;
                    iconSize = 24;
                    titleContainerClass += title ? 'mx-2 ' : '';
                    break;
                case 'lg':
                    sizeClasses = `${roundingClass} ${padding ? `p-${padding}` : 'p-2.5'} `;
                    iconContainerClass = `h-8 w-8 ${title ? 'mx-1.5' : ''}`;
                    iconSize = 32;
                    titleContainerClass += title ? 'mx-1.5 ' : '';
                    break;
                default:
                    sizeClasses = `${roundingClass} ${padding ? `p-${padding}` : 'p-2.5'} `;
                    iconContainerClass = `h-6 w-6 ${title ? 'mx-1' : ''}`;
                    iconSize = 24;
                    titleContainerClass += title ? 'mx-2 ' : '';
            }
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

    const oButtonAddon = getAddon(addon);

    const Cnt = onPress && !disabled ? Pressable : View;
    const refProps = forwardedRef ? { ref: forwardedRef } : {};
    const buttonContent = (
        <Cnt
            className={`${sClassContainer} ${sizeClasses}`}
            {...rest}
            {...(rest.alt
                ? { 'aria-label': rest.alt, role: 'button', alt: rest.alt }
                : {})}
            onPress={onPress && !disabled ? onPress : undefined}
            {...refProps}
        >
            {sButtonIconStart}
            {title !== undefined && (
                <Text className={`${sClassText} ${sTitleContainer}`} numberOfLines={1}>
                    {title}
                </Text>
            )}
            {sButtonIconEnd}
            {oButtonAddon}
            {children}
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
    const { variant, size, rounded, showTitleFromSize, ...rest } = props

    return <ButtonsGroup fullWidth={true} showTitleFromSize={showTitleFromSize} variant={!!variant ? variant : appSetting('layout', 'button_style_for_actions')} size={!!size ? size : 'xs'} rounded={rounded != undefined ? rounded : true}>{props.children}</ButtonsGroup>
}

export function ButtonMenuGroupItem(props) {
    let { variant, size, title, startDecorator, endDecorator, onPress, pressed, rounded, fullWidth, disabled, showTitleFromSize, ...rest } = props
    let sVariant = 'group-item' + (!!variant && variant == 'text' ? '-text' : '');
    if (variant == 'none') {
        sVariant = 'none';
        fullWidth = 'true'
    }
    return (
        <Button variant={sVariant} showTitleFromSize={showTitleFromSize} size={!!size ? size : 'sm'} title={title} startDecorator={startDecorator} endDecorator={endDecorator} onPress={onPress} pressed={pressed != undefined ? pressed : false} rounded={rounded != undefined ? rounded : true} disabled={disabled != undefined ? disabled : false} fullWidth={fullWidth != undefined ? fullWidth : false}>
            {props.children}
        </Button>
    );
}

export function ButtonMenuActionDefault(props) {
    const { variant, size, title, startDecorator, endDecorator, onPress, pressed, rounded, fullWidth, disabled, showTitleFromSize, padding, classTextName, ...rest } = props
    return <Button variant={!!variant ? variant : appSetting('layout', 'button_style_for_actions')} size={!!size ? size : 'sm'} padding={padding} classTextName={classTextName} title={title} showTitleFromSize={showTitleFromSize} startDecorator={startDecorator} endDecorator={endDecorator} onPress={onPress} pressed={pressed != undefined ? pressed : false} rounded={rounded != undefined ? rounded : true} disabled={disabled != undefined ? disabled : false} fullWidth={fullWidth != undefined ? fullWidth : false} />
}

export function ButtonMenuActionText(props) {
    const { variant, size, title, startDecorator, endDecorator, onPress, pressed, rounded, fullWidth, disabled, showTitleFromSize, padding, classTextName, ...rest } = props
    return <Button variant={!!variant ? variant : 'text'} size={!!size ? size : 'sm'} title={title} showTitleFromSize={showTitleFromSize} padding={padding} classTextName={classTextName} startDecorator={startDecorator} endDecorator={endDecorator} onPress={onPress} pressed={pressed != undefined ? pressed : false} rounded={rounded != undefined ? rounded : true} disabled={disabled != undefined ? disabled : false} fullWidth={fullWidth != undefined ? fullWidth : false} />
}

export function ButtonMenuCounterDefault(props) {
    const { variant, size, title, startDecorator, endDecorator, onPress, pressed, rounded, fullWidth, disabled, showTitleFromSize, padding, classTextName, ...rest } = props
    return <Button variant={!!variant ? variant : appSetting('layout', 'button_style_for_actions')} size={!!size ? size : 'sm'} padding={padding} title={title} classTextName={classTextName} showTitleFromSize={showTitleFromSize} startDecorator={startDecorator} endDecorator={endDecorator} onPress={onPress} pressed={pressed != undefined ? pressed : false} rounded={rounded != undefined ? rounded : true} disabled={disabled != undefined ? disabled : false} fullWidth={fullWidth != undefined ? fullWidth : false} />
}

export function ButtonMenuCounterText(props) {
    const { variant, size, title, startDecorator, endDecorator, onPress, pressed, rounded, fullWidth, disabled, showTitleFromSize, padding, classTextName, ...rest } = props
    return <Button variant={!!variant ? variant : appSetting('layout', 'button_style_for_actions')} size={!!size ? size : 'sm'} padding={padding} title={title} classTextName={classTextName} showTitleFromSize={showTitleFromSize} startDecorator={startDecorator} endDecorator={endDecorator} onPress={onPress} pressed={pressed != undefined ? pressed : false} rounded={rounded != undefined ? rounded : true} disabled={disabled != undefined ? disabled : false} fullWidth={fullWidth != undefined ? fullWidth : false} />
}
