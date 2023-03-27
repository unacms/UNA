import { TextInput as TextInputDef, Modal as ModalDef, ModalProps, Platform, TouchableOpacityProps, Switch as SwitchDef, ViewProps } from 'react-native'
import { Pressable, View , Row   } from 'app/design/view'
import { Text } from 'app/design/typography'
import { styled } from 'nativewind'
import { Icon } from 'app/components/svg'
import { ThemeCssClasses } from 'app/design/vars'
import { useTheme } from '@react-navigation/native';

import { Dropdown as DropdownDef} from 'react-native-element-dropdown';

/* inputs */
export const Input = styled(TextInputDef, 'bg-form/50 focus:bg-white focus:border border-neoborder/50 text-neo-800 rounded-lg   w-full p-2.5 dark:bg-form-dark/50 dark:focus:bg-neo-950  dark:placeholder-neo-400 dark:text-neo-200 dark:border-neoborder-dark/50 text-base')
export const Switch = styled(SwitchDef, ' text-neo-800 ')
export const Hidden = styled(TextInputDef, 'hidden')
export const Dropdown = styled(DropdownDef, 'bg-form/50 focus:bg-white focus:ring text-neo-800 rounded-lg focus:ring-brand/5  w-full p-2.5 dark:bg-form-dark/50 dark:focus:bg-neo-900  dark:placeholder-neo-400 dark:text-neo-200 dark:focus:ring-brand-dark/5 text-base  px-2.5 py-1 ')
 

/* modal */
type ModalPropsCustom = ModalProps & {
  presentation?: 'fullScreen' | 'pageSheet' | 'formSheet' | 'overFullScreen'
  title?: string
  animation? : 'fade' | 'slide' | 'none'
  onVisible?: boolean,
  onClose?: void
}
export function Modal(props: ModalPropsCustom) {

  let animationType = props.animation ? props.animation : 'fade';
  let presentationType = props.presentation ? props.presentation : 'fullScreen';

  return (
    <ModalDef visible={props.onVisible} presentationStyle={presentationType} animationType={animationType} transparent={Platform.OS != 'ios'}>
        <View className="flex-row justify-center items-center top-0 left-0 right-0 z-50 w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-modal md:h-full">
            <View className="relative w-full h-full max-w-2xl md:h-auto">
                <View className="relative bg-white dark:bg-gray-700 rounded-lg shadow">
                    <View className="p-4">
                    <Row className={(!!props.title ? 'justify-between' : 'justify-end') + ' mb-2'}>
                      { !!props.title && <View><Text className='text-lg font-bold'>{props.title}</Text></View>}
                      { !!props.onClose && <View className=''> <Button variant='default' size='xs' startDecorator='close' onPress={props.onClose}/></View>}
                    </Row>
                        <View className="space-y-4 overflow-y-auto text-gray-700 dark:text-gray-200">{props.children}</View>
                    </View>
                </View>
            </View>
        </View>
    </ModalDef>
  )
}

/* buttons */
type ButtonProps = TouchableOpacityProps & {
  align?: 'center' | 'start' | 'end'
  disabled?: boolean
  fullWidth?: boolean
  size?: 'text-sm' | 'xs' | 'sm' | 'base' | 'lg' | 'xl'
  startDecorator?: string
  endDecorator?: string
  variant?:
    | 'default'
    | 'primary'
    | 'danger'
    | 'text'
    | 'link'
    | 'outline'
    | 'custom'
  title?: string
  rounded?: boolean
  solid?: boolean
  classTextName?: string
  classIconName?: string
}

/* buttons */
export function Button(props: ButtonProps) {
  let { className, classTextName, classIconName, onPress, ...rest } = props
  let buttonType = props.variant ? props.variant : 'default'
  let buttonSize = props.size ? props.size : 'base'
  let buttonDisabled = props.disabled ? true : false
  let buttonIconStart = props.startDecorator ? props.startDecorator : ''
  let buttonIconEnd = props.endDecorator ? props.endDecorator : false
  let buttonAlign = props.align ? props.align : 'center'
  let buttonFull = props.fullWidth ? true : false
  let buttonTitle = props.title ? props.title : ''
  let buttonRounded = props.rounded ? true : false
  let buttonSolid = props.solid ? true : false

  let sClassContainer = ' group relative flex-row items-center '
  let sIconContainer = ' h-6 w-6 mr-2 '

  if (!buttonFull) sClassContainer += ' w-fit m-0'

  if (buttonDisabled) sClassContainer += ' opacity-50 '

  let sClassText = '  text-center '

  if (buttonType != 'custom') {
    sClassContainer +=
      (buttonSolid ? '' : ThemeCssClasses['u-btn-' + buttonType + '-trans']) +
      ThemeCssClasses['u-btn-' + buttonType + '-cnt']
      sClassText += ThemeCssClasses['u-btn-' + buttonType + '-text']
  } else {
    sClassContainer += className
    sClassText += classTextName
  }

  sClassContainer += ' justify-' + buttonAlign + ' '

  switch (buttonSize) {
    case 'xs':
      sClassContainer += buttonRounded
        ? 'rounded-full p-1 '
        : 'rounded-md px-2 py-1.5 '
      sIconContainer =
        ' h-4 w-4 ' +
        (buttonTitle != '' ? (buttonIconEnd != '' ? ' ml-1.5 ' : ' mr-1.5 ') : '')
      sClassText += '  text-xs '
      break

    case 'sm':
      sClassContainer += buttonRounded
        ? 'rounded-full p-2 '
        : 'rounded-lg px-3 py-2'
      sIconContainer =
        ' h-5 w-5 ' +
        (buttonTitle != ''
          ? buttonIconEnd != ''
            ? ' ml-2 '
            : ' mr-2 '
          : '')
      sClassText += ' text-sm '
      break

    case 'base':
      sClassContainer += buttonRounded
        ? 'rounded-full p-2.5 '
        : 'rounded-lg px-4 py-2.5 '
      sIconContainer =
        ' h-6 w-6 ' +
        (buttonTitle != '' ? (buttonIconEnd != '' ? ' ml-2.5 ' : ' mr-2.5 ') : '')
      sClassText += ' text-base '
      break

    case 'lg':
      sClassContainer += buttonRounded
        ? 'rounded-full p-3'
        : 'rounded-lg px-5 py-3 '
      sIconContainer =
        ' h-7 w-7 ' +
        (buttonTitle != '' ? (buttonIconEnd != '' ? ' ml-3 ' : ' mr-3 ') : '')
      sClassText += ' text-lg '
      break

    case 'xl':
      sClassContainer += buttonRounded
        ? 'rounded-full p-4 '
        : 'rounded-lg px-6 py-4 '
      sIconContainer =
        ' h-8 w-8 ' +
        (buttonTitle != '' ? (buttonIconEnd != '' ? ' ml-3.5 ' : ' mr-3.5 ') : '')
      sClassText += ' text-2xl '
      break
  }

  return (
    onPress !== undefined ? <Pressable className={sClassContainer} {...rest} onPress={onPress}>
      {buttonIconStart != '' && !buttonIconEnd && (
        <Icon
          className={
            classIconName ? classIconName : sClassText + sIconContainer
          }
          icon={buttonIconStart}
        ></Icon>
      )}
      {buttonTitle !== undefined && <Text className={sClassText}>{buttonTitle}</Text>}
      {buttonIconEnd != '' && buttonIconEnd && (
        <Icon
          className={
            classIconName ? classIconName : sClassText + sIconContainer
          }
          icon={buttonIconEnd}
        ></Icon>
      )}
      {props.children}
    </Pressable> : <View className={sClassContainer} {...rest} >
      {buttonIconStart != '' && !buttonIconEnd && (
        <Icon
          className={
            classIconName ? classIconName : sClassText + sIconContainer
          }
          icon={buttonIconStart}
        ></Icon>
      )}
      {buttonTitle !== undefined && <Text className={sClassText}>{buttonTitle}</Text>}
      {buttonIconEnd != '' && buttonIconEnd && (
        <Icon
          className={
            classIconName ? classIconName : sClassText + sIconContainer
          }
          icon={buttonIconEnd}
        ></Icon>
      )}
      {props.children}
    </View>
  )
}
