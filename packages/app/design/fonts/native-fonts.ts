import { Platform } from 'react-native';
import { Uniwind } from 'uniwind';
import { nativeFontFamily } from 'app/design/fonts/font-choice';

const platform = Platform.OS === 'android' ? 'android' : 'ios';

/** fontFamily of each role on this device (customization/config/fonts.js). */
export const nativeFonts = {
    main: nativeFontFamily('main', platform) as string,
    title: nativeFontFamily('title', platform) as string,
};

function setFontVariables() {
    const variables = {
        '--neo-font-main': nativeFonts.main,
        '--neo-font-title': nativeFonts.title,
    };
    for (const theme of Uniwind.themes) {
        Uniwind.updateCSSVariables(theme, variables);
    }
}

let applied = false;

/**
 * Point the `font-main` / `font-title` utilities (global.combined.css) at the
 * configured families. Call once at startup, before the first render.
 *
 * Uniwind rebuilds its variables from the stylesheet whenever the CSS module
 * loads (after this runs) and on CSS fast refresh, so set them again after
 * every re-init.
 */
export function applyNativeFonts() {
    if (applied) return;
    applied = true;
    setFontVariables();
    const uniwind = Uniwind as unknown as { __reinit: (...args: unknown[]) => void };
    const reinit = uniwind.__reinit;
    uniwind.__reinit = function (...args: unknown[]) {
        reinit.apply(this, args);
        setFontVariables();
    };
}
