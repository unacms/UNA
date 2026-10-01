import { StyleSheet } from 'react-native';
import { useResolveClassNames } from 'uniwind';
import { useThemeValue } from 'app/design/theme';
import { toHexColor } from 'app/lib/platform/native-color';

/*
 * `expo_ui.button.iosColors` / `androidColors` values are a literal color
 * (`#dbeafe`) or a theme class (`bg-accent`, `text-accent-foreground`). Native
 * Hosts take hex only — CSS variables do not resolve inside them — so classes
 * are resolved here through Uniwind. They follow the CSS tokens: light / dark,
 * and whatever palette a branch project themes.
 */

type Palette = Record<string, unknown>;

/** `bg-*` / `text-*` theme class (variant prefixes allowed), as opposed to a literal color. */
const TOKEN_CLASS = /^(?:[\w-]+:)*(bg|text)-\S+$/;

/** One palette value → hex: `bg-*` gives its background, `text-*` its text color. */
export function useNativeTokenColor(value: unknown): unknown {
    const match = typeof value === 'string' ? TOKEN_CLASS.exec(value.trim()) : null;
    const style = StyleSheet.flatten(useResolveClassNames(match ? (value as string) : ''));
    if (!match) return value;
    const color = match[1] === 'bg' ? style?.backgroundColor : style?.color;
    return toHexColor(color) ?? undefined;
}

/** The light / dark entry of a `{ default, dark }` palette; a flat palette serves both. */
function useSchemeEntry(palette: unknown): unknown {
    const scheme = palette && typeof palette === 'object' && ('default' in palette || 'dark' in palette)
        ? (palette as { default?: unknown; dark?: unknown })
        : { default: palette };
    return useThemeValue(scheme.default, scheme.dark);
}

/** Replace the given keys that the entry defines with their resolved colors. */
function withResolved(entry: unknown, resolved: Palette): unknown {
    if (!entry || typeof entry !== 'object') return entry;
    const out: Palette = { ...(entry as Palette) };
    for (const key of Object.keys(resolved)) {
        if (key in out) out[key] = resolved[key];
    }
    return out;
}

/** An `iosColors` palette (`{ tint, foreground }`) for the current scheme, as hex. */
export function useIosStyleColors(palette: unknown): unknown {
    const entry = useSchemeEntry(palette) as Palette | undefined;
    const tint = useNativeTokenColor(entry?.tint);
    const foreground = useNativeTokenColor(entry?.foreground);
    return withResolved(entry, { tint, foreground });
}

/** An `androidColors` variant palette for the current scheme, as hex. */
export function useAndroidStyleColors(palette: unknown): unknown {
    const entry = useSchemeEntry(palette) as Palette | undefined;
    const containerColor = useNativeTokenColor(entry?.containerColor);
    const contentColor = useNativeTokenColor(entry?.contentColor);
    const tintedContainerColor = useNativeTokenColor(entry?.tintedContainerColor);
    const tintedContentColor = useNativeTokenColor(entry?.tintedContentColor);
    return withResolved(entry, { containerColor, contentColor, tintedContainerColor, tintedContentColor });
}
