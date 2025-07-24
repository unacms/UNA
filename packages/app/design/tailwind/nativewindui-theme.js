const { hairlineWidth, platformSelect } = require('nativewind/theme');

// Official NativewindUI withOpacity function (matches their documentation)
function withOpacity(variableName) {
    return ({ opacityValue }) => {
        if (opacityValue !== undefined) {
            return platformSelect({
                ios: `rgb(var(--${variableName}) / ${opacityValue})`,
                android: `rgb(var(--android-${variableName}) / ${opacityValue})`,
                default: `rgb(var(--${variableName}) / ${opacityValue})`,
            });
        }
        return platformSelect({
            ios: `rgb(var(--${variableName}))`,
            android: `rgb(var(--android-${variableName}))`,
            default: `rgb(var(--${variableName}))`,
        });
    };
}

// NativewindUI color system - matches official documentation
const nativewindUIColors = {
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