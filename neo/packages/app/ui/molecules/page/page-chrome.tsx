import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { InsetTier } from 'app/lib/page-inset';

type Tiers = boolean | InsetTier[];

/**
 * What a page tells the blocks inside it (block-wrapper.js):
 * - `inset`: the screen sizes where the page's padding keeps blocks off the screen edge.
 *   A block that doesn't set `designbox.rounded` is rounded there and square where it
 *   meets the edge. Unset (a layout that doesn't pad its blocks) keeps the theme's
 *   `u-block-rounded-default`.
 * - `designbox`: the page config's `designbox`, the default for every block on the page.
 *   A block's own `designbox` keys win over it, key by key.
 */
export type PageChrome = {
    inset?: Tiers | null;
    designbox?: Record<string, unknown> | null;
};

const PageChromeContext = createContext<PageChrome>({});

type PageChromeProviderProps = PageChrome & { children?: ReactNode };

/** Sets what it's given and keeps the rest from the enclosing provider. */
export function PageChromeProvider({ inset, designbox, children }: Readonly<PageChromeProviderProps>) {
    const parent = useContext(PageChromeContext);
    const nextInset = inset === undefined ? parent.inset : inset;
    const nextDesignbox = designbox === undefined ? parent.designbox : designbox;
    const value = useMemo(() => ({ inset: nextInset, designbox: nextDesignbox }), [nextInset, nextDesignbox]);
    return <PageChromeContext.Provider value={value}>{children}</PageChromeContext.Provider>;
}

export function usePageChrome(): PageChrome {
    return useContext(PageChromeContext);
}

type ListEndpoint = { designbox?: Record<string, unknown> | null } & Record<string, unknown>;

/**
 * A list endpoint with the page's `designbox` under the list block's own keys, for
 * `paddingForList`, which draws the card around a browse list from `endpoint.designbox`.
 */
export function usePageListEndpoint<T extends ListEndpoint>(endpoint: T | null | undefined): T | null | undefined {
    const { designbox } = usePageChrome();
    if (!endpoint || !designbox) return endpoint;
    return { ...endpoint, designbox: { ...designbox, ...endpoint.designbox } };
}
