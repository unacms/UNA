// Native: the real react-navigation base themes (expo-router re-export), so the
// object shape stays whatever the installed navigation version expects.
// Web uses navigation-theme.web.ts — same values inlined, which keeps the whole
// react-navigation core (~150 modules) out of the Next bundle.
export { DarkTheme, DefaultTheme } from 'expo-router/react-navigation'
