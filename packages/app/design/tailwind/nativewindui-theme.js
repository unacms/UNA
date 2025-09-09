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
    },
    card: {
        DEFAULT: withOpacity('card'),
        foreground: withOpacity('card-foreground'),
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