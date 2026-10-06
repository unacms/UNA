// Native: the real react-navigation base themes (expo-router re-export), so the
// object shape stays whatever the installed navigation version expects.
// Web uses navigation-theme.web.ts — same values inlined, which keeps the whole
// react-navigation core (~150 modules) out of the Next bundle.
import { DarkTheme as NavDarkTheme, DefaultTheme as NavDefaultTheme } from 'expo-router/react-navigation'
import { fontChoice } from 'app/design/fonts/font-choice'
import { nativeFonts } from 'app/design/fonts/native-fonts'
import { Platform } from 'react-native'

type NavTheme = typeof NavDefaultTheme

// Headers and tab labels: the main font when it is a custom family; otherwise
// react-navigation's own platform fonts.
const usesCustomFont = fontChoice('main', Platform.OS === 'android' ? 'android' : 'ios') !== 'system'

function withAppFonts(theme: NavTheme): NavTheme {
    if (!usesCustomFont) return theme
    const fonts = Object.fromEntries(
        Object.entries(theme.fonts).map(([key, font]) => [key, { ...font, fontFamily: nativeFonts.main }])
    ) as NavTheme['fonts']
    return { ...theme, fonts }
}

export const DefaultTheme = withAppFonts(NavDefaultTheme)
export const DarkTheme = withAppFonts(NavDarkTheme)
