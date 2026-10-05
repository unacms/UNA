import { settingsButtons } from 'app/settings/theme/buttons'; 
import { settingsExpoUi } from 'app/settings/theme/expo_ui';
import { settingsProfiles } from 'app/settings/theme/profiles';
import { settingsBadges } from 'app/settings/theme/badges';
import { settingsLinks } from 'app/settings/theme/links';
import { settingsTabs } from 'app/settings/theme/tabs';
import { settingsInputs } from 'app/settings/theme/inputs';
import { settingsElements } from 'app/settings/theme/elements';
import { settingsAccordion } from 'app/settings/theme/accordion';

export const settingsTheme = {  
    theme: {
        light: {
            default: 'rgba(3,7,18,1)',
            primary: 'rgba(37, 99, 235, 1)',
            outline: 'rgba(37, 99, 235, 0.5)',
            headerBackground: 'rgba(255,255,255,1)',
            barsBackground: 'rgba(255,255,255,1)', //header and tabbar background in native light mode
            bottomSheetBackground: 'rgba(255,255,255,1)',
            barsColor: '#4B5563',
            safeAreaBackground: 'rgba(255,255,255,1)', // Add this new property
            primaryBg: 'rgba(37,99,235,0.1)',
        },
        dark: {
            default: 'rgba(209,213,219,1)', //fix for icons color in iOS
            primary: 'rgba(59, 130, 246, 1)',
            outline: 'rgba(59, 130, 246, 0.5)',
            headerBackground: 'rgba(24,24,27,1)',
            barsBackground: 'rgba(24,24,27,1)', //header background in native
            bottomSheetBackground: 'rgba(24,24,27,1)',
            barsColor: 'rgba(161,161,170,1)', //tabbar icons color in native
            safeAreaBackground: 'rgba(24,24,27,1)', // Add this new property
            primaryBg: 'rgba(37,99,235,0.1)',
        },
        // Web: `corner-shape: superellipse` + radius multiplier (global.web.css).
        // iOS: `borderCurve: 'continuous'` on design View / inputs.
        // Set `enabled: false` to use plain CSS border-radius / no continuous curve.
        corner_smoothing: {
            enabled: true,
            factor: 1.6,
            full_factor: 1,
        },
        native_tabs: {
            tabBarItemStyle: {
                marginBottom: 0,
                height: 48,
                marginTop: 4,
                paddingBottom: 0,
                borderRadius: 12,
                marginLeft: 0,
                marginRight: 0,
                overflow: 'hidden',
            },
            // Tab badge fill: a hex or a `bg-*` token (web footer badges use `bg-destructive`).
            badgeBackground: 'bg-destructive',
            badgeTextSize: 'text-xs leading-4 font-semibold', // Customizable text size for badge
            // Selected tab (JS tabs and NativeTabs) and selected More sheet rows:
            // the toggled look of selected glass buttons — indicator / row fill
            // and icon / label ink. Hex or `bg-*` / `text-*` tokens.
            selected: { indicator: 'bg-accent', foreground: 'text-accent-foreground' },
        },
        ...settingsButtons,
        ...settingsExpoUi,
        ...settingsProfiles,
        ...settingsBadges,
        ...settingsLinks,
        ...settingsTabs,
        ...settingsInputs,
        ...settingsElements,
        ...settingsAccordion,
    }
}