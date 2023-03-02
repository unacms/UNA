import { Text as NativeText, Platform, Linking, TextStyle, Button as ButtonNative, TextInput } from 'react-native'
import { styled, StyledProps } from 'nativewind'

const ButtonStyled = styled(ButtonNative);

export function Button (props) {
    let {classes, ...rest} = props;
    if (props.variant && 'primary' == props.variant)
        classes = `text-white bg-blue-600 hover:bg-blue-700   border border-gray-900/20 dark:border-white/20 focus:ring-4 shadow-sm hover:shadow-md active:shadow-sm hover:-translate-y-0.5 active:translate-y-0 duration-200 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-base  @xl/cell:w-auto px-5 py-2.5 text-center  dark:focus:ring-blue-800 ${classes}`;
    return <ButtonStyled className={classes} {...rest}>{props.children}</ButtonStyled>
}

export const StyledInput = styled(TextInput, 'bg-neo-100/50 border border-bordercolor/20 text-neo-800 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-neo-900/50 dark:border-bordercolor-dark/20 dark:placeholder-neo-400 dark:text-neo-200 dark:focus:ring-blue-500 dark:focus:border-blue-500 text-base')

export const StyledHidden = styled(TextInput, 'hidden')

