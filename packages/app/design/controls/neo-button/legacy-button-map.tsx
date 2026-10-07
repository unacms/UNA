/**
 * Legacy Button vocabulary → NeoButton props.
 *
 * `legacyToNeoButtonProps` serves call sites whose variant / size / rounded
 * come from props, UNA params or a public API that keeps the legacy names
 * (Snackbar, UNA menus), the `ButtonMenu*` adapters, and legacy `buttonProps`
 * on DropdownMenu / DropdownPopup. Mapping tables: `control-scale.ts`.
 */
import React from 'react';
import { Row } from 'app/design/view';
import { Text } from 'app/design/typography';
import { Icon } from 'app/ui/atoms/icon';
import { cn, isEmoji } from 'app/lib/util';
import { useNeoButtonContent } from 'app/design/controls/neo-button/neo-button';
import { toControlSize, toNeoStyle } from 'app/design/controls/neo-button/control-scale';
import type { NeoButtonClassNames, NeoButtonProps } from 'app/design/controls/neo-button/neo-button.types';

/** Legacy props NeoButton has no use for (ignored by legacy Button too, or replaced by Neo state). */
const DROPPED = [
    'grouped', 'ring', 'solid', 'bgColor', 'textColor', 'hide_icon', 'onlyIcon', 'padding',
    'legacyButton', 'useNeoButton', 'neoButton', 'accessibilityRole', 'id', 'isoCode',
];
/** Neo semantic roles; any other `role` is the legacy ARIA role and is dropped. */
const NEO_ROLES = new Set(['default', 'cancel', 'close', 'confirm', 'destructive']);
/** Keys that mark `buttonProps` as legacy (DropdownMenu / DropdownPopup routing). */
const LEGACY_KEYS = ['variant', 'size', 'startDecorator', 'endDecorator', 'title', 'rounded', 'fullWidth'];
/** Routing flags of trigger `buttonProps`; never NeoButton props. */
const ROUTING_KEYS = ['legacyButton', 'neoButton', 'useNeoButton'];

const truthy = (v: unknown) => v === true || v === 'true' || v === 1 || v === '1';
const isDecorator = (v: unknown) => (typeof v === 'string' && v !== '') || React.isValidElement(v);
const ALIGN: Record<string, 'start' | 'end' | 'between' | undefined> = {
    start: 'start', left: 'start', end: 'end', right: 'end', between: 'between',
};

/**
 * Trigger `buttonProps` that need the legacy mapper: `legacyButton: true`, or
 * any legacy key with a value (`variant`, `size`, `startDecorator`, …).
 */
export function isLegacyButtonProps(props: Record<string, any> | null | undefined): boolean {
    if (!props) return false;
    if (props.legacyButton === true) return true;
    return LEGACY_KEYS.some((key) => props[key] != null);
}

/** `buttonProps` without the routing flags (`legacyButton` / `neoButton` / `useNeoButton`). */
export function stripRoutingKeys(props: Record<string, any> = {}): NeoButtonProps {
    const out: Record<string, any> = { ...props };
    for (const key of ROUTING_KEYS) delete out[key];
    return out;
}

/**
 * Legacy `startDecorator` array (stacked reaction icons) as one image. Each
 * icon / emoji takes the enclosing button's label classes for its style and
 * state (rest / hover / selected, plus `textClassName`), like legacy did.
 */
export function LegacyDecoratorStack({ items }: { items: unknown[] }) {
    const content = useNeoButtonContent();
    const iconSize = content?.iconSize ?? 20;
    // Legacy dropped `overflow-hidden` on icons (it clips glyph overhang).
    const cls = cn((content?.textCls ?? '').replace('overflow-hidden', ''), 'shrink-0');
    return (
        <Row className="flex-row items-center gap-x-0.5">
            {items.map((src, i) => {
                if (React.isValidElement(src)) return <React.Fragment key={i}>{src}</React.Fragment>;
                if (typeof src !== 'string' || !src) return null;
                if (isEmoji(src)) return <Text key={i} className={cls}>{src}</Text>;
                return <Icon key={i} icon={src} size={iconSize} className={cn(cls, 'pointer-events-none')} />;
            })}
        </Row>
    );
}

