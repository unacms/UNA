import { TextInput as TextInputDef } from 'react-native'
import { Pressable,View } from 'app/design/view'
import { Text } from 'app/design/typography'
import { styled } from 'nativewind'
import { Icon } from 'app/components/svg'
import { TouchableOpacityProps } from 'react-native'
import { ThemeCssClasses } from 'app/design/vars'

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

/* inputs */
export const Input = styled(
  TextInputDef,
  'bg-neo-100/50 border border-bordercolor/20 text-neo-800 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-neo-900/50 dark:border-bordercolor-dark/20 dark:placeholder-neo-400 dark:text-neo-200 dark:focus:ring-blue-500 dark:focus:border-blue-500 text-base'
)
export const Hidden = styled(TextInputDef, 'hidden')

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
    onPress ? <Pressable className={sClassContainer} {...rest} onPress={onPress}>
      {buttonIconStart != '' && !buttonIconEnd && (
        <Icon
          className={
            classIconName ? classIconName : sClassText + sIconContainer
          }
          icon={buttonIconStart}
        ></Icon>
      )}
      {buttonTitle && <Text className={sClassText}>{buttonTitle}</Text>}
      {buttonIconEnd != '' && buttonIconEnd && (
        <Icon
          className={
            classIconName ? classIconName : sClassText + sIconContainer
          }
          icon={buttonIconEnd}
        ></Icon>
      )}
    </Pressable> : <View className={sClassContainer} {...rest} >
      {buttonIconStart != '' && !buttonIconEnd && (
        <Icon
          className={
            classIconName ? classIconName : sClassText + sIconContainer
          }
          icon={buttonIconStart}
        ></Icon>
      )}
      {buttonTitle && <Text className={sClassText}>{buttonTitle}</Text>}
      {buttonIconEnd != '' && buttonIconEnd && (
        <Icon
          className={
            classIconName ? classIconName : sClassText + sIconContainer
          }
          icon={buttonIconEnd}
        ></Icon>
      )}
    </View>
  )
}
