/**
 * NeoButtonGroup — buttons joined into one control, with the same axes as a
 * NeoButton: `style`, `controlSize`, `borderShape`, `role` / `tint`, `width`.
 *
 *   <NeoButtonGroup style="bordered" controlSize="small" accessibilityLabel="Text alignment">
 *     <NeoButton image="AlignLeft" accessibilityLabel="Left" onPress={…} />
 *     <NeoButton image="AlignCenter" accessibilityLabel="Center" onPress={…} />
 *   </NeoButtonGroup>
 *
 * The group paints the style's resting surface once (theme `neo_button.group`):
 * a fill, or a shadow ring for outline and glass, never a border, so it is
 * exactly as tall as its buttons. Every NeoButton inside reads its segment
 * context (`useNeoButtonGroupItem`) and becomes a segment: the group's style,
 * size and role, only the style's state washes, square inner corners and the
 * group's outer corners (the same radius: nothing sits between them), a hit
 * area that stays off its neighbours, and no press scale. Segments always use
 * the JS surface; a `glass` group on iOS 26 draws real liquid glass behind them.
 * No `overflow-hidden`: it would clip the segments' focus rings.
 */
import React, { createContext, useContext, Fragment, type ReactNode } from 'react';
import { Row, View } from 'app/design/view';
import { GlassSurface } from 'app/ui/atoms/glass-surface';
import { appSetting, cn, hasLiquidGlass } from 'app/lib/util';
import {
    NeoButtonStyleProvider,
    NeoControlSizeProvider,
    normalizeStyleProp,
    useNeoButtonStyle,
    useResolvedNeoButton,
} from 'app/design/controls/neo-button/neo-button-resolver';
import type { NeoBorderShape, NeoButtonStyle, NeoControlSize } from 'app/design/controls/neo-button/neo-button.types';

type SegmentPosition = 'only' | 'first' | 'middle' | 'last';

// Outer corners per position, keyed by the group's resolved rounding (static
// literals for Tailwind / Uniwind; covers every `neo_button.borderShapes` value).
const SEGMENT_ROUNDED: Record<string, Record<SegmentPosition, string>> = {
    'rounded-none': { only: 'rounded-none', first: 'rounded-none',   middle: 'rounded-none', last: 'rounded-none' },
    'rounded-md':   { only: 'rounded-md',   first: 'rounded-s-md',   middle: 'rounded-none', last: 'rounded-e-md' },
    'rounded-lg':   { only: 'rounded-lg',   first: 'rounded-s-lg',   middle: 'rounded-none', last: 'rounded-e-lg' },
    'rounded-xl':   { only: 'rounded-xl',   first: 'rounded-s-xl',   middle: 'rounded-none', last: 'rounded-e-xl' },
    'rounded-2xl':  { only: 'rounded-2xl',  first: 'rounded-s-2xl',  middle: 'rounded-none', last: 'rounded-e-2xl' },
    'rounded-full': { only: 'rounded-full', first: 'rounded-s-full', middle: 'rounded-none', last: 'rounded-e-full' },
};

const PROMINENT_STYLES = new Set(['borderedProminent', 'glassProminent']);

export type NeoButtonGroupItemContextValue = {
    /** The group's resolved axes; segments use them unless they set their own. */
    style: string;
    controlSize: NeoControlSize;
    role?: string;
    tint?: string | null;
    position: SegmentPosition;
    /** Outer-corner rounding for this segment's surface. */
    roundedCls: string;
    /** Whether the segment touches the group's start / end edge (its hit area may extend there). */
    outerStart: boolean;
    outerEnd: boolean;
    /** `width="fill"`: segments share the group's width. */
    fill: boolean;
};

const NeoButtonGroupItemContext = createContext<NeoButtonGroupItemContextValue | null>(null);

/** Segment context inside a NeoButtonGroup, or `null` outside one. */
export const useNeoButtonGroupItem = () => useContext(NeoButtonGroupItemContext);

