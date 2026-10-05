// Web copy of react-navigation's DefaultTheme / DarkTheme (expo-router 57,
// build/react-navigation/native/theming). `useTheme()` in design/theme.ts only
// spreads these as a base under the app's own colors; importing them from
// 'expo-router/react-navigation' pulled the entire navigation core into the web
// bundle. Keep in sync with the native module if react-navigation changes shape.
import type { TextStyle } from 'react-native'

const WEB_FONT_STACK =
    'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"'

type NavFont = {
    fontFamily: string
    fontWeight: TextStyle['fontWeight']
}

type NavTheme = {
    dark: boolean
    colors: {
        primary: string
        background: string
        card: string
        text: string
        border: string
        notification: string
    }
    fonts: {
        regular: NavFont
        medium: NavFont
        bold: NavFont
        heavy: NavFont
    }
}

const fonts: NavTheme['fonts'] = {
    regular: { fontFamily: WEB_FONT_STACK, fontWeight: '400' },
    medium: { fontFamily: WEB_FONT_STACK, fontWeight: '500' },
    bold: { fontFamily: WEB_FONT_STACK, fontWeight: '600' },
    heavy: { fontFamily: WEB_FONT_STACK, fontWeight: '700' },
}

export const DefaultTheme: NavTheme = {
    dark: false,
    colors: {
        primary: 'rgb(0, 122, 255)',
        background: 'rgb(242, 242, 242)',
        card: 'rgb(255, 255, 255)',
        text: 'rgb(28, 28, 30)',
        border: 'rgb(216, 216, 216)',
        notification: 'rgb(255, 59, 48)',
    },
    fonts,
}

export const DarkTheme: NavTheme = {
    dark: true,
    colors: {
        primary: 'rgb(10, 132, 255)',
        background: 'rgb(1, 1, 1)',
        card: 'rgb(18, 18, 18)',
        text: 'rgb(229, 229, 231)',
        border: 'rgb(39, 39, 41)',
        notification: 'rgb(255, 69, 58)',
    },
    fonts,
}
