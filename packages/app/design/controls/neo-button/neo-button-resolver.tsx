/**
 * NeoButton resolver.
 *
 * The `neo_button` theme tree (see
 * `packages/app/settings/theme/buttons.js`) lets any leaf be a scope-keyed
 * object such as:
 *
 *   { default: 44, web: 40, mouse: 38, lg: 36, ios: 44 }
 *
 * `resolveScoped(value, ctx)` flattens that into a single value by walking
 * the scopes in precedence order:
 *
 *   default → platform (native then specific) → pointer → breakpoint
 *   (smallest applicable to current, so larger overrides smaller, like Tailwind)
 *   → controlSize
 *
 * Light/dark is not a resolveScoped axis — use `useThemeValue` like the
 * rest of the app.
 *
 * `useResolvedNeoButton(props)` reads the env (Platform.OS, breakpoint,
 * pointer capability, theme) and the two context providers
 * (`NeoButtonStyleProvider`, `NeoControlSizeProvider`) and returns a flat
 * config the renderer can consume directly:
 *
 *   {
 *     style, controlSize, borderShape, role,
 *     containerCls, textCls, height, paddingX, font, icon, hitSlop, labelGap,
 *     rounded, aspectSquare,
 *     transition,                   // { press, hover, appear }
 *     behaviors,                    // { hover, focusRing, pressAnimation, longPress }
 *     tint, defaultImage,
 *     nativeMapping,                // SwiftUI/@expo/ui modifier set
 *   }
 *
 * Behavioral filtering is the key payoff: the renderer attaches
 * onMouseEnter/onMouseLeave only when `behaviors.hover` is true, so
 * web-only handlers stop "creeping into native".
 */

import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { useWindowWidth, useIsDesktop } from 'app/context/measure';
import { appSetting, getBreakpoint, isExpoUI } from 'app/lib/util';
import { ThemeName, useThemeValue } from 'app/design/theme';
import type { NeoButtonAddon, NeoButtonProps } from 'app/design/controls/neo-button/neo-button.types';
import { LEGACY_TO_CONTROL_SIZE, MIN_TARGET, hitSlopForHeight } from 'app/design/controls/neo-button/control-scale';

/** Scopes resolveScoped() walks; any axis may be missing. */
export type NeoScopeContext = {
    platform?: 'web' | 'ios' | 'android';
    pointer?: 'touch' | 'mouse';
    breakpoint?: string;
    theme?: 'light' | 'dark';
    isDesktop?: boolean;
    hydrated?: boolean;
    controlSize?: string;
};

/* ----------------------------- scope plumbing ----------------------------- */

const PLATFORM_KEYS = new Set(['web', 'ios', 'android', 'native']);
const POINTER_KEYS  = new Set(['touch', 'mouse']);
const BP_ORDER      = ['sm', 'md', 'lg', 'xl', '2xl'];
const BP_KEYS       = new Set(BP_ORDER);
const SIZE_KEYS     = new Set(['mini', 'small', 'regular', 'large', 'xlarge']);

const SCOPE_KEYS = new Set([
    'default',
    ...PLATFORM_KEYS, ...POINTER_KEYS, ...BP_KEYS, ...SIZE_KEYS,
]);

/* --------------------- numeric → utility-class maps ----------------------- *
 * NeoButton sizing lives as NUMBERS in `neo_button.controlSizes` (the single
 * source of truth). The renderer prefers utility classes over inline styles,
 * so we translate those numbers into STATIC Tailwind/Uniwind class strings
 * here — the same way the resolver already returns `rounded` / `fontCls`.
 *
 * The literals must stay static so Tailwind v4 (web) and Uniwind (native)
 * `@source` scanning emits them. A value missing from a map resolves to
 * `undefined`, and the renderer falls back to an inline style for that prop so
 * nothing silently breaks. Spacing scale: 1 unit = 0.25rem = 4px
 * (so 44px → 11, 12px → px-3, 8px gap → gap-x-2, etc.).
 */
