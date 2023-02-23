import { Text as NativeText, Platform, Linking, TextStyle, Button, TextInput } from 'react-native'
import { styled, StyledProps } from 'nativewind'

export const StyledButton = styled(Button, 'text-white bg-blue-600 hover:bg-blue-700   border border-gray-900/20 dark:border-white/20 focus:ring-4 shadow-sm hover:shadow-md active:shadow-sm hover:-translate-y-0.5 active:translate-y-0 duration-200 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-base  @xl/cell:w-auto px-5 py-2.5 text-center  dark:focus:ring-blue-800')

export const StyledButton2 = styled(Button, '')


export const StyledInput = styled(TextInput, 'bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-900 dark:border-gray-700 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500')

export const StyledHidden = styled(TextInput, 'hidden')
