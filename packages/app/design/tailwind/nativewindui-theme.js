import { hairlineWidth, platformSelect } from 'nativewind/theme';

// Enhanced withOpacity function (handles both RGB and RGBA colors)
function withOpacity(variableName) {
    return ({ opacityValue }) => {
        if (opacityValue !== undefined) {
            // For dynamic opacity (e.g., bg-primary/50)
            return platformSelect({
                ios: `rgb(var(--${variableName}) / ${opacityValue})`,
                android: `rgb(var(--android-${variableName}) / ${opacityValue})`,
                default: `rgb(var(--${variableName}) / ${opacityValue})`,
            });
        }
        // Default: return a valid CSS color using rgb() wrapper so all Tailwind utilities work (e.g., ring-*, border-*)
        return platformSelect({
            ios: `rgb(var(--${variableName}))`,
            android: `rgb(var(--android-${variableName}))`,
            default: `rgb(var(--${variableName}))`,
        });
    };
}

// NativewindUI color system - matches official documentation
const nativewindUIColors = {
    // 🎨 Core semantic tokens (existing)
    border: withOpacity('border'),
    input: withOpacity('input'),
    ring: withOpacity('ring'),
    background: withOpacity('background'),
    foreground: withOpacity('foreground'),
  
    primary: {
        DEFAULT: withOpacity('primary'),
        foreground: withOpacity('primary-foreground'),
    },
   
    secondary: {
        DEFAULT: withOpacity('secondary'),
        foreground: withOpacity('secondary-foreground'),
    },
    destructive: {
        DEFAULT: withOpacity('destructive'),
        foreground: withOpacity('destructive-foreground'),
    },
    muted: {
        DEFAULT: withOpacity('muted'),
        foreground: withOpacity('muted-foreground'),
    },
    
    accent: {
        DEFAULT: withOpacity('accent'),
        foreground: withOpacity('accent-foreground'),
    },
    popover: {
        DEFAULT: withOpacity('popover'),
        foreground: withOpacity('popover-foreground'),
        50: withOpacity('accent-50'),
        100: withOpacity('accent-100'),
        200: withOpacity('accent-200'),
        300: withOpacity('accent-300'),
        400: withOpacity('accent-400'),
        500: withOpacity('accent-500'),
        600: withOpacity('accent-600'),
        700: withOpacity('accent-700'),
        800: withOpacity('accent-800'),
        900: withOpacity('accent-900'),
        950: withOpacity('accent-950'),
    },
    card: {
        DEFAULT: withOpacity('card'),
        foreground: withOpacity('card-foreground'),
    },
    label: {
        primary: withOpacity('label-primary'),
        secondary: withOpacity('label-secondary'),
        tertiary: withOpacity('label-tertiary'),
        link: withOpacity('label-link'),
        linkhover: withOpacity('label-linkhover'),
        
    },
   
    guide: withOpacity('guide'),
    
    fill: {
        primary: withOpacity('fill-primary'),
        secondary: withOpacity('fill-secondary'),
        tertiary: withOpacity('fill-tertiary'),
    },
    shadow: {
        DEFAULT: withOpacity('shadow'),
        xs: withOpacity('shadow-xs'),
        sm: withOpacity('shadow-sm'),
        md: withOpacity('shadow-md'),
        lg: withOpacity('shadow-lg'),
        xl: withOpacity('shadow-xl'),
        '2xl': withOpacity('shadow-2xl'),
    },
    neutral: {
        DEFAULT: withOpacity('neutral'),
        50: withOpacity('neutral-50'),
        100: withOpacity('neutral-100'),
        200: withOpacity('neutral-200'),
        300: withOpacity('neutral-300'),
        400: withOpacity('neutral-400'),
        500: withOpacity('neutral-500'),
        600: withOpacity('neutral-600'),
        700: withOpacity('neutral-700'),
        800: withOpacity('neutral-800'),
        900: withOpacity('neutral-900'),
        950: withOpacity('neutral-950'),
    },

    // Raw state colors
    green: withOpacity('green'),
    yellow: withOpacity('yellow'),
    blue: withOpacity('blue'),
};

// NativewindUI theme extension
const nativewindUITheme = {
    borderWidth: {
        hairline: hairlineWidth(),
    },
    colors: nativewindUIColors,
};

export {
    nativewindUITheme,
    nativewindUIColors,
    withOpacity,
};