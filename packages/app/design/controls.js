import { TextInput as TextInputDef, Modal as ModalDef, ModalProps, Platform, Switch as SwitchDef, ViewProps,  } from 'react-native'
import { Pressable, View , Row   } from 'app/design/view'
import { Text } from 'app/design/typography'
import { styled } from 'nativewind'
import { Icon } from 'app/ui/atoms/icon'
import { appSetting, isEmoji } from 'app/lib/util'
import { Picker as PickerDef } from '@react-native-picker/picker';
import { Theme } from 'app/design/theme';
import { MentionInput as MentionInputDef } from 'react-native-controlled-mentions'

import { Dropdown as DropdownDef} from 'react-native-element-dropdown';

/* inputs */
export const Input = styled(TextInputDef, ' bg-neutral-500/10  border border-neutral-500/10  focus:bg-backgroundinput-focus focus:outline-none  focus:border-bordercolorinput-focus dark:focus:border-bordercolorinput-darkfocus  text-neutral-900 rounded-lg   w-full p-2  dark:focus:bg-backgroundinput-darkafocus placeholder-neutral-600 dark:text-neutral-100 text-base h-11 ')
export const InputMulti = styled(TextInputDef, ' bg-backgroundinput  border border-bordercolorinput dark:border-bordercolorinput-dark focus:bg-backgroundinput-focus focus:outline-none  focus:border-bordercolorinput-focus dark:focus:border-bordercolorinput-darkfocus  text-neutral-900 rounded-lg   w-full p-2 dark:bg-backgroundinput-dark dark:focus:bg-backgroundinput-darkafocus placeholder-neutral-600 dark:text-neutral-100 text-base leading-5')

export const MentionInput = styled(MentionInputDef, ' bg-backgroundinput  border border-bordercolorinput dark:border-bordercolorinput-dark focus:bg-backgroundinput-focus focus:outline-none  focus:border-bordercolorinput-focus dark:focus:border-bordercolorinput-darkfocus  text-neutral-900 rounded-lg   w-full p-2 dark:bg-backgroundinput-dark dark:focus:bg-backgroundinput-darkafocus placeholder-neutral-600 dark:text-neutral-100 text-base h-11 leading-5')
export const MentionInputMulti = styled(MentionInputDef, ' bg-backgroundinput  border border-bordercolorinput dark:border-bordercolorinput-dark focus:bg-backgroundinput-focus focus:outline-none  focus:border-bordercolorinput-focus dark:focus:border-bordercolorinput-darkfocus  text-neutral-900 rounded-lg   w-full p-2 dark:bg-backgroundinput-dark dark:focus:bg-backgroundinput-darkafocus placeholder-neutral-600 dark:text-neutral-100 text-base h-11 leading-5')


export const Switch = styled(SwitchDef, ' text-gray-800 ')
export const Hidden = styled(TextInputDef, 'hidden')
export const Dropdown = styled(DropdownDef, ' bg-backgroundinput  border border-bordercolorinput dark:border-bordercolorinput-dark focus:bg-backgroundinput-focus focus:outline-none  focus:border-bordercolorinput-focus dark:focus:border-bordercolorinput-darkfocus  text-neutral-900 rounded-lg   w-full p-2 dark:bg-backgroundinput-dark dark:focus:bg-backgroundinput-darkafocus placeholder-neutral-600 dark:text-neutral-100 text-base h-11 leading-5  ')

const PickerStyles = ' appearance-none bg-backgroundinput  border border-bordercolorinput dark:border-bordercolorinput-dark focus:bg-backgroundinput-focus focus:outline-none  focus:border-bordercolorinput-focus dark:focus:border-bordercolorinput-darkfocus  text-neutral-900 rounded-lg   w-full p-2 dark:bg-backgroundinput-dark dark:focus:bg-backgroundinput-darkafocus placeholder-neutral-600 dark:text-neutral-100 text-base leading-5 '
export const PickerStyled = styled(PickerDef, PickerStyles + ' ')
export const PickerStyledIos = styled(PickerDef, PickerStyles)