const MIN_SIZE_CLASS: Record<number, string> = {
    28: 'min-h-7 min-w-7',
    32: 'min-h-8 min-w-8',
    36: 'min-h-9 min-w-9',
    40: 'min-h-10 min-w-10',
    44: 'min-h-11 min-w-11',
    52: 'min-h-13 min-w-13',
    60: 'min-h-15 min-w-15',
    64: 'min-h-16 min-w-16',
};
const FIXED_SIZE_CLASS: Record<number, string> = {
    28: 'h-7 w-7',
    32: 'h-8 w-8',
    36: 'h-9 w-9',
    40: 'h-10 w-10',
    44: 'h-11 w-11',
    52: 'h-13 w-13',
    60: 'h-15 w-15',
    64: 'h-16 w-16',
};
const PADDING_X_CLASS: Record<number, string> = {
    0: 'px-0',
    8: 'px-2',
    10: 'px-2.5',
    12: 'px-3',
    16: 'px-4',
    20: 'px-5',
    24: 'px-6',
    32: 'px-8',
};
const LABEL_GAP_CLASS: Record<number, string> = {
    0: 'gap-x-0',
    4: 'gap-x-1',
    6: 'gap-x-1.5',
    8: 'gap-x-2',
    10: 'gap-x-2.5',
    12: 'gap-x-3',
};
// Web-only: maps `hitSlop` (px) → `hit-area-*` utility (see global.css).
// `0` → no class (native still receives hitSlop={0} via the prop).
const HIT_AREA_CLASS: Record<number, string> = {
    0: '',
    2: 'hit-area-2',
    4: 'hit-area-4',
    6: 'hit-area-6',
    8: 'hit-area-8',
    10: 'hit-area-10',
    14: 'hit-area-14',
};

/* ------------------------- dev-only drift guard --------------------------- */

const DEV = process.env.NODE_ENV !== 'production';
const warnedOnce = new Set<string>();

function warnOnce(message: string) {
    if (warnedOnce.has(message)) return;
    warnedOnce.add(message);
    console.warn(message);
}

/**
 * Warns once per size when the theme scale drifts: a target under MIN_TARGET,
 * or a number with no static utility class (the renderer then falls back to
 * inline styles, and web loses the `hit-area-*` class).
 */
function checkScaleOnce(controlSize: string, { height, paddingX, labelGap, hitSlop }: {
    height: number; paddingX: number; labelGap: number; hitSlop: number;
}) {
    const problems: string[] = [];
    if (height + 2 * hitSlop < MIN_TARGET) problems.push(`target ${height}+2×${hitSlop} < ${MIN_TARGET}`);
    if (!MIN_SIZE_CLASS[height] || !FIXED_SIZE_CLASS[height]) problems.push(`no size class for height ${height}`);
    if (PADDING_X_CLASS[paddingX] === undefined) problems.push(`no px-* class for paddingX ${paddingX}`);
    if (LABEL_GAP_CLASS[labelGap] === undefined) problems.push(`no gap-x-* class for labelGap ${labelGap}`);
    if (hitSlop > 0 && !HIT_AREA_CLASS[hitSlop]) problems.push(`no hit-area-* class for hitSlop ${hitSlop}`);
    if (problems.length) warnOnce(`[NeoButton] controlSize "${controlSize}": ${problems.join('; ')}`);
}

const isPlainObject = (v: unknown): v is Record<string, any> =>
    !!v && typeof v === 'object' && !Array.isArray(v) && !React.isValidElement(v);

const hasScopeKey = (obj: Record<string, any>) => {
    for (const k of Object.keys(obj)) if (SCOPE_KEYS.has(k)) return true;
    return false;
};

const mergeOrReplace = (left: any, right: any): any => {
    if (right === undefined) return left;
    if (!isPlainObject(left) || !isPlainObject(right)) return right;
    const out: Record<string, any> = { ...left };
    for (const k of Object.keys(right)) {
        out[k] = mergeOrReplace(out[k], right[k]);
    }
    return out;
};

/**
 * Recursively flatten a scope-keyed value against the resolver context.
 * Returns the value untouched if it's a primitive / array / element / a
 * plain object without any scope keys.
 */
