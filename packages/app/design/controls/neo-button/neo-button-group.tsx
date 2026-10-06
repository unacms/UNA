/**
 * NeoButtonGroup — segmented control: one bordered container, separators
 * between segments, outer corners rounded by the group's controlSize.
 *
 * Segments read their position from context (`useNeoButtonGroupItem`) to
 * round only the outer corners and to keep their hit area off the interior
 * edges (no segment steals a neighbour's clicks). `ButtonMenuGroupItem` is the
 * segment component. No `overflow-hidden`: it would clip the focus rings.
 */
import React, { createContext, useContext, Fragment, type ReactNode } from 'react';
import { Row, View } from 'app/design/view';
import { appSetting, cn } from 'app/lib/util';
import { NeoControlSizeProvider, useResolvedNeoButton } from 'app/design/controls/neo-button/neo-button-resolver';
import type { NeoControlSize } from 'app/design/controls/neo-button/neo-button.types';

type SegmentPosition = 'only' | 'first' | 'middle' | 'last';

// Static literals (Tailwind/Uniwind). Must mirror
// `neo_button.borderShapes.roundedRectangle.rounded` in settings/theme/buttons.js.
const SEGMENT_ROUNDED: Record<string, Record<SegmentPosition, string>> = {
    mini:    { only: 'rounded-md',  first: 'rounded-s-md',  middle: 'rounded-none', last: 'rounded-e-md' },
    small:   { only: 'rounded-lg',  first: 'rounded-s-lg',  middle: 'rounded-none', last: 'rounded-e-lg' },
    regular: { only: 'rounded-xl',  first: 'rounded-s-xl',  middle: 'rounded-none', last: 'rounded-e-xl' },
    large:   { only: 'rounded-xl',  first: 'rounded-s-xl',  middle: 'rounded-none', last: 'rounded-e-xl' },
    xlarge:  { only: 'rounded-2xl', first: 'rounded-s-2xl', middle: 'rounded-none', last: 'rounded-e-2xl' },
};

export type NeoButtonGroupItemContextValue = {
    /** The group's size (drives the corner rounding). */
    controlSize: NeoControlSize;
    position: SegmentPosition;
    /** Outer-corner rounding for this segment's surface. */
    roundedCls: string;
    /** Whether the segment touches the group's start / end edge (hit area may extend there). */
    outerStart: boolean;
    outerEnd: boolean;
};

const NeoButtonGroupItemContext = createContext<NeoButtonGroupItemContextValue | null>(null);

/** Segment context inside a NeoButtonGroup, or `null` outside one. */
export const useNeoButtonGroupItem = () => useContext(NeoButtonGroupItemContext);

export type NeoButtonGroupProps = {
    controlSize?: NeoControlSize;
    className?: string;
    children?: ReactNode;
};

export function NeoButtonGroup({ controlSize = 'small', className, children }: NeoButtonGroupProps) {
    const theme = appSetting('theme', 'neo_button', 'group') || {};
    const { rounded } = useResolvedNeoButton({ controlSize, borderShape: 'roundedRectangle' });
    // Drops falsy children; a single child renders as `only`.
    const items = React.Children.toArray(children).filter(React.isValidElement);
    if (!items.length) return null;

    return (
        <NeoControlSizeProvider size={controlSize}>
            <Row className={cn(theme.container, rounded, className)}>
                {items.map((child, i) => {
                    const position: SegmentPosition = items.length === 1
                        ? 'only'
                        : i === 0 ? 'first' : i === items.length - 1 ? 'last' : 'middle';
                    const value: NeoButtonGroupItemContextValue = {
                        controlSize,
                        position,
                        roundedCls: SEGMENT_ROUNDED[controlSize]?.[position] ?? '',
                        outerStart: position === 'first' || position === 'only',
                        outerEnd: position === 'last' || position === 'only',
                    };
                    return (
                        <Fragment key={child.key ?? i}>
                            {i > 0 ? <View aria-hidden className={theme.separator} /> : null}
                            <NeoButtonGroupItemContext.Provider value={value}>{child}</NeoButtonGroupItemContext.Provider>
                        </Fragment>
                    );
                })}
            </Row>
        </NeoControlSizeProvider>
    );
}
