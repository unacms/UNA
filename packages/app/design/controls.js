import { TextInput as TextInputDef, Modal as ModalDef, Platform, Switch as SwitchDef} from 'react-native'
import { Pressable, View , Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { styled } from 'nativewind'
import { Icon } from 'app/ui/atoms/icon'
import { appSetting, isEmoji } from 'app/lib/util'
import { Picker as PickerDef } from '@react-native-picker/picker';
import { Theme } from 'app/design/theme';
import { MentionInput as MentionInputDef } from 'react-native-controlled-mentions'

let h11 = '';
if(Platform.OS === 'android') {
    h11 = ' h-11'
}

import { Dropdown as DropdownDef} from 'react-native-element-dropdown';

/* inputs */
export const Input = styled(TextInputDef, ' bg-neutral-500/10  border border-neutral-500/10  focus:bg-backgroundinput-focus focus:outline-none  focus:border-bordercolorinput-focus dark:focus:border-bordercolorinput-darkfocus  text-neutral-900 rounded-lg   w-full p-2  dark:focus:bg-backgroundinput-darkafocus placeholder-neutral-600 dark:text-neutral-100 text-base leading-5 h-11 ' )
export const InputMulti = styled(TextInputDef, ' bg-backgroundinput  border border-bordercolorinput dark:border-bordercolorinput-dark focus:bg-backgroundinput-focus focus:outline-none  focus:border-bordercolorinput-focus dark:focus:border-bordercolorinput-darkfocus  text-neutral-900 rounded-lg   w-full p-2 dark:bg-backgroundinput-dark dark:focus:bg-backgroundinput-darkafocus placeholder-neutral-600 dark:text-neutral-100 text-base leading-5')

export const MentionInput = styled(MentionInputDef, ' bg-backgroundinput  border border-bordercolorinput dark:border-bordercolorinput-dark focus:bg-backgroundinput-focus focus:outline-none  focus:border-bordercolorinput-focus dark:focus:border-bordercolorinput-darkfocus  text-neutral-900 rounded-lg   w-full p-2 dark:bg-backgroundinput-dark dark:focus:bg-backgroundinput-darkafocus placeholder-neutral-600 dark:text-neutral-100 text-base leading-5 h-11')
export const MentionInputMulti = styled(MentionInputDef, ' bg-backgroundinput  border border-bordercolorinput dark:border-bordercolorinput-dark focus:bg-backgroundinput-focus focus:outline-none  focus:border-bordercolorinput-focus dark:focus:border-bordercolorinput-darkfocus  text-neutral-900 rounded-lg   w-full p-2 dark:bg-backgroundinput-dark dark:focus:bg-backgroundinput-darkafocus placeholder-neutral-600 dark:text-neutral-100 text-base leading-5')

export const Switch = styled(SwitchDef, ' text-gray-800')
export const Hidden = styled(TextInputDef, 'hidden')
export const Dropdown = styled(DropdownDef, ' bg-backgroundinput  border border-bordercolorinput dark:border-bordercolorinput-dark focus:bg-backgroundinput-focus focus:outline-none  focus:border-bordercolorinput-focus dark:focus:border-bordercolorinput-darkfocus  text-neutral-900 rounded-lg   w-full p-2 dark:bg-backgroundinput-dark dark:focus:bg-backgroundinput-darkafocus placeholder-neutral-600 dark:text-neutral-100 text-base leading-5 h-11')

const PickerStyles = ' appearance-none bg-backgroundinput  border border-bordercolorinput dark:border-bordercolorinput-dark focus:bg-backgroundinput-focus focus:outline-none  focus:border-bordercolorinput-focus dark:focus:border-bordercolorinput-darkfocus  text-neutral-900 rounded-lg   w-full p-2 dark:bg-backgroundinput-dark dark:focus:bg-backgroundinput-darkafocus placeholder-neutral-600 dark:text-neutral-100 text-base leading-5 '
export const PickerStyled = styled(PickerDef, PickerStyles + ' ')
export const PickerStyledIos = styled(PickerDef, PickerStyles)


/* modal */
export function Modal({
    animation = 'fade',
    presentation = 'overFullScreen',
    transparent = true,
    onClose,
    outerClickClose = true,
    onVisible,
    title,
    children
}) 
{
    const Wrapper = onClose && outerClickClose !== false ? Pressable : View;

    return (
        <ModalDef visible={onVisible} presentationStyle={presentation} animationType={animation} transparent={transparent}>
            <Wrapper className="flex justify-end w-full h-full pb-4 bg-gray-100/80 dark:bg-gray-900/80" {...(onClose && { onPress: onClose })}>
                <View className="flex-row justify-center items-center left-0 right-0 z-50 w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-modal md:h-full">
                    <View className="relative w-full h-full max-w-2xl md:h-auto">
                        <View className="relative bg-backgroundmodal dark:bg-backgroundmodal-dark border border-bordercolormodal dark:border-bordercolormodal-dark rounded-lg shadow-2xl">
                            <View className="p-2">
                                <Row className={'items-center ' + (title ? 'justify-between' : 'justify-end') + ' ml-2'}>
                                    { title && <View><Text className='text-gray-700 dark:text-gray-200 text-lg font-bold'>{title}</Text></View>}
                                    { onClose && <View className=''><Button variant='text' size='base' rounded startDecorator='X' onPress={onClose}/></View>}
                                </Row>
                            <View className="space-y-0 overflow-y-auto text-gray-700 dark:text-gray-200">{children}</View>
                        </View>
                    </View>
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
    const childClass = isLastChild ? 'border-r border-bordercolorbutton dark:border-bordercolorbutton-dark' : '';

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
    let { className, classTextName, classIconName, onPress, ...rest } = props
    let buttonType = props.variant ? props.variant : 'default'
    let buttonSize = props.size ? props.size : 'base'
    let buttonPressed = props.pressed ? true : false
    let buttonDisabled = props.disabled ? true : false
    let buttonIconStart = props.startDecorator ? props.startDecorator : false
    let buttonIconEnd = props.endDecorator ? props.endDecorator : false
    let buttonAlign = props.align ? props.align : 'center'
    let buttonFull = props.fullWidth ? true : false
    let buttonTitle = props.title ? props.title : ''
    let buttonRounded = props.rounded ? true : false
    let buttonSolid = props.solid ? true : false
    let sTitleContainer = '';
    let iIconSize = 24

    let sClassContainer = ' group relative flex-row items-center '
    let sIconContainer = ' h-6 w-6 mr-2 '

    sClassContainer += buttonFull ? ' flex-auto w-full ' : ' w-fit m-0 truncate '

    if (buttonDisabled) sClassContainer += ' opacity-50 '

    let sClassText = ' whitespace-nowrap text-ellipsis overflow-hidden'

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
        sClassContainer += ' ring-2 ring-inset ring-offset-2 ';
        sClassText += ' font-bold ';
    }

    const sClassDefaultRounding = buttonType != 'group-item' ? 'rounded-lg' : '';

    switch (buttonSize) {
        case 'xs':
            sClassContainer += buttonRounded ? 'rounded-full p-1 ' : sClassDefaultRounding + ' px-1 py-1 ';
            sIconContainer = ' h-4 w-4 ' + (buttonTitle !== '' ? ' mx-[1px] ' : '');
            sClassText += ' text-xs '
            iIconSize = 16;
            sTitleContainer += buttonTitle !== '' ? 'mx-1 ' : '' // Conditionally add 'mx-2' class
        break

        case 'sm':
            sClassContainer += buttonRounded ? 'rounded-full p-1.5 ' : sClassDefaultRounding + ' px-2 py-1.5 ';
            sIconContainer = ' h-5 w-5 ' + (buttonTitle !== '' ? 'mx-0.5 ' : '');
            sClassText += ' text-sm '
            iIconSize = 20;
            sTitleContainer += buttonTitle !== '' ? 'mx-1.5 ' : '' // Conditionally add 'mx-2' class

        break

        case 'base':
            sClassContainer += buttonRounded ? 'rounded-full ' + (props.padding ? 'p-'+props.padding : 'p-2') : sClassDefaultRounding + ' px-2 py-2 ';
            sIconContainer = 'h-6 w-6 ' + (buttonTitle !== '' ? 'mx-1 ' : '');
            sClassText += ' text-base '
            iIconSize = 24;
            sTitleContainer += buttonTitle !== '' ? 'mx-2 ' : '' // Conditionally add 'mx-2' class

        break

        case 'lg':
            sClassContainer += buttonRounded ? 'rounded-full p-3 ' : sClassDefaultRounding + ' px-6 py-3 ';
            sIconContainer = 'h-7 w-7 ' + (buttonTitle !== '' ? 'mx-1 ' : '');
            sClassText += ' text-lg '
            iIconSize = 28;
            sTitleContainer += buttonTitle !== '' ? 'mx-2 ' : '' // Conditionally add 'mx-2' class

        break

        case 'xl':
            sClassContainer += buttonRounded ? 'rounded-full p-4 ' : sClassDefaultRounding + ' px-6 py-4 ';
            sIconContainer = 'h-8 w-8 ' + (buttonTitle !== '' ? 'mx-4 ' : '');
            sClassText += ' text-xl '
            iIconSize = 32;
            sTitleContainer += buttonTitle !== '' ? 'mx-3 ' : '' // Conditionally add 'mx-2' class

        break 
    }
    const { colors } = Theme()
    let colorIcon = props.variant == 'link' ? colors.primary: '';
    colorIcon = props.variant == 'primary' ? 'rgb(243, 244, 246)': '';

    const getIcon = (sIcon, iIndex, classIconName, sClassText, sIconContainer, iIconSize, colorIcon) => {
        if(!sIcon)
            return;

        if (typeof(sIcon) == 'object')
            return buttonIconStart;

        if(isEmoji(sIcon))
            return (
                <Text key={iIndex} className={classIconName ? classIconName : sClassText + sIconContainer}>{sIcon}</Text>
            );
        
        return (
            <Icon key={iIndex} className={classIconName ? classIconName : sClassText + sIconContainer} size={iIconSize} color={colorIcon} icon={sIcon}></Icon>
        );
    };

    const getIcon2 = (buttonInfo, classIconName, sClassText, sIconContainer, iIconSize, colorIcon)=> {
        if(Array.isArray(buttonInfo)) {
            return buttonInfo.map((sIcon, iIndex) => {
                return getIcon(sIcon, iIndex, classIconName, sClassText, sIconContainer, iIconSize, colorIcon);
            });
        }
        else {
            return getIcon(buttonInfo, null, classIconName, sClassText, sIconContainer, iIconSize, colorIcon);
        }
    }

    let sButtonIconStart = buttonIconStart != '' && !buttonIconEnd ? getIcon2(buttonIconStart, classIconName, sClassText, sIconContainer, iIconSize, colorIcon) : null;
    let sButtonIconEnd = buttonIconEnd != '' && buttonIconEnd ? getIcon2(buttonIconEnd, classIconName, sClassText, sIconContainer, iIconSize, colorIcon) : null;

    let Cnt = onPress !== undefined ? Pressable : View

    return (
        <Cnt className={sClassContainer} {...rest} onPress={onPress}>
            {sButtonIconStart}
            {buttonTitle !== undefined && (
                <Text className={sClassText + sTitleContainer} numberOfLines={1}>{buttonTitle}</Text>
            )}
            {sButtonIconEnd}
            {props.children}
        </Cnt>
    );
}

export function ButtonsGroupMenu(props) {
    let { variant, size, rounded, ...rest } = props
    return <ButtonsGroup variant={!!variant ? variant : 'outline'} size={!!size ? size : 'xs'} rounded={!!rounded ? rounded : true}>{props.children}</ButtonsGroup>
}

export function ButtonMenuGroupItem(props) {
    let { size, title, startDecorator, endDecorator, onPress, ...rest } = props
    return (
        <Button variant='group-item' size={!!size ? size : 'sm'} title={title} startDecorator={startDecorator} endDecorator={endDecorator} onPress={onPress}>
            {props.children}
        </Button>
    );
}

export function ButtonMenuActionDefault(props) {
    let { variant, size, title, startDecorator, endDecorator, onPress, rounded, fullWidth, ...rest } = props
    return <Button variant={!!variant ? variant : 'outline'} size={!!size ? size : 'sm'} title={title} startDecorator={startDecorator} endDecorator={endDecorator} onPress={onPress} rounded={rounded != undefined ? rounded : true} fullWidth={fullWidth != undefined ? fullWidth : false} />
}

export function ButtonMenuActionText(props) {
    let { variant, size, title, startDecorator, endDecorator, onPress, rounded, fullWidth, ...rest } = props
    return <Button variant={!!variant ? variant : 'text'} size={!!size ? size : 'sm'} title={title} startDecorator={startDecorator} endDecorator={endDecorator} onPress={onPress} rounded={rounded != undefined ? rounded : true} fullWidth={fullWidth != undefined ? fullWidth : false} />
}

export function ButtonMenuCounterDefault(props) {
    let { variant, size, title, startDecorator, endDecorator, onPress, rounded, fullWidth, ...rest } = props
    return <Button variant={!!variant ? variant : 'outline'} size={!!size ? size : 'sm'} title={title} startDecorator={startDecorator} endDecorator={endDecorator} onPress={onPress} rounded={rounded != undefined ? rounded : true} fullWidth={fullWidth != undefined ? fullWidth : false} />
}

export function ButtonMenuCounterText(props) {
    let { variant, size, title, startDecorator, endDecorator, onPress, rounded, fullWidth, ...rest } = props
    return <Button variant={!!variant ? variant : 'outline'} size={!!size ? size : 'sm'} title={title} startDecorator={startDecorator} endDecorator={endDecorator} onPress={onPress} rounded={rounded != undefined ? rounded : true} fullWidth={fullWidth != undefined ? fullWidth : false} />
}