export function resolveScoped(value: any, ctx: NeoScopeContext): any {
    if (!isPlainObject(value)) return value;
    if (!hasScopeKey(value)) {
        // Plain nested object — recurse into each entry so deeper leaves
        // still resolve.
        const out: Record<string, any> = {};
        for (const k of Object.keys(value)) out[k] = resolveScoped(value[k], ctx);
        return out;
    }

    let result = 'default' in value ? resolveScoped(value.default, ctx) : undefined;

    if (ctx.platform) {
        if (ctx.platform !== 'web' && 'native' in value) {
            result = mergeOrReplace(result, resolveScoped(value.native, ctx));
        }
        if (PLATFORM_KEYS.has(ctx.platform) && ctx.platform in value) {
            result = mergeOrReplace(result, resolveScoped(value[ctx.platform], ctx));
        }
    }

    if (ctx.pointer && POINTER_KEYS.has(ctx.pointer) && ctx.pointer in value) {
        result = mergeOrReplace(result, resolveScoped(value[ctx.pointer], ctx));
    }

    if (ctx.breakpoint) {
        const bpIdx = BP_ORDER.indexOf(ctx.breakpoint);
        if (bpIdx >= 0) {
            for (let i = 0; i <= bpIdx; i++) {
                const bp = BP_ORDER[i]!;
                if (bp in value) {
                    result = mergeOrReplace(result, resolveScoped(value[bp], ctx));
                }
            }
        }
    }

    if (ctx.controlSize && SIZE_KEYS.has(ctx.controlSize) && ctx.controlSize in value) {
        result = mergeOrReplace(result, resolveScoped(value[ctx.controlSize], ctx));
    }

    return result;
}

/* ----------------------------- env detection ------------------------------ */

const isWeb = Platform.OS === 'web';

/**
 * Has the component hydrated yet? Returns `false` on the server and on the
 * first client render (so SSR-derived markup matches), `true` after mount.
 * Used by the env hooks below so any value that depends on `window` /
 * `matchMedia` / measured dimensions stays SSR-stable through hydration.
 */
function useIsHydrated() {
    const [hydrated, setHydrated] = React.useState(false);
    React.useEffect(() => {
        setHydrated(true);
    }, []);
    return hydrated;
}

/**
 * Pointer capability ('touch' | 'mouse').
 * Web: `(pointer: coarse)` media query. Native: always `'touch'`.
 * (tvOS would be `'mouse'` via the focus engine — out of scope for now.)
 *
 * SSR-safe: the initial state matches what the server renders ('mouse' on
 * web, 'touch' on native). The real value is read inside `useEffect` so the
 * first client render is identical to the server, then we sync.
 */
export function usePointerCapability() {
    const ssrDefault = isWeb ? 'mouse' : 'touch';
    const [pointer, setPointer] = React.useState<'touch' | 'mouse'>(ssrDefault);

    React.useEffect(() => {
        if (!isWeb || typeof window === 'undefined' || !window.matchMedia) return;
        const mq = window.matchMedia('(pointer: coarse)');
        const update = () => setPointer(mq.matches ? 'touch' : 'mouse');
        update();
        if (mq.addEventListener) mq.addEventListener('change', update);
        else if (mq.addListener) mq.addListener(update);
        return () => {
            if (mq.removeEventListener) mq.removeEventListener('change', update);
            else if (mq.removeListener) mq.removeListener(update);
        };
    }, []);

    return pointer;
}

/**
 * Theme name normalised to 'light' | 'dark'.
 */
function useThemeName(): 'light' | 'dark' {
    const t = ThemeName();
    return t === 'dark' ? 'dark' : 'light';
}

/**
 * Build the resolver context for the current render.
 *
 * SSR safety: `breakpoint`, `pointer`, and `theme` all stay at their
 * SSR-stable defaults during the first client render and only switch to
 * the real measured values after `useIsHydrated()` flips true. Without
 * this gate, the resolver would emit different per-pointer / per-breakpoint
 * classes on the server vs the first hydration render and React would
 * complain (the symptom: "Hydration failed because the server rendered
 * text didn't match the client" with the resolver-debug strip showing
 * `(below sm)` from the server and `2xl` from the client).
 */
