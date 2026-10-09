// Props shared by tabs.tsx (native) and tabs.web.tsx.
import type { ReactNode } from 'react';

export type TabItem = {
    key: string;
    title: string;
    /** Panel content. A tab without content gets no panel (a switcher-only bar). */
    content?: ReactNode;
};

export type TabsProps = {
    tabs?: TabItem[];
    /** Selected tab key. Changes to it select that tab. */
    activeTab?: string;
    /** Key of `theme.tabs_variants`: `default` (flat segmented control, NeoButton `bordered` colours), `glass` (NeoButton `glass`), `secondary` (underline), or a theme's own. The entry's `indicator` (`'pill'` | `'line'`) picks the selection shape. */
    variant?: string;
    /** Key of `theme.tabs_sizes` (`sm`, `md`, `lg`). Default `tabs_sizes.default_size`. */
    size?: string;
    /** Tabs share extra space equally (unless `hug`); each keeps at least its label width. */
    equalWidth?: boolean;
    /** @deprecated Use `equalWidth`. */
    fullWidth?: boolean;
    /** Track, row and pill use `rounded-full`; otherwise radii come from `tabs_sizes`. */
    rounded?: boolean;
    /** Tabs only as wide as their labels. Combine with `equalWidth={false}` so the strip doesn't span the parent. */
    hug?: boolean;
    /** `scroll` (default): the row scrolls horizontally. `collapse`: tabs that don't fit move into a "More" menu. */
    overflow?: 'scroll' | 'collapse';
    /** Label of the overflow trigger (default: translated "More"). `""` for icon-only. */
    moreMenuTitle?: string;
    /** @deprecated Use `moreMenuTitle`. */
    moreLabel?: string;
    /** Lucide icon name of the overflow trigger (default `ChevronDown`). */
    moreMenuIcon?: string;
    /** Each tab panel. */
    contentClassName?: string;
    /** The surface behind the row (e.g. `bg-muted`). */
    trackClassName?: string;
    /** The selection indicator: the pill, or the underline for `indicator: 'line'` (e.g. a lighter pill on a tinted track). */
    pillClassName?: string;
    /** The `Tabs` root (container). */
    headerClassName?: string;
    /** With `overflow="scroll"`, the outer tab bar; with `overflow="collapse"`, the full-width measure row. `flex flex-row justify-center` centres a `hug` strip. */
    tabBarClassName?: string;
    /** The box around track, list and indicator (e.g. `mx-auto` with `hug`). */
    listWrapperClassName?: string;
    /** The tab row only (e.g. `gap-1`, `justify-center`). */
    listClassName?: string;
    /** Each tab trigger (not the panels). */
    triggerClassName?: string;
    /** Fired when the user selects a tab (not when `activeTab` changes). */
    onTabChange?: (key: string) => void;
    /** Native: skip scrolling the selected tab into view (if scrolling fights layout). */
    disableScrollIntoView?: boolean;
};
