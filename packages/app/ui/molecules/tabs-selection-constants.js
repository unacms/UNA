/**
 * Shared tab selection animation — native (Reanimated) + web (CSS transition).
 * Matches Easing.out(Easing.ease) with a standard ease-out curve on web.
 */
export const TABS_SELECTION_DURATION_MS = 200;

/** Physical height for secondary underline (`h-0.5` at default Tailwind scale). */
export const TABS_UNDERLINE_HEIGHT_PX = 2;

/** CSS timing for web `transition` shorthand (approximates Reanimated ease-out). */
export const TABS_SELECTION_WEB_EASING = 'cubic-bezier(0.33, 1, 0.68, 1)';

/** Horizontal padding when scrolling the active tab into view (native `scrollTo`). */
export const TABS_SCROLL_INTO_VIEW_PADDING_PX = 8;