export function useNeoEnv() {
    const hydrated = useIsHydrated();

    const platform: 'web' | 'ios' | 'android' = isWeb ? 'web' : (Platform.OS === 'ios' ? 'ios' : 'android');
    const measuredIsDesktop = useIsDesktop();

    const width = useWindowWidth();
    const measuredBreakpoint = useMemo(() => getBreakpoint(width) || '', [width]);
    const measuredTheme = useThemeName();
    const measuredPointer = usePointerCapability();

    // On the server (and during first client render before useEffect runs)
    // we always emit `isWeb ? desktop : mobile` so the rendered tree shape
    // (Tooltip wrapper, etc.) is identical across SSR boundary.
    const breakpoint = hydrated ? measuredBreakpoint : '';
    // Native has no SSR — do not pin light for a frame or Expo UI Host
    // captures light iosColors and never picks up dark selected glass.
    const theme: 'light' | 'dark' = (hydrated || !isWeb) ? measuredTheme : 'light';
    const pointer: 'touch' | 'mouse' = hydrated ? measuredPointer : (isWeb ? 'mouse' : 'touch');
    const isDesktop  = hydrated ? measuredIsDesktop  : isWeb;

    return useMemo(
        () => ({ platform, pointer, breakpoint, theme, isDesktop, hydrated }),
        [platform, pointer, breakpoint, theme, isDesktop, hydrated],
    );
}

/* --------------------------- context providers ---------------------------- */

const NeoButtonStyleContext = createContext<string | null>(null);
const NeoControlSizeContext = createContext<string | null>(null);

export function NeoButtonStyleProvider({ style, children }: { style: string | null; children?: ReactNode }) {
    return (
        <NeoButtonStyleContext.Provider value={style}>
            {children}
        </NeoButtonStyleContext.Provider>
    );
}

export function NeoControlSizeProvider({ size, children }: { size: string | null; children?: ReactNode }) {
    return (
        <NeoControlSizeContext.Provider value={size}>
            {children}
        </NeoControlSizeContext.Provider>
    );
}

export const useNeoButtonStyle = () => useContext(NeoButtonStyleContext);
export const useNeoControlSize = () => useContext(NeoControlSizeContext);

/* ------------------------------- main hook -------------------------------- */

const SWIFTUI_BUTTON_STYLE: Record<string, string> = {
    plain: 'plain',
    // `.bordered` tints a translucent wash — palette `--button` (#e4e4e7)
    // would not match JS `bg-button`. `.borderedProminent` paints that hex
    // as a solid fill.
    bordered: 'borderedProminent',
    borderedProminent: 'borderedProminent',
    borderless: 'borderless',
    link: 'borderless',          // SwiftUI has no .link; .borderless is closest
    glass: 'glass',
    glassProminent: 'glassProminent',
};

const FALLBACK_STYLE = 'bordered';

// SwiftUI .plain — no hover wash (see `styles.plain` container slots). `link`
// uses theme `container.hovered` on web; do not list it here.
const STYLES_WITHOUT_HOVER = new Set(['plain']);

const GLASS_STYLES = new Set(['glass', 'glassProminent']);

const SWIFTUI_CONTROL_SIZE: Record<string, string> = {
    mini: 'mini',
    small: 'small',
    regular: 'regular',
    large: 'large',
    xlarge: 'extraLarge',
};

const SWIFTUI_BORDER_SHAPE: Record<string, string> = {
    capsule: 'capsule',
    rectangle: 'rectangle',
    roundedRectangle: 'roundedRectangle',
    circle: 'circle',
};

/**
 * Walks a slot map ({ base, default, hovered, focused, pressed, active,
 * pressedToggle, disabled }) and resolves each entry against ctx, then
 * concatenates `base` + the entry for the current state.
 */
function resolveSlot(slotMap: Record<string, any> | undefined, state: string, ctx: NeoScopeContext): string {
    if (!slotMap) return '';
    const base = resolveScoped(slotMap.base, ctx) || '';
    const stateVal = resolveScoped(slotMap[state], ctx);
    const fallback = state !== 'default' ? resolveScoped(slotMap.default, ctx) : undefined;
    const main = (stateVal !== undefined ? stateVal : fallback) || '';
    return [base, main].filter(Boolean).join(' ');
}

