import React from 'react';
import { TextInput as TextInputDef, Modal as ModalDef, Platform, Switch as SwitchDef } from 'react-native'
import { Pressable, View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { styled } from 'nativewind'
import { Icon } from 'app/ui/atoms/icon'
import { appSetting, isEmoji } from 'app/lib/util'
import { Picker as PickerDef } from '@react-native-picker/picker';
import { Theme } from 'app/design/theme';
import Tooltip from 'app/ui/atoms/tooltip';
import { useWindowDimensions } from 'react-native';

let h11 = '';
if (Platform.OS === 'android') {
    h11 = ' h-11'
}

//import { Dropdown as DropdownDef} from 'react-native-element-dropdown';

/* inputs */
export const Input = styled(TextInputDef, ' bg-bgrinput dark:bg-bgrinput-d focus:bg-bgrinput-f dark:focus:bg-bgrinput-df border border-bdrinput dark:border-bdrinput-d focus:outline-none focus:outline-primary/50 dark:focus-outline-primary-d/50 duration-100 text-neutral-900 rounded-lg flex-auto     px-3   placeholder-neutral-500 dark:text-neutral-100 text-base leading-5 h-[46px] ')
export const InputMulti = styled(TextInputDef, ' bg-bgrinput dark:bg-bgrinput-d border border-bdrinput dark:border-bdrinput-d focus:bg-bgrinput-f focus:outline-none  focus:border-bdrinput-f dark:focus:border-bdrinput-df  text-neutral-900 rounded-lg flex-auto p-2 dark:focus:bg-bgrinput-df placeholder-neutral-500 dark:text-neutral-100 text-base leading-5 ')
export const InputRounded = styled(TextInputDef, ' bg-bgrinput dark:bg-bgrinput-d border border-bdrinput dark:border-bdrinput-d focus:bg-bgrinput-f focus:outline-none  focus:border-bdrinput-f dark:focus:border-bdrinput-df  text-neutral-900 rounded-full flex-auto px-3 dark:focus:bg-bgrinput-df placeholder-neutral-500 dark:text-neutral-100 text-base leading-5 h-[42px] ')

export const Switch = SwitchDef
export const Hidden = styled(TextInputDef, 'hidden')
//export const Dropdown = styled(DropdownDef, ' bg-bgrinput  border border-bdrinput dark:border-bdrinput-d focus:bg-bgrinput-focus focus:outline-none  focus:border-bdrinput-focus dark:focus:border-bdrinput-df  text-neutral-900 rounded-lg   w-full p-2 dark:bg-bgrinput-d dark:focus:bg-bgrinput-dafocus placeholder-neutral-500 dark:text-neutral-100 text-base leading-5 h-[42px]')

const PickerStyles = ' appearance-none bg-bgrinput  border border-bdrinput dark:border-bdrinput-d focus:bg-bgrinput-focus focus:outline-none  focus:border-bdrinput-focus dark:focus:border-bdrinput-df  text-neutral-900 rounded-lg  flex-auto   p-2 dark:bg-bgrinput-d dark:focus:bg-bgrinput-dafocus placeholder-neutral-500 dark:text-neutral-100 text-base leading-5 '
export const PickerStyled = styled(PickerDef, PickerStyles + ' ')
export const PickerStyledIos = styled(PickerDef, PickerStyles)


/* modal */
export function Modal({
    animation = 'fade',
    presentation = 'overFullScreen',
    transparent = true,
    position = 'center',
    onClose,
    outerClickClose = true,
    onVisible,
    title,
    textAlign = 'center',
    headerBorder = false,
    fullWidth = true,
    children
}) {
    const Wrapper = onClose && outerClickClose !== false ? Pressable : View;

    let sClassPosition = '';
    switch (position) {
        case 'top':
            sClassPosition = 'items-start py-8 px-4';
            break;

        case 'bottom':
            sClassPosition = 'items-end py-8 px-4';
            break;

        case 'center':
        default:
            sClassPosition = 'sm:items-center items-start sm:p-4';
            break;
    }

    return (
        <ModalDef visible={onVisible} presentationStyle={presentation} animationType={animation} transparent={transparent}>
            <Wrapper className="flex justify-end w-full h-full bg-white/80 dark:bg-black/80 backdrop-blur" {...(onClose && { onPress: onClose })}>
                <View className={'flex-row justify-center left-0 right-0 z-50 w-full overflow-x-hidden  overflow-y-auto md:inset-0 h-modal h-full ' + sClassPosition}>
                    <View className={(fullWidth ? 'w-full': '')+ " relative h-full max-w-2xl md:h-auto "}>
                        <Pressable onPress={() => { }} className={'relative bg-bgrmodal dark:bg-bgrmodal-d h-full md:h-auto  sm:border sm:border-bdrmodal sm:dark:border-bdrmodal-d sm:rounded-2xl sm:shadow-sm'}>
                          
                                <Row className={'items-center ' +  'justify-' +textAlign + '  '+ (headerBorder ? ' border-b border-bdrbutton dark:border-bdr ' : '') + 'pt-4 px-4'}>
                                    {title && <View>
                                        <Text className='text-neutral-700 dark:text-neutral-200 text-center text-xl font-bold '>{title}</Text>
                                    </View>}
                                </Row>
                                {(onClose) && <View className='mb-auto absolute top-2 right-2'>
                                    <Button variant='text' size='sm' rounded startDecorator='X' onPress={onClose} />
                                </View>}
                                
                                <View className=" overflow-y-auto px-4 py-2 flex-auto md:h-auto ">{children}</View>
                            
                        </Pressable>
                    </View>
                </View>
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
    rounded = false,
    children = [],
    ...rest
}) {
    let sClassContainer = ' group relative flex-row items-center  ';
    sClassContainer += fullWidth ? ' flex-auto' : ' w-fit m-0 truncate';

    let ThemeCssClasses = appSetting('theme', 'buttons_group_styles');
    sClassContainer += ThemeCssClasses['u-btn-' + variant + '-cnt'];
    sClassContainer += rounded ? 'rounded-full ' : 'rounded-lg ';
    sClassContainer += className;

    const aChildren = children.map((child, iIndex) => {
        const { variant, size, fullWidth, ...restChild } = child.props;
        const isLastChild = iIndex < children.length - 1;
        const childClass = isLastChild ? 'border-r border-bdrbutton dark:border-bdrbutton-d' : '';

        let childItem;
        if (child.type === Button) {
            childItem = <Button variant="group-item" size={size} fullWidth={fullWidth} {...restChild} />;
        } else {
            childItem = child;
        }

        return (
            <View key={iIndex} className={childClass}>
                {childItem}
            </View>
        );
    });

    return <View className={sClassContainer} {...rest}>{aChildren}</View>;
}

/* buttons */
export function Button(props) {
    let { className, classTextName, classIconName, onPress, forwardedRef, ...rest } = props
    let buttonType = props.variant ? props.variant : 'default'
    let buttonSize = props.size ? props.size : 'base'
    let hideTitleOnSmall = props.hideTitleOnSmall ? props.hideTitleOnSmall : false
    let buttonTooltip = props.tooltip ? props.tooltip : false
    let buttonPressed = props.pressed ? true : false
    let buttonDisabled = props.disabled ? true : false
    let buttonIconStart = props.startDecorator ? props.startDecorator : false
    let buttonIconEnd = props.endDecorator ? props.endDecorator : false
    let buttonAlign = props.align ? props.align : 'center'
    let buttonFull = props.fullWidth ? true : false
    let buttonTitle = props.title ? props.title : ''
    let buttonAddon = props.addon ? props.addon : ''
    let buttonRounded = props.rounded ? true : false
    let buttonSolid = props.solid ? true : false
    let isIcon = buttonIconStart || buttonIconEnd;
    let sTitleContainer = (hideTitleOnSmall && isIcon && isNaN(buttonTitle)) ? ' hidden sm:block ' : '';
    let iIconSize = 24

    let sClassContainer = ' group relative flex-row items-center '
    let sIconContainer = ' h-6 w-6 mr-2 '

    sClassContainer += buttonFull ? ' flex-auto w-full ' : ' w-fit m-0 truncate '

    if (buttonDisabled) sClassContainer += ' opacity-50 '

    let sClassText = ' whitespace-nowrap text-ellipsis overflow-hidden '

    let ThemeCssClasses = appSetting('theme', 'button_styles');

    if (buttonType != 'custom') {
        sClassContainer +=
            (buttonSolid ? '' : ThemeCssClasses['u-btn-' + buttonType + '-trans']) +
            ThemeCssClasses['u-btn-' + buttonType + '-cnt']
        sClassText += ThemeCssClasses['u-btn-' + buttonType + '-text']
    }
    else {
        sClassContainer += className
        sClassText += classTextName
    }

    sClassContainer += ' justify-' + buttonAlign + ' '

    if (buttonPressed) {
        sClassContainer += ' bg-primary/10 dark:bg-primary-d/10  ring-offset-1 ring-primary/50 dark:ring-primary-d/50 ';
        sClassText += ' text-primary-600 dark:text-primary-400 ';
    }

    const sClassDefaultRounding = buttonType != 'group-item' ? 'rounded-lg' : '';

    switch (buttonSize) {
        case 'xs':
            sClassContainer += buttonRounded ? ' rounded-full p-1 ' : sClassDefaultRounding + ' px-1 py-1 ';
            sIconContainer = ' h-4 w-4 ' + (buttonTitle !== '' ? ' mx-[1px] ' : '');
            sClassText += ' text-xs '
            iIconSize = 16;
            sTitleContainer += buttonTitle !== '' ? 'mx-1 ' : '' // Conditionally add 'mx-2' class
            break

        case 'sm':
            sClassContainer += buttonRounded ? ' rounded-full p-1.5 ' : sClassDefaultRounding + (buttonType != 'none' ? ' px-2 py-1.5 ' : ' ');
            sIconContainer = ' h-5 w-5 ' + (buttonTitle !== '' ? 'sm:mx-0.5 ' : '');
            sClassText += ' text-sm leading-5  '
            iIconSize = 20;
            sTitleContainer += buttonTitle !== '' ? ' mx-1.5  ' : '' // Conditionally add 'mx-2' class

            break

        case 'base':
            sClassContainer += buttonRounded ? ' rounded-full ' + (props.padding ? 'p-' + props.padding : 'p-2') : sClassDefaultRounding + ' px-3 py-2  ';
            sIconContainer = ' h-6 w-6  ' + (buttonTitle !== '' ? ' sm:mx-1 ' : '');
            sClassText += ' text-base leading-6  '
            iIconSize = 24;
            sTitleContainer += buttonTitle !== '' ? ' mx-2   ' : '' // Conditionally add 'mx-2' class

            break

        case 'lg':
            sClassContainer += buttonRounded ? ' rounded-full px-2.5 py-2 ' : ' rounded-xl px-2.5 py-2 ';
            sIconContainer = ' h-7 w-7 ' + (buttonTitle !== '' ? ' sm:mx-1 my-0.5 ' : ' mx-2 my-0.5 ');
            sClassText += ' mt-[1px] text-lg '
            iIconSize = 28;
            sTitleContainer += buttonTitle !== '' ? ' mx-2 ' : '' // Conditionally add 'mx-2' class

            break


    }
    const { colors } = Theme()
    const { width } = useWindowDimensions();
    if (width < 1024)
        buttonTooltip = false;
    let colorIcon = props.variant == 'link' ? colors.primary : '';
    colorIcon = props.variant == 'primary' ? 'rgb(243, 244, 246)' : '';

    const getIcon = (sIcon, iIndex, classIconName, sClassText, sIconContainer, iIconSize, colorIcon) => {
        if (!sIcon)
            return;

        if (typeof (sIcon) == 'object')
            return buttonIconStart;

        if (isEmoji(sIcon))
            return (
                <Text key={iIndex} className={classIconName ? classIconName : sClassText + sIconContainer}>{sIcon}</Text>
            );
        return (
            <Icon key={iIndex} className={classIconName ? classIconName : sClassText + sIconContainer} size={iIconSize} color={colorIcon} icon={sIcon}></Icon>
        );
    };

    const getIcon2 = (buttonInfo, classIconName, sClassText, sIconContainer, iIconSize, colorIcon) => {
        if (Array.isArray(buttonInfo)) {
            return buttonInfo.map((sIcon, iIndex) => {
                return getIcon(sIcon, iIndex, classIconName, sClassText, sIconContainer, iIconSize, colorIcon);
            });
        }
        else {
            return getIcon(buttonInfo, null, classIconName, sClassText, sIconContainer, iIconSize, colorIcon);
        }
    }

    let sButtonIconStart = buttonIconStart != '' && !buttonIconEnd ? getIcon2(buttonIconStart, classIconName, sClassText, sIconContainer, iIconSize, colorIcon) : null;
    let sButtonIconEnd = buttonIconEnd != '' && buttonIconEnd ? getIcon2(buttonIconEnd, classIconName, sClassText, sIconContainer, iIconSize, colorIcon) : null;/*bg-primary dark:bg-primary-d */
    let oButtonAddon = null;

    let sButtonAddonText = "";
    let sButtonAddonBg = "bg-neutral-500 dark:bg-neutral-500";
    if (typeof buttonAddon === 'object') {
        sButtonAddonText = buttonAddon.text;
        if (buttonAddon.variant == 'primary')
            sButtonAddonBg = 'bg-contrast dark:bg-contrast-d';
    }
    else {
        sButtonAddonText = buttonAddon;
    }

    oButtonAddon = sButtonAddonText && sButtonAddonText != '' ? <View className='flex-1 items-end '>
        <View className={sButtonAddonBg + ' rounded-full px-2 py-0.5 mx-1 text-center items-center'}>
            <Text className="text-white  text-xs font-semibold">{sButtonAddonText}</Text></View></View> : null;


    if (buttonDisabled)
        onPress = undefined;
    let Cnt = onPress !== undefined ? Pressable : View
    let Cnt2 = (
        <Cnt className={sClassContainer} {...rest}  {...(rest.alt ? { 'aria-label': rest.alt, role: 'button', 'alt': rest.alt } : {})} onPress={onPress} ref={forwardedRef}>
            {sButtonIconStart}
            {buttonTitle !== undefined && (
                <Text className={sClassText + sTitleContainer} numberOfLines={1}>{buttonTitle}</Text>
            )}
            {sButtonIconEnd}
            {oButtonAddon}
            {props.children}
        </Cnt>
    );

    if (buttonTooltip) {
        return <Tooltip content={buttonTooltip}>{Cnt2}</Tooltip>
    }

    return Cnt2;

}

export const ButtonRef = React.forwardRef((props, forwardedRef) => {
    return (
        <Button {...props} forwardedRef={forwardedRef} />
    );
});

export function ButtonsGroupMenu(props) {
    let { variant, size, rounded, ...rest } = props

    return <ButtonsGroup variant={!!variant ? variant : 'outline'} size={!!size ? size : 'xs'} rounded={rounded != undefined ? rounded : true}>{props.children}</ButtonsGroup>
}

export function ButtonMenuGroupItem(props) {
    let { size, title, startDecorator, endDecorator, onPress, rounded, fullWidth, disabled, ...rest } = props
    return (
        <Button variant='group-item' hideTitleOnSmall={true} size={!!size ? size : 'sm'} title={title} startDecorator={startDecorator} endDecorator={endDecorator} onPress={onPress} rounded={rounded != undefined ? rounded : true} disabled={disabled != undefined ? disabled : false} fullWidth={fullWidth != undefined ? fullWidth : false}>
            {props.children}
        </Button>
    );
}

export function ButtonMenuActionDefault(props) {
    let { variant, size, title, startDecorator, endDecorator, onPress, rounded, fullWidth, disabled, hideTitleOnSmall, ...rest } = props
    return <Button variant={!!variant ? variant : 'outline'} size={!!size ? size : 'sm'} title={title} hideTitleOnSmall={hideTitleOnSmall != undefined ? hideTitleOnSmall : true} startDecorator={startDecorator} endDecorator={endDecorator} onPress={onPress} rounded={rounded != undefined ? rounded : true} disabled={disabled != undefined ? disabled : false} fullWidth={fullWidth != undefined ? fullWidth : false} />
}

export function ButtonMenuActionText(props) {
    let { variant, size, title, startDecorator, endDecorator, onPress, rounded, fullWidth, disabled, hideTitleOnSmall, ...rest } = props
    return <Button variant={!!variant ? variant : 'text'} size={!!size ? size : 'sm'} title={title} hideTitleOnSmall={hideTitleOnSmall != undefined ? hideTitleOnSmall : true} startDecorator={startDecorator} endDecorator={endDecorator} onPress={onPress} rounded={rounded != undefined ? rounded : true} disabled={disabled != undefined ? disabled : false} fullWidth={fullWidth != undefined ? fullWidth : false} />
}

export function ButtonMenuCounterDefault(props) {
    let { variant, size, title, startDecorator, endDecorator, onPress, rounded, fullWidth, disabled, hideTitleOnSmall, ...rest } = props
    return <Button variant={!!variant ? variant : 'outline'} size={!!size ? size : 'sm'} title={title} hideTitleOnSmall={hideTitleOnSmall != undefined ? hideTitleOnSmall : true} startDecorator={startDecorator} endDecorator={endDecorator} onPress={onPress} rounded={rounded != undefined ? rounded : true} disabled={disabled != undefined ? disabled : false} fullWidth={fullWidth != undefined ? fullWidth : false} />
}

export function ButtonMenuCounterText(props) {
    let { variant, size, title, startDecorator, endDecorator, onPress, rounded, fullWidth, disabled, hideTitleOnSmall, ...rest } = props
    return <Button variant={!!variant ? variant : 'outline'} size={!!size ? size : 'sm'} title={title} hideTitleOnSmall={hideTitleOnSmall != undefined ? hideTitleOnSmall : true} startDecorator={startDecorator} endDecorator={endDecorator} onPress={onPress} rounded={rounded != undefined ? rounded : true} disabled={disabled != undefined ? disabled : false} fullWidth={fullWidth != undefined ? fullWidth : false} />
}