export function Modal(props) {

    const animationType = props.animation ? props.animation : 'fade';
    const presentationType = props.presentation ? props.presentation : 'overFullScreen';
    const transparent = props.transparent ? props.transparent : true;
    const Wrapper = !!props.onClose && props?.outerClickClose !== false ? Pressable : View;

    return (
        <ModalDef visible={props.onVisible} presentationStyle={presentationType} animationType={animationType} transparent={transparent}>
            <Wrapper className="flex justify-end w-full h-full pb-4 bg-gray-100/80 dark:bg-gray-900/80" {...(!!props.onClose && { onPress: props.onClose })}>
                <View className="flex-row justify-center items-center left-0 right-0 z-50 w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-modal md:h-full">
                    <View className="relative w-full h-full max-w-2xl md:h-auto">
                        <View className="relative bg-backgroundmodal dark:bg-backgroundmodal-dark border border-bordercolormodal dark:border-bordercolormodal-dark  rounded-lg shadow-2xl">
                            <View className="p-2">
                                <Row className={'items-center ' + (!!props.title ? 'justify-between' : 'justify-end') + ' ml-2  '}>
                                    { !!props.title && <View><Text className='text-gray-700 dark:text-gray-200 text-lg font-bold'>{props.title}</Text></View>}
                                    { !!props.onClose && <View className=''><Button variant='text' size='base' rounded startDecorator='X' onPress={props.onClose}/></View>}
                                </Row>
                                <View className="space-y-0 overflow-y-auto text-gray-700 dark:text-gray-200">{props.children}</View>
                            </View>
                        </View>
                    </View>
                </View>
            </Wrapper>
        </ModalDef>
    )
}


export function MenuButton(props) {
    return <Button>xcdv</Button>
}


export function ButtonsGroup(props) {
    let { className, ...rest } = props;
    let groupType = props.variant ? props.variant : 'default';
    let groupSize = props.size ? props.size : 'base';
    let groupFull = props.fullWidth ? true : false;
    let groupRounded = props.rounded ? true : false;

    let sClassContainer = ' group relative flex-row items-center ';
    sClassContainer += groupFull ? ' flex-auto' : ' w-fit m-0';

    let ThemeCssClasses = appSetting('theme', 'buttons_group_styles');
    sClassContainer +=ThemeCssClasses['u-btn-' + groupType + '-cnt'];
    sClassContainer += groupRounded ? 'rounded-full ' : 'rounded-lg ';
    sClassContainer += className;

    let aChildren = undefined;
    if(props?.children) {
        const iChildren = props.children.length;

        aChildren = props.children.map((oChild, iIndex) => {
            let { variant, size, fullWidth, ...restChild } = oChild.props;

            let oItem = undefined;
            if(oChild.type === Button)
                oItem = <Button variant="group-item" size={groupSize} fullWidth={groupFull} {...restChild} />
            else
                oItem = oChild;

            return (
                <View key={iIndex} className={iIndex < iChildren - 1 ? 'border-r border-bordercolorbutton dark:border-bordercolorbutton-dark' : ''}>{oItem}</View>
            );
        });
    }

    return (
        <View className={sClassContainer} {...rest}>{aChildren}</View>
    );
}

