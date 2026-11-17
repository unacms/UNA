'use client';

import { createContext, useContext, useEffect, useLayoutEffect, useState, useId, type ReactNode } from 'react';
import { useIsDesktop } from 'app/context/measure';

/**
 * Page header options, declared where the page lives.
 *
 * A page (layout, conductor, messenger …) renders `<PageHeaderOptions …/>`
 * anywhere in its tree; the `PageHeader` mounted by `Layout` reads the merged
 * result. Ownership is the React tree: mount registers, unmount removes, prop
 * change updates. No focus/blur bookkeeping, no "last writer wins" — when two
 * instances are mounted at once the later mount wins per key, and unmounting it
 * falls back to the earlier one (modal over a page, nested conductors).
 *
 * The provider lives in `Layout`, which is per tab on native (every NativeTabs /
 * JS tab screen has its own `Root → Layouts → Layout`), so hidden tabs never
 * touch the focused tab's header.
 */

/**
 * `main` replaces the whole bar; `sub` is the row under it; `hidden` drops the bar.
 * `band` draws the band behind the bar at rest on phones and tablets
 * (`layout.header.band`); without it the bar is floating buttons over the page,
 * with the scroll fade. Unset follows `layout.header.band_by_default` (off), so
 * pages that want it say so (the member feed); `band={false}` keeps it off on a
 * page even when a fork turns it on by default (landing pages).
 * `showTitle` shows or hides the page title on phones and tablets. Unset, the title
 * follows the page's cover in Studio (Pages → page → Cover) for this viewer, and a
 * `title` passed here always shows; pages that draw their own heading (landing pages)
 * set `showTitle={false}`.
 * `ownBackButton` says a `main` bar draws its own back control (the messenger chat), so a
 * pushed native screen gets no second one in front of it.
 */
export type HeaderOptions = {
    main: ReactNode;
    sub: ReactNode;
    actions: ReactNode;
    hidden: boolean;
    title: ReactNode;
    backButton: boolean;
    ownBackButton: boolean;
    band: boolean | null;
    showTitle: boolean | null;
};

type HeaderOptionKey = keyof HeaderOptions;
type HeaderOptionValues = Partial<HeaderOptions>;
type HeaderOptionsEntry = { id: string; values: HeaderOptionValues };
type HeaderOptionsListener = (options: HeaderOptions) => void;

type HeaderOptionsRegistry = {
    set(id: string, values: HeaderOptionValues): void;
    remove(id: string): void;
    /** Calls `listener` with the merged options now and after every change. */
    subscribe(listener: HeaderOptionsListener): () => void;
};

export const defaultHeaderOptions: Readonly<HeaderOptions> = Object.freeze({
    main: null,
    sub: null,
    actions: null,
    hidden: false,
    title: false,
    backButton: false,
    ownBackButton: false,
    band: null,
    showTitle: null,
});

const OPTION_KEYS = Object.keys(defaultHeaderOptions) as HeaderOptionKey[];

/**
 * The registry is the only context, and it never changes. The merged options live in it as a
 * store that the header subscribes to. A context value around the page would push every
 * registration into the page's subtree, and React renders a Suspense boundary that hasn't
 * hydrated yet (a lazily loaded block) from scratch when a context above it changes. On web
 * that threw away the server-rendered login form, with whatever the visitor had typed into it.
 */
const HeaderOptionsRegistryContext = createContext<HeaderOptionsRegistry | null>(null);

// Native has no server pass; on web the registration effect must not run on
// the server either way — an isomorphic layout effect keeps header and page
// content in the same paint on the client.
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function pickDefined(props: HeaderOptionValues): HeaderOptionValues {
    const values: Record<string, unknown> = {};
    for (const key of OPTION_KEYS) {
        if (props[key] !== undefined) {
            values[key] = props[key];
        }
    }
    return values as HeaderOptionValues;
}

function mergeEntries(entries: HeaderOptionsEntry[]): HeaderOptions {
    if (entries.length === 0) return defaultHeaderOptions;
    return Object.assign({}, defaultHeaderOptions, ...entries.map((entry) => entry.values));
}

function createHeaderOptionsRegistry(): HeaderOptionsRegistry {
    let entries: HeaderOptionsEntry[] = [];
    let options: HeaderOptions = defaultHeaderOptions;
    const listeners = new Set<HeaderOptionsListener>();

    const commit = (next: HeaderOptionsEntry[]) => {
        entries = next;
        options = mergeEntries(entries);
        listeners.forEach((listener) => listener(options));
    };

    return {
        set(id, values) {
            const index = entries.findIndex((entry) => entry.id === id);
            if (index === -1) {
                commit([...entries, { id, values }]);
                return;
            }
            const next = entries.slice();
            next[index] = { id, values };
            commit(next);
        },
        remove(id) {
            if (!entries.some((entry) => entry.id === id)) return;
            commit(entries.filter((entry) => entry.id !== id));
        },
        subscribe(listener) {
            listeners.add(listener);
            listener(options);
            return () => {
                listeners.delete(listener);
            };
        },
    };
}

export function HeaderOptionsProvider({ children }: Readonly<{ children?: ReactNode }>) {
    // Identity-stable for the provider's life, so registering components never re-run their
    // effect because of the provider.
    const [registry] = useState(createHeaderOptionsRegistry);

    return (
        <HeaderOptionsRegistryContext.Provider value={registry}>
            {children}
        </HeaderOptionsRegistryContext.Provider>
    );
}

/**
 * Merged options for the header of the current `Layout`. The first render has the defaults, as
 * on the server; the layout-effect subscription applies the page's options before paint.
 */
export function useHeaderOptions(): HeaderOptions {
    const registry = useContext(HeaderOptionsRegistryContext);
    const [options, setOptions] = useState<HeaderOptions>(defaultHeaderOptions);

    useIsoLayoutEffect(() => {
        if (!registry) return undefined;
        return registry.subscribe(setOptions);
    }, [registry]);

    return options;
}

/**
 * Declare header options for the enclosing page header. Renders nothing.
 * Only props that are passed (not `undefined`) take part in the merge, so
 * `<PageHeaderOptions sub={x}/>` leaves `title`/`backButton` to other owners.
 * Outside a `HeaderOptionsProvider` (no page header) it is a no-op.
 *
 * `mobileOnly` makes it a no-op on desktop as well — the entry is not
 * registered at all (not registered as `null`), so it never shadows another
 * owner of the same key. Saves every page from `isDesktop ? null : <…/>`.
 */
export function PageHeaderOptions({ main, sub, actions, hidden, title, backButton, ownBackButton, band, showTitle, mobileOnly = false }: Readonly<HeaderOptionValues & { mobileOnly?: boolean }>) {
    const registry = useContext(HeaderOptionsRegistryContext);
    const isDesktop = useIsDesktop();
    const active = !(mobileOnly && isDesktop);
    const id = useId();

    // Keyed on the option values themselves: element props are compared by
    // identity, so callers should memo `sub`/`main` like any other element.
    useIsoLayoutEffect(() => {
        if (!registry || !active) return undefined;
        registry.set(id, pickDefined({ main, sub, actions, hidden, title, backButton, ownBackButton, band, showTitle }));
        return undefined;
    }, [registry, id, active, main, sub, actions, hidden, title, backButton, ownBackButton, band, showTitle]);

    // Also runs when `active` flips to false (desktop resize), dropping the entry.
    useIsoLayoutEffect(() => {
        if (!registry || !active) return undefined;
        return () => registry.remove(id);
    }, [registry, id, active]);

    return null;
}
