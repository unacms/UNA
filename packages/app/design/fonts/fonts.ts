/**
 * Fonts loaded at runtime on native (expo-font useFonts, nav/tabs), as Metro
 * asset module ids. The app's text fonts are not here: they are embedded at
 * build time per customization/config/fonts.js (plugins/with-app-fonts.js).
 */
const fonts: Record<string, number> = {
    // 'font-main': require('app/design/fonts/Inter-VariableFont.ttf'),
    // 'font-title': require('app/design/fonts/Lexend-VariableFont_wght.ttf'),
}

export { fonts }