export function Button(props) {
  const {
      className, classTextName, classIconName, onPress, variant, size, pressed, 
      disabled, startDecorator, endDecorator, align, fullWidth, title, rounded, solid,
      ...rest
  } = props;

  const buttonType = variant || 'default';
  const buttonSize = size || 'base';
  const buttonPressed = pressed || false;
  const buttonDisabled = disabled || false;
  const buttonIconStart = startDecorator || false;
  const buttonIconEnd = endDecorator || false;
  const buttonAlign = align || 'center';
  const buttonFull = fullWidth || false;
  const buttonTitle = title || '';
  const buttonRounded = rounded || false;
  const buttonSolid = solid || false;
  
  let sTitleContainer = '';
  let iIconSize = 24;

  let sClassContainer = ' group relative flex-row items-center ';
  let sIconContainer = ' h-6 w-6 mr-2 ';
  sClassContainer += buttonFull ? ' flex-auto' : ' w-fit m-0 ';
  if (buttonDisabled) sClassContainer += ' opacity-50 ';
  let sClassText = ' whitespace-nowrap text-ellipsis overflow-hidden';

  let ThemeCssClasses = appSetting('theme', 'button_styles');

  if (buttonType != 'custom') {
      sClassContainer +=
          (buttonSolid ? '' : ThemeCssClasses['u-btn-' + buttonType + '-trans']) +
          ThemeCssClasses['u-btn-' + buttonType + '-cnt']
      sClassText += ThemeCssClasses['u-btn-' + buttonType + '-text'];
  } else {
      sClassContainer += className;
      sClassText += classTextName;
  }

  sClassContainer += ' justify-' + buttonAlign + ' ';

  if (buttonPressed) {
      sClassContainer += ' ring-2 ring-inset ring-offset-2 ';
      sClassText += ' font-bold ';
  }

  const sClassDefaultRounding = buttonType != 'group-item' ? 'rounded-lg' : '';

  const buttonSizeClassMap = {
      xs: { container: 'rounded-full p-1 ', text: ' text-xs ', iconSize: 16, iconContainer: ' h-4 w-4 ', titleContainer: 'mx-1 ' },
      sm: { container: 'rounded-full p-1.5 ', text: ' text-sm ', iconSize: 20, iconContainer: ' h-5 w-5 ', titleContainer: 'mx-1.5 ' },
      base: { container: 'rounded-full p-2 ', text: ' text-base ', iconSize: 24, iconContainer: 'h-6 w-6 ', titleContainer: 'mx-2 ' },
      lg: { container: 'rounded-full p-3 ', text: ' text-lg ', iconSize: 28, iconContainer: 'h-7 w-7 ', titleContainer: 'mx-2 ' },
      xl: { container: 'rounded-full p-4 ', text: ' text-xl ', iconSize: 32, iconContainer: 'h-8 w-8 ', titleContainer: 'mx-3 ' }
  };

  const buttonSizeClass = buttonSizeClassMap[buttonSize] || buttonSizeClassMap.base;
  sClassContainer += buttonRounded ? buttonSizeClass.container : sClassDefaultRounding + ' px-2 py-2 ';
  sIconContainer = buttonSizeClass.iconContainer + (buttonTitle !== '' ? 'mx-[1px] ' : '');
  sClassText += buttonSizeClass.text;
  iIconSize = buttonSizeClass.iconSize;
  sTitleContainer += buttonTitle !== '' ? buttonSizeClass.titleContainer : '';

  const { colors } = Theme();
  let colorIcon = variant == 'link' ? colors.primary : '';
  colorIcon = variant == 'primary' ? 'rgb(243, 244, 246)' : '';

  // renderIcon function to reduce redundancy
  const renderIcon = (icon) => {
      if (!icon)
          return;
      
      return isEmoji(icon) ? 
          <Text className={classIconName ? classIconName : sClassText + sIconContainer}>{icon}</Text> : 
          <Icon className={classIconName ? classIconName : sClassText + sIconContainer} size={iIconSize} color={colorIcon} icon={icon}></Icon>;
  }

  let sButtonIconStart = typeof(buttonIconStart) === 'object' ? buttonIconStart :
    Array.isArray(buttonIconStart) ? buttonIconStart.map(renderIcon) : renderIcon(buttonIconStart);
  let sButtonIconEnd = typeof(buttonIconEnd) === 'object' ? buttonIconEnd :
    Array.isArray(buttonIconEnd) ? buttonIconEnd.map(renderIcon) : renderIcon(buttonIconEnd);

  return (
      onPress !== undefined ? (
          <Pressable className={sClassContainer} {...rest} onPress={onPress}>
              {sButtonIconStart}
              {buttonTitle && <Text className={sClassText + sTitleContainer} numberOfLines={1}>{buttonTitle}</Text>}
              {sButtonIconEnd}
              {props.children}
          </Pressable>
      ) : (
          <View className={sClassContainer} {...rest}>
              {sButtonIconStart}
              {buttonTitle && <Text className={sClassText + sTitleContainer} numberOfLines={1}>{buttonTitle}</Text>}
              {sButtonIconEnd}
              {props.children}
          </View>
      )
  );
}

export function ButtonsGroupMenu(props) {
  const { variant = 'outline', size = 'xs', rounded = true, children, ...rest } = props;

  return <ButtonsGroup variant={variant} size={size} rounded={rounded} {...rest}>{children}</ButtonsGroup>;
}

export function ButtonMenuGroupItem(props) {
    let { size, title, startDecorator, endDecorator, onPress, children, ...rest } = props;
    if (size == '')
        size = 'sm';
    return (
        <Button variant='group-item' size={size} title={title} startDecorator={startDecorator} endDecorator={endDecorator} onPress={onPress} {...rest}>
            {children}
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