/**
 * Legacy Button props (variant / size / title / decorators / rounded /
 * fullWidth / pressed / …) → NeoButton props. Neo keys already present win;
 * the result holds only Neo keys and uses `style`, so it spreads into
 * NeoButtonLink too. Explicit props written after the spread win.
 */
export function legacyToNeoButtonProps(p: Record<string, any> = {}): NeoButtonProps {
    const {
        variant, size, title, startDecorator, endDecorator, rounded, fullWidth, pressed, align, alt,
        addon, classTextName, className, onTouchStart, tooltip, ...rest
    } = p;
    for (const key of DROPPED) delete rest[key];
    if (rest.role !== undefined && !NEO_ROLES.has(rest.role)) delete rest.role;

    const out: NeoButtonProps = { ...rest };

    const mapped = toNeoStyle(variant);
    if (out.style === undefined && out.buttonStyle === undefined && mapped.style) out.style = mapped.style;
    if (out.role === undefined && mapped.role) out.role = mapped.role;

    if (out.controlSize === undefined) {
        const controlSize = toControlSize(size);
        if (controlSize) out.controlSize = controlSize;
    }

    // Legacy hid `false`, `''` and `0` titles.
    if (out.label === undefined && title !== undefined && title !== null && title !== false && title !== '' && title !== 0) {
        out.label = title;
    }

    if (startDecorator === '_loading' || endDecorator === '_loading') out.loading = out.loading ?? true;
    const start = startDecorator === '_loading' ? undefined : startDecorator;
    const end = endDecorator === '_loading' ? undefined : endDecorator;
    if (out.image === undefined && out.children === undefined) {
        if (Array.isArray(start) && start.length) {
            out.image = <LegacyDecoratorStack items={start} />;
        } else if (isDecorator(start)) {
            out.image = start;
        } else if (isDecorator(end)) {
            out.image = end;
            out.imagePlacement = out.imagePlacement ?? 'trailing';
        }
        if (isDecorator(start) && isDecorator(end) && process.env.NODE_ENV !== 'production') {
            console.warn('[legacyToNeoButtonProps] start + end decorators: the trailing one is dropped; use children');
        }
    }

    // Never a circle with a label (it would clip): capsule.
    if (out.borderShape === undefined && truthy(rounded)) out.borderShape = out.label !== undefined ? 'capsule' : 'circle';
    if (out.width === undefined && truthy(fullWidth)) out.width = 'fill';
    if (out.selected === undefined && pressed !== undefined) out.selected = !!pressed;
    if (out.align === undefined && typeof align === 'string' && ALIGN[align]) out.align = ALIGN[align];
    if (out.accessibilityLabel === undefined && alt) out.accessibilityLabel = alt;
    if (out.tooltip === undefined && tooltip) out.tooltip = tooltip;
    // Legacy hid a `0` counter.
    if (out.addon === undefined && addon !== 0 && !(addon && typeof addon === 'object' && addon.text === 0)) out.addon = addon;
    if (out.textClassName === undefined && classTextName) out.textClassName = classTextName;
    if (out.onPressIn === undefined && onTouchStart) out.onPressIn = onTouchStart;

    // Legacy `accent` (a tinted chip) has no Neo style: bordered + the accent wash.
    const classNames: NeoButtonClassNames = { ...(out.classNames ?? {}) };
    if (variant === 'accent') {
        if (classNames.surface === undefined) classNames.surface = 'bg-accent/60';
        if (out.textClassName === undefined) out.textClassName = 'text-accent-foreground';
    }
    // Legacy `className` sat on the outer box: layout classes reach the parent.
    if (className) classNames.root = cn(classNames.root, className);
    if (out.classNames !== undefined || Object.keys(classNames).length) out.classNames = classNames;

    return out;
}
