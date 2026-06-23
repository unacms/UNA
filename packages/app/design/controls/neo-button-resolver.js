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
 *   default → theme → platform (native then specific) → pointer → breakpoint
 *   (smallest applicable to current, so larger overrides smaller, like Tailwind)
 *   → controlSize
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

import React, { createContext, useContext, useMemo } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { useWindowWidth, useIsDesktop } from 'app/context/measure';
import { appSetting, getBreakpoint } from 'app/lib/util';
import { ThemeName } from 'app/design/theme';

/* ----------------------------- scope plumbing ----------------------------- */

const PLATFORM_KEYS = new Set(['web', 'ios', 'android', 'native']);
const POINTER_KEYS  = new Set(['touch', 'mouse']);
const THEME_KEYS    = new Set(['light', 'dark']);
const BP_ORDER      = ['sm', 'md', 'lg', 'xl', '2xl'];
const BP_KEYS       = new Set(BP_ORDER);
const SIZE_KEYS     = new Set(['mini', 'small', 'regular', 'large', 'xlarge']);

const SCOPE_KEYS = new Set([
    'default',
    ...THEME_KEYS, ...PLATFORM_KEYS, ...POINTER_KEYS, ...BP_KEYS, ...SIZE_KEYS,
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
const MIN_SIZE_CLASS = {
    28: 'min-h-7 min-w-7',
    36: 'min-h-9 min-w-9',
    40: 'min-h-10 min-w-10',
    44: 'min-h-11 min-w-11',
    52: 'min-h-13 min-w-13',
    60: 'min-h-15 min-w-15',
};
const FIXED_SIZE_CLASS = {
    28: 'h-7 w-7',
    36: 'h-9 w-9',
    40: 'h-10 w-10',
    44: 'h-11 w-11',
    52: 'h-13 w-13',
    60: 'h-15 w-15',
};
const PADDING_X_CLASS = {
    0: 'px-0',
    8: 'px-2',
    12: 'px-3',
    20: 'px-5',
    24: 'px-6',
};
const LABEL_GAP_CLASS = {
    0: 'gap-x-0',
    4: 'gap-x-1',
    6: 'gap-x-1.5',
    8: 'gap-x-2',
    10: 'gap-x-2.5',
    12: 'gap-x-3',
};
// Web-only: maps `hitSlop` (px) → `hit-area-*` utility (see global.css).
// `0` → no class (native still receives hitSlop={0} via the prop).
const HIT_AREA_CLASS = {
    0: '',
    2: 'hit-area-2',
    4: 'hit-area-4',
    6: 'hit-area-6',
    8: 'hit-area-8',
    10: 'hit-area-10',
    14: 'hit-area-14',
};

const isPlainObject = (v) =>
    !!v && typeof v === 'object' && !Array.isArray(v) && !React.isValidElement(v);

const hasScopeKey = (obj) => {
    for (const k of Object.keys(obj)) if (SCOPE_KEYS.has(k)) return true;
    return false;
};

const mergeOrReplace = (left, right) => {
    if (right === undefined) return left;
    if (!isPlainObject(left) || !isPlainObject(right)) return right;
    const out = { ...left };
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
export function resolveScoped(value, ctx) {
    if (!isPlainObject(value)) return value;
    if (!hasScopeKey(value)) {
        // Plain nested object — recurse into each entry so deeper leaves
        // still resolve.
        const out = {};
        for (const k of Object.keys(value)) out[k] = resolveScoped(value[k], ctx);
        return out;
    }

    let result = 'default' in value ? resolveScoped(value.default, ctx) : undefined;

    if (ctx.theme && THEME_KEYS.has(ctx.theme) && ctx.theme in value) {
        result = mergeOrReplace(result, resolveScoped(value[ctx.theme], ctx));
    }

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
                const bp = BP_ORDER[i];
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
    const [pointer, setPointer] = React.useState(ssrDefault);

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
function useThemeName() {
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

    const platform = isWeb ? 'web' : (Platform.OS === 'ios' ? 'ios' : 'android');
    const measuredIsDesktop = useIsDesktop();

    const width = useWindowWidth();
    const measuredBreakpoint = useMemo(() => getBreakpoint(width) || '', [width]);
    const measuredTheme = useThemeName();
    const measuredPointer = usePointerCapability();

    // On the server (and during first client render before useEffect runs)
    // we always emit `isWeb ? desktop : mobile` so the rendered tree shape
    // (Tooltip wrapper, etc.) is identical across SSR boundary.
    const breakpoint = hydrated ? measuredBreakpoint : '';
    const theme      = hydrated ? measuredTheme      : 'light';
    const pointer    = hydrated ? measuredPointer    : (isWeb ? 'mouse' : 'touch');
    const isDesktop  = hydrated ? measuredIsDesktop  : isWeb;

    return useMemo(
        () => ({ platform, pointer, breakpoint, theme, isDesktop, hydrated }),
        [platform, pointer, breakpoint, theme, isDesktop, hydrated],
    );
}

/* --------------------------- context providers ---------------------------- */

const NeoButtonStyleContext = createContext(null);
const NeoControlSizeContext = createContext(null);

export function NeoButtonStyleProvider({ style, children }) {
    return (
        <NeoButtonStyleContext.Provider value={style}>
            {children}
        </NeoButtonStyleContext.Provider>
    );
}

export function NeoControlSizeProvider({ size, children }) {
    return (
        <NeoControlSizeContext.Provider value={size}>
            {children}
        </NeoControlSizeContext.Provider>
    );
}

export const useNeoButtonStyle = () => useContext(NeoButtonStyleContext);
export const useNeoControlSize = () => useContext(NeoControlSizeContext);

/* ------------------------------- main hook -------------------------------- */

const SWIFTUI_BUTTON_STYLE = {
    plain: 'plain',
    bordered: 'bordered',
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

const SWIFTUI_CONTROL_SIZE = {
    mini: 'mini',
    small: 'small',
    regular: 'regular',
    large: 'large',
    xlarge: 'extraLarge',
};

const SWIFTUI_BORDER_SHAPE = {
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
function resolveSlot(slotMap, state, ctx) {
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
function normalizeStyleProp(value) {
    // React Native `Link`/`Pressable` also use a `style` prop (object/array).
    // When `NeoButtonLink` is rendered with `asChild`, that layout `style` can
    // overwrite the SwiftUI-style string — ignore non-strings here.
    return typeof value === 'string' ? value : undefined;
}

function resolveStyle({ propStyle, providerStyle, defaultsStyle, roleConfig, stylesTree }) {
    const candidate =
        normalizeStyleProp(propStyle)
        ?? normalizeStyleProp(providerStyle)
        ?? roleConfig?.defaultStyle
        ?? defaultsStyle
        ?? FALLBACK_STYLE;
    if (stylesTree?.[candidate]) return candidate;
    return FALLBACK_STYLE;
}

/**
 * Main hook used by `NeoButton`.
 */
export function useResolvedNeoButton(props = {}) {
    const env = useNeoEnv();
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
        const controlSize = props.controlSize ?? providerSize ?? defaults.controlSize ?? 'regular';
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
        const ctx = { ...env, controlSize };

        // 3) Resolve controlSize sizing.
        const sizeCfg = resolveScoped(sizesTree[controlSize], ctx) || {};
        const height = sizeCfg.height ?? 44;
        const paddingX = sizeCfg.paddingX ?? 12;
        const fontCls = sizeCfg.font ?? 'text-base';
        const iconSize = sizeCfg.icon ?? 20;
        const hitSlop = sizeCfg.hitSlop ?? 4;
        const labelGap = sizeCfg.labelGap ?? 8;
        const contentInsets = sizeCfg.contentInsets ?? {};

        // 4) Resolve borderShape (controlSize is in ctx so per-size rounded
        //    overrides like roundedRectangle.rounded.{mini|large|...} apply).
        const shapeCfg = resolveScoped(shapesTree[borderShape], ctx) || {};
        const rounded = shapeCfg.rounded ?? 'rounded-xl';
        const aspectSquare = !!shapeCfg.aspectSquare;

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
        const styleDef = stylesTree[style] || {};
        const containerSlot = styleDef.container || {};
        const textSlot = styleDef.text || {};
        const containerCls = (state) => resolveSlot(containerSlot, state, ctx);
        const textCls = (state) => {
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
            height, paddingX, fontCls, iconSize, hitSlop, labelGap, contentInsets, rounded, aspectSquare,
            heightCls, paddingXCls, labelGapCls, hitAreaCls,
            // Slot resolvers (call with current state)
            containerCls, textCls,
            // Behaviour
            transition, behaviors,
            // Visuals
            tint, defaultImage,
            // Env (for debugging / ad-hoc consumers)
            env: ctx,
            // SwiftUI bridge
            nativeMapping,
            // Highlight overlay colours (used by the press feedback)
            highlightBg: tree?.motion?.['highlightBackground' + (env.theme === 'dark' ? 'dark' : 'light')]
                ?? 'rgba(0,0,0,0.5)',
        };
    }, [
        env, providerStyle, providerSize, tree,
        props.role, props.style, props.buttonStyle, props.controlSize, props.borderShape,
        props.imagePlacement, props.align, props.width,
        props.tint, props.transition, props.focusRing, props.pressAnimation,
        props.disabled, props.image, props.systemImage,
    ]);
}