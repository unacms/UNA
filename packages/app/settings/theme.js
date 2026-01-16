import { settingsButtons } from 'app/settings/theme/buttons'; 
import { settingsProfiles } from 'app/settings/theme/profiles';
import { settingsBadges } from 'app/settings/theme/badges';
import { settingsLinks } from 'app/settings/theme/links';
import { settingsTabs } from 'app/settings/theme/tabs';
import { settingsInputs } from 'app/settings/theme/inputs';
import { settingsElements } from 'app/settings/theme/elements';

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
        offsets: {
            'gap-lg': 'gap-4',
            'gap-md': 'gap-3',
            'gap-sm': 'gap-2',
            'gap-xs': 'gap-1',
            'm-lg': 'm-4',
            'm-md': 'm-3',
            'm-sm': 'm-2',
            'm-xs': 'm-1',
            'mb-lg': 'mb-4',
            'mb-md': 'mb-3',
            'mb-sm': 'mb-2',
            'mb-xs': 'mb-1',
            'mt-lg': 'mt-4 ',
            'mt-md': 'mt-3 ',
            'mt-sm': 'mt-2 ',
            'mt-xs': 'mt-1',
            'p-lg': 'p-4',
            'p-md': 'p-3',
            'p-sm': 'p-2',
            'p-xs': 'p-1',
            'pb-lg': 'pb-4',
            'pb-md': 'pb-3',
            'pb-sm': 'pb-2',
            'pt-lg': 'pt-4',
            'pt-md': 'pt-3',
            'pt-sm': 'pt-2',
            'pt-xs': 'pt-1',
            'px-lg': 'px-4',
            'px-md': 'px-3',
            'px-sm': 'px-2',
            'px-xs': 'px-1',
            'py-lg': 'py-4',
            'py-md': 'py-3',
            'py-sm': 'py-2',
            'py-xs': 'py-1',
            'w-lg': 'w-4',
            'w-md': 'w-3',
            'w-sm': 'w-2',
        },
        corner_smoothing: {
            enabled: true,  
            factor: 2,
            full_factor: 1.3,
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
            badgeBackground: 'rgba(239,68,68,1)', // Red color by default
            badgeTextSize: 'text-xs leading-4 font-semibold', // Customizable text size for badge
        },
        ...settingsButtons,
        ...settingsProfiles,
        ...settingsBadges,
        ...settingsLinks,
        ...settingsTabs,
        ...settingsInputs,
        ...settingsElements,    
    }
}