import { TouchableOpacity, TextInput } from 'react-native'
import { Text } from 'app/design/typography'
import { styled } from 'nativewind'

const TouchableOpacityStyled = styled(TouchableOpacity)

export function Button(props) {
  let { className, ...rest } = props

  // default styles for all buttons
  className = `border border-bordercolor/10 dark:border-bordercolor-dark/10 focus:ring-4 shadow-sm hover:shadow-md active:shadow-sm hover:-translate-y-0.5 active:translate-y-0  focus:outline-none  rounded-lg  px-5 py-2 text-center ${className}`

  if (props.variant && 'primary' == props.variant)
    className = `bg-blue-700 hover:bg-blue-600 focus:ring-blue-500/20 ${className}`
  else
    className = `bg-white dark:bg-neo-800 hover:bg-neo-50 dark:hover:bg-neo-700 focus:ring-bordercolor/5  dark:focus:ring-bordercolor-dark/5 ${className}`

  return (
    <TouchableOpacityStyled className={className} {...rest}>
      {props.text ? (
        <Text className="text-white font-medium text-lg ">
          {props.children}
        </Text>
      ) : (
        props.children
      )}
    </TouchableOpacityStyled>
  )
}

export const StyledInput = styled(
  TextInput,
  'bg-neo-100/50 border border-bordercolor/20 text-neo-800 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-neo-900/50 dark:border-bordercolor-dark/20 dark:placeholder-neo-400 dark:text-neo-200 dark:focus:ring-blue-500 dark:focus:border-blue-500 text-base'
)

export const StyledHidden = styled(TextInput, 'hidden')
