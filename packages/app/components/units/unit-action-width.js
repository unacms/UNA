import { createContext, use } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { getBreakpoint } from 'app/lib/util';

/**
 * How unit action buttons (menu-items/unit.js) size, set by `UnitActions`:
 * - 'fill' (default): the button fills its slot — card grids, the flush
 *   mobile rows' half-width actions.
 * - 'compact-mobile': below `sm` the button hugs its label (profile rows on
 *   phones: avatar, name, then a compact button on the right); from `sm` up
 *   it fills, as in the card grid.
 *
 * Its own module: units/helpers.js imports the menu-item map through
 * customization/functions, so the menu item can't import helpers back.
 */
export const UnitActionWidthContext = createContext('fill');

/**
 * True when the unit action button should hug its label. Native only: on
 * web, `fill` in the row's auto-sized slot already hugs (CSS shrink-to-fit),
 * while the native layout engine widens it.
 */
export function useUnitActionHugs() {
    const mode = use(UnitActionWidthContext);
    const { width } = useWindowDimensions();
    return mode === 'compact-mobile' && Platform.OS !== 'web' && !getBreakpoint(width);
}
