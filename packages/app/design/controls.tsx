import { TouchableOpacity, TextInput } from 'react-native'
import { Text } from 'app/design/typography';
import { styled } from 'nativewind'

const TouchableOpacityStyled = styled(TouchableOpacity);

export function Button (props) {
    let {className, ...rest} = props;

    // default styles for all buttons
    className = `text-white border border-gray-900/20 dark:border-white/20 focus:ring-4 shadow-sm hover:shadow-md active:shadow-sm hover:-translate-y-0.5 active:translate-y-0 duration-200 focus:outline-none font-medium rounded-lg text-base  @xl/cell:w-auto px-5 py-2.5 text-center ${className}`;

    if (props.variant && 'primary' == props.variant)
        className = `bg-blue-600 hover:bg-blue-700 focus:ring-blue-300  dark:focus:ring-blue-800 ${className}`;
    else
        className = `bg-slate-600 hover:bg-slate-700 focus:ring-slate-300  dark:focus:ring-slate-800 ${className}`;

    return <TouchableOpacityStyled className={className} {...rest}>{props.text ? (<Text className="text-white">{props.children}</Text>) : props.children}</TouchableOpacityStyled>
}

export const StyledInput = styled(TextInput, 'bg-neo-100/50 border border-bordercolor/20 text-neo-800 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-neo-900/50 dark:border-bordercolor-dark/20 dark:placeholder-neo-400 dark:text-neo-200 dark:focus:ring-blue-500 dark:focus:border-blue-500 text-base')

export const StyledHidden = styled(TextInput, 'hidden')

