// Web-compatible implementations of nativewind/theme utilities
// These functions work in both native (via nativewind) and web (via fallback)

// hairlineWidth returns the thinnest possible border width
// On native: 1/PixelRatio, on web: 1px
function hairlineWidth() {
    return '1px';
}

// platformSelect returns the appropriate value for the current platform
// On web, we always return the 'default' value (or fallback to 'web', then first available)
function platformSelect(options) {
    if (options.default !== undefined) return options.default;
    if (options.web !== undefined) return options.web;
    return options.ios || options.android || '';
}

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

    default: {
        DEFAULT: withOpacity('default'),
        foreground: withOpacity('default-foreground'),
    },
    segment: {
        DEFAULT: withOpacity('segment'),
        foreground: withOpacity('segment-foreground'),
    },
  
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
    link: {
        primary: withOpacity('link-primary'),
        secondary: withOpacity('link-secondary'),
        tertiary: withOpacity('link-tertiary'),
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
        0: withOpacity('neutral-0'),
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
        1000: withOpacity('neutral-1000'),
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

module.exports = {
    nativewindUITheme,
    nativewindUIColors,
    withOpacity,
};