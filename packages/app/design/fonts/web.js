import { Inter } from 'next/font/google';
import { appSetting } from 'app/lib/util';

const DEFAULT_TOKENS = ['font-main', 'font-title'];

const defaultFontMain = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-main',
});

const defaultFontTitle = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-title',
});

const rawOverrides = appSetting('web', 'fonts');
const fontOverrides = rawOverrides && typeof rawOverrides === 'object' ? rawOverrides : {};

function isNextFontInstance(value) {
    return value && typeof value.className === 'string';
}

const registry = {
    'font-main': isNextFontInstance(fontOverrides['font-main']) ? fontOverrides['font-main'] : defaultFontMain,
    'font-title': isNextFontInstance(fontOverrides['font-title']) ? fontOverrides['font-title'] : defaultFontTitle,
};

Object.entries(fontOverrides).forEach(([token, override]) => {
    if (isNextFontInstance(override)) {
        registry[token] = override;
    } else if (typeof override === 'string' && registry[override]) {
        registry[token] = registry[override];
    }
});

function normalizeUseCustomFont(value) {
    if (!value) return [];
    if (value === true) return ['font-main'];
    if (Array.isArray(value)) return value.filter(Boolean);
    return [value].filter(Boolean);
}

const configuredFontTokens = normalizeUseCustomFont(appSetting('web', 'use_custom_font'));
const tokens = Array.from(new Set([...DEFAULT_TOKENS, ...configuredFontTokens]));

export function getWebFontRegistry() {
    return registry;
}

export function getWebFontTokensToLoad() {
    return tokens;
}

export function getWebFontsForLayout() {
    const fonts = tokens
        .map((token) => registry[token])
        .filter(Boolean);

    const className = fonts
        .map((font) => font.className)
        .filter(Boolean)
        .join(' ')
        .trim();

    const variable = fonts
        .map((font) => font.variable)
        .filter(Boolean)
        .join(' ')
        .trim();

    return {
        fonts,
        className,
        variable,
    };
}
