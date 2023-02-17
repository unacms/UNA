import { Text as NativeText, Platform, Linking, TextStyle, Button } from 'react-native'
import { styled, StyledProps } from 'nativewind'

export const MainButton = styled(Button, 'text-white bg-blue-600 hover:bg-blue-700 border border-gray-900/20 dark:border-white/20 focus:ring-4 shadow-sm hover:shadow-md active:shadow-sm hover:-translate-y-0.5 active:translate-y-0 duration-200 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm @xl/cell:w-auto px-5 py-2.5 text-center dark:focus:ring-blue-800')