export type NeoButtonGroupProps = {
    /** Button style of the whole group (default: theme `neo_button.group.defaultStyle`, or a parent provider's). */
    style?: NeoButtonStyle | string;
    controlSize?: NeoControlSize;
    /** `roundedRectangle` (default) or `capsule`; `rectangle` for square corners. */
    borderShape?: NeoBorderShape | string;
    /** SwiftUI role for every segment (`destructive` tints a prominent group). */
    role?: string;
    /** Fill colour of a prominent group; label / icon colour of the others. */
    tint?: string | null;
    /** `fill`: the group takes its parent's width and the segments share it. */
    width?: 'auto' | 'fill';
    /** Dividers between segments (default on). */
    separators?: boolean;
    /** Names the group for assistive technology (`role="group"`). */
    accessibilityLabel?: string;
    className?: string;
    children?: ReactNode;
};

export function NeoButtonGroup({
    style: styleProp,
    controlSize = 'small',
    borderShape,
    role,
    tint,
    width = 'auto',
    separators = true,
    accessibilityLabel,
    className,
    children,
}: NeoButtonGroupProps) {
    const theme = appSetting('theme', 'neo_button', 'group') || {};
    const groupStyles = theme.styles || {};
    const providerStyle = useNeoButtonStyle();
    const requested = normalizeStyleProp(styleProp) ?? normalizeStyleProp(providerStyle) ?? theme.defaultStyle ?? 'bordered';
    const style = groupStyles[requested] ? requested : (theme.defaultStyle ?? 'bordered');
    const resolved = useResolvedNeoButton({ style, controlSize, borderShape, role, tint });

    // Drops falsy children; a single child renders as `only`.
    const items = React.Children.toArray(children).filter(React.isValidElement);
    if (!items.length) return null;

    const groupStyle = groupStyles[style] || {};
    const liquidGlass = hasLiquidGlass && style === 'glass';
    // A prominent group is filled with its tint: a role's fill class (it may
    // be a CSS variable, which native can't read inline), or a `tint` colour.
    const prominent = PROMINENT_STYLES.has(style);
    const roleFill = prominent && !tint ? appSetting('theme', 'neo_button', 'roles')?.[role ?? '']?.fillClass : null;
    const tintFill = prominent && !roleFill && resolved.tint ? resolved.tint : null;
    const fill = width === 'fill';
    const corners = SEGMENT_ROUNDED[resolved.rounded] ?? SEGMENT_ROUNDED['rounded-xl']!;

    return (
        <NeoButtonStyleProvider style={style}>
            <NeoControlSizeProvider size={resolved.controlSize}>
                <Row
                    role="group"
                    aria-label={accessibilityLabel}
                    accessibilityLabel={accessibilityLabel}
                    className={cn(
                        'relative flex-row items-stretch',
                        fill ? 'w-full' : 'self-start max-w-full',
                        resolved.rounded,
                        liquidGlass ? groupStyle.liquidContainer : groupStyle.container,
                        roleFill,
                        className,
                    )}
                    style={tintFill ? { backgroundColor: tintFill } : undefined}
                >
                    {liquidGlass ? <GlassSurface rounded={resolved.rounded} /> : null}
                    {items.map((child, i) => {
                        const position: SegmentPosition = items.length === 1
                            ? 'only'
                            : i === 0 ? 'first' : i === items.length - 1 ? 'last' : 'middle';
                        const value: NeoButtonGroupItemContextValue = {
                            style,
                            controlSize: resolved.controlSize as NeoControlSize,
                            role,
                            tint,
                            position,
                            roundedCls: corners[position],
                            outerStart: position === 'first' || position === 'only',
                            outerEnd: position === 'last' || position === 'only',
                            fill,
                        };
                        return (
                            <Fragment key={child.key ?? i}>
                                {i > 0 && separators ? (
                                    <View
                                        aria-hidden
                                        pointerEvents="none"
                                        className={cn('w-px self-center', theme.separatorHeight?.[resolved.controlSize], groupStyle.separator)}
                                    />
                                ) : null}
                                <NeoButtonGroupItemContext.Provider value={value}>{child}</NeoButtonGroupItemContext.Provider>
                            </Fragment>
                        );
                    })}
                </Row>
            </NeoControlSizeProvider>
        </NeoButtonStyleProvider>
    );
}