/**
 * Pick the effective button style.
 *
 * Precedence:
 *   1. explicit `props.style`
 *   2. nearest `<NeoButtonStyleProvider style="...">` in the tree
 *   3. role's `defaultStyle` (e.g. `confirm` → `borderedProminent`)
 *   4. `defaults.style` from the theme tree
 *   5. hard fallback `bordered`
 *
 * If a recognised style is not found in the styles tree (typo, legacy
 * `automatic`, etc.), we fall back to `bordered` so the button still
 * renders something usable instead of going completely unstyled.
 */
function normalizeStyleProp(value: unknown): string | undefined {
    // React Native `Link`/`Pressable` also use a `style` prop (object/array).
    // When `NeoButtonLink` is rendered with `asChild`, that layout `style` can
    // overwrite the SwiftUI-style string — ignore non-strings here.
    return typeof value === 'string' ? value : undefined;
}

function resolveStyle({ propStyle, providerStyle, defaultsStyle, roleConfig, stylesTree }: {
    propStyle?: string;
    providerStyle?: string | null;
    defaultsStyle?: string;
    roleConfig?: Record<string, any>;
    stylesTree?: Record<string, any>;
}): string {
    const candidate =
        normalizeStyleProp(propStyle)
        ?? normalizeStyleProp(providerStyle)
        ?? roleConfig?.defaultStyle
        ?? defaultsStyle
        ?? FALLBACK_STYLE;
    if (stylesTree?.[candidate]) return candidate;
    return FALLBACK_STYLE;
}

/** Theme gate for Expo UI rendering. Content eligibility is `canRenderExpoUIButton`. */
export function useNeoButtonExpoUI(props: NeoButtonProps = {}) {
    const providerStyle = useNeoButtonStyle();
    const tree = appSetting('theme', 'neo_button');
    const config = appSetting('theme', 'expo_ui', 'button');

    if (isWeb) return null;
    if (!config) return null;

    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    const ctx: NeoScopeContext = { platform };

    if (!isExpoUI()) return null;

    const allowedStyles = resolveScoped(config.styles, ctx);
    if (allowedStyles === false) return null;
    if (Array.isArray(allowedStyles)) {
        const defaults = tree?.defaults || {};
        const stylesTree = tree?.styles || {};
        const role = props.role ?? defaults.role ?? 'default';
        const roleConfig = (tree?.roles || {})[role] || {};
        const style = resolveStyle({
            propStyle: normalizeStyleProp(props.buttonStyle) ?? normalizeStyleProp(props.style),
            providerStyle,
            defaultsStyle: defaults.style,
            roleConfig,
            stylesTree,
        });
        if (!allowedStyles.includes(style)) return null;
    }

    return { platform, config };
}

/** Counter / badge payload for NeoButton `addon` (conductor subtabs, etc.). */
export function parseNeoButtonAddon(addon: NeoButtonAddon): { text: string; variant: string | undefined } | null {
    if (addon == null || addon === false || addon === '') return null;
    const isObj = typeof addon === 'object';
    const text = isObj ? addon.text : addon;
    if (text == null || text === '' || text === false) return null;
    if (isObj && addon.hideZero && String(text) === '0') return null;
    return { text: String(text), variant: isObj ? addon.variant : undefined };
}

/**
 * Main hook used by `NeoButton`.
 */
export function useResolvedNeoButton(props: NeoButtonProps = {}) {
    const env = useNeoEnv();
    const themeKey = useThemeValue('light', 'dark');
    const providerStyle = useNeoButtonStyle();
    const providerSize = useNeoControlSize();
    const tree = appSetting('theme', 'neo_button');

    return useMemo(() => {
        const defaults = tree?.defaults || {};
        const stylesTree = tree?.styles || {};
        const sizesTree = tree?.controlSizes || {};
        const shapesTree = tree?.borderShapes || {};
        const rolesTree = tree?.roles || {};
        const transitionsTree = tree?.transitions || {};

        // 1) Pick high-level axes (props > providers > defaults).
        const role = props.role ?? defaults.role ?? 'default';
        // Legacy size names (`xs`/`sm`/`base`/`md`/`lg`/`xl`, e.g. UNA
        // `params.button_size`) resolve to their Neo size; unknown → theme default.
        const defaultSize: string = defaults.controlSize ?? 'regular';
        const requestedSize: string = props.controlSize ?? providerSize ?? defaultSize;
        const aliasedSize: string = LEGACY_TO_CONTROL_SIZE[requestedSize] ?? requestedSize;
        const controlSize = sizesTree[aliasedSize] ? aliasedSize : defaultSize;
        if (DEV && controlSize !== aliasedSize) {
            warnOnce(`[NeoButton] unknown controlSize "${requestedSize}" → "${defaultSize}"`);
        }
        const borderShape = props.borderShape ?? defaults.borderShape ?? 'roundedRectangle';
        const imagePlacement = props.imagePlacement ?? defaults.imagePlacement ?? 'leading';
        const align = props.align ?? defaults.align ?? 'center';
        const width = props.width ?? defaults.width ?? 'auto';

        const roleConfig = rolesTree[role] || {};
        const style = resolveStyle({
            propStyle: normalizeStyleProp(props.buttonStyle) ?? normalizeStyleProp(props.style),
            providerStyle,
            defaultsStyle: defaults.style,
            roleConfig,
            stylesTree,
        });

        // 2) Build resolver context (now that we know controlSize).
        const ctx: NeoScopeContext = { ...env, controlSize };

        // 3) Resolve controlSize sizing.
        //    Missing keys fall back to the theme's default size, then to the
        //    regular scale. hitSlop is derived from the height unless the size
        //    sets one explicitly (see `control-scale.ts`).
        const sizeCfg = resolveScoped(sizesTree[controlSize], ctx) || {};
        const baseCfg = controlSize === defaultSize
            ? sizeCfg
            : (resolveScoped(sizesTree[defaultSize], { ...env, controlSize: defaultSize }) || {});
        const height: number = sizeCfg.height ?? baseCfg.height ?? 44;
        const paddingX: number = sizeCfg.paddingX ?? baseCfg.paddingX ?? 16;
        const fontCls = sizeCfg.font ?? baseCfg.font ?? 'text-base';
        const iconSize: number = sizeCfg.icon ?? baseCfg.icon ?? 24;
        const hitSlop: number = sizeCfg.hitSlop ?? hitSlopForHeight(height);
        const labelGap: number = sizeCfg.labelGap ?? baseCfg.labelGap ?? 8;
        const contentInsets = sizeCfg.contentInsets ?? {};
        if (DEV) checkScaleOnce(controlSize, { height, paddingX, labelGap, hitSlop });

        // 4) Resolve borderShape (controlSize is in ctx so per-size rounded
        //    overrides like roundedRectangle.rounded.{mini|large|...} apply).
        const shapeCfg = resolveScoped(shapesTree[borderShape], ctx) || {};
        const rounded = shapeCfg.rounded ?? 'rounded-xl';
        const aspectSquare = !!shapeCfg.aspectSquare;
        // Shapes that keep their horizontal padding when icon-only (capsule),
        // so the pill stays wider than tall instead of collapsing to a circle.
        const iconOnlyPadded = !!shapeCfg.iconOnlyPadded;

        // 4b) Translate the numeric sizing into utility classes (preferred over
        //     inline styles by the renderer). `undefined` ⇒ renderer inline
        //     fallback. `heightCls` uses fixed h/w for aspect-square shapes
        //     (circle), min-h/min-w otherwise.
        const heightCls = (aspectSquare ? FIXED_SIZE_CLASS : MIN_SIZE_CLASS)[height];
        const paddingXCls = PADDING_X_CLASS[paddingX];
        const labelGapCls = LABEL_GAP_CLASS[labelGap];
        const hitAreaCls = HIT_AREA_CLASS[hitSlop];

        // 5) Resolve style slot maps. State is computed by the renderer; we
        //    return resolver functions so the renderer can call them per
        //    state without re-resolving the whole tree.
        //    `glassFx` swaps in the style's `realistic` slots (web only — see
        //    `defaults.glassEffect` in the theme).
        const glassEffect = props.glassEffect ?? resolveScoped(defaults.glassEffect, ctx);
        const glassFx = isWeb && GLASS_STYLES.has(style) && glassEffect === 'realistic';
        const styleDef = glassFx
            ? mergeOrReplace(stylesTree[style], stylesTree[style]?.realistic)
            : (stylesTree[style] || {});
        const containerSlot = styleDef.container || {};
        const textSlot = styleDef.text || {};
        const containerCls = (state: string) => resolveSlot(containerSlot, state, ctx);
        const textCls = (state: string) => {
            const base = resolveSlot(textSlot, state, ctx);
            // Role text override (string or per-style object).
            let roleText = resolveScoped(roleConfig.textClass, ctx);
            if (isPlainObject(roleText)) roleText = roleText[style] ?? roleText.default;
            return [base, roleText].filter(Boolean).join(' ');
        };

        // 6) Transitions: per-style preset, falls back to `default`.
        const transition = props.transition !== undefined
            ? props.transition
            : mergeOrReplace(
                resolveScoped(transitionsTree.default, ctx),
                resolveScoped(transitionsTree[style], ctx),
            );

        // 7) Behaviors.
        const behaviorsTree = defaults.behaviors || {};
        const behaviors = {
            hover:          !STYLES_WITHOUT_HOVER.has(style)
                && !!resolveScoped(behaviorsTree.hover, ctx),
            focusRing:      props.focusRing
                ? props.focusRing !== 'never'
                : resolveScoped(defaults.focusRing, ctx) !== 'never',
            pressAnimation: props.pressAnimation === false
                ? false
                : (transition && transition.press !== false && transition.press !== null),
            longPress:      !!resolveScoped(behaviorsTree.longPress, ctx),
        };

        // 8) Tint: prop > role default.
        const tint = props.tint ?? roleConfig.tint ?? null;

        // 8b) Haptics: prop > expo_ui.button override > defaults. Applies to JS-styled
        // and Expo UI buttons. `false` / `''` opts out. Same `FeedbackHaptics`
        // types as tabs (`Select` / `Medium` / …).
        const expoUiButton = appSetting('theme', 'expo_ui', 'button');
        const themeHaptics = (!isWeb ? resolveScoped(expoUiButton?.haptics, ctx) : null)
            ?? resolveScoped(defaults.haptics, ctx)
            ?? null;
        const haptics = (props.haptics === false || props.haptics === '')
            ? null
            : (typeof props.haptics === 'string' ? props.haptics : themeHaptics);

        // 9) Default image (e.g. role 'close' implies 'X' if no image given).
        const defaultImage = roleConfig.defaultImage ?? null;

        // 10) Native renderer mapping (consumed by a future appearance="native").
        const nativeMapping = {
            buttonStyle: SWIFTUI_BUTTON_STYLE[style] ?? 'plain',
            controlSize: SWIFTUI_CONTROL_SIZE[controlSize] ?? 'regular',
            buttonBorderShape: SWIFTUI_BORDER_SHAPE[borderShape] ?? 'roundedRectangle',
            role: role === 'default' ? undefined : role,
            tint: tint ?? undefined,
            systemImage:
                typeof props.systemImage === 'string' ? props.systemImage
                : (typeof props.image === 'string' ? props.image : undefined),
            disabled: !!props.disabled,
        };

        return {
            // Resolved axes
            style, controlSize, borderShape, role, imagePlacement, align, width,
            // Sizing (numbers = source of truth; *Cls = preferred utility classes)
            height, paddingX, fontCls, iconSize, hitSlop, labelGap, contentInsets, rounded, aspectSquare, iconOnlyPadded,
            heightCls, paddingXCls, labelGapCls, hitAreaCls,
            // Slot resolvers (call with current state)
            containerCls, textCls,
            // Behaviour
            transition, behaviors, haptics, glassFx,
            // Visuals
            tint, defaultImage,
            // Env (for debugging / ad-hoc consumers)
            env: ctx,
            // SwiftUI bridge
            nativeMapping,
            // Highlight overlay colours (used by the press feedback)
            highlightBg: tree?.motion?.['highlightBackground' + themeKey]
                ?? 'rgba(0,0,0,0.5)',
        };
    }, [
        env, themeKey, providerStyle, providerSize, tree,
        props.role, props.style, props.buttonStyle, props.controlSize, props.borderShape,
        props.imagePlacement, props.align, props.width,
        props.tint, props.transition, props.focusRing, props.pressAnimation,
        props.disabled, props.image, props.systemImage, props.haptics, props.glassEffect,
    ]);
}