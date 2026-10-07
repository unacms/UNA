'use client';

import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState, useId } from 'react';
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

/** `main` replaces the whole bar; `sub` is the row under it; `hidden` drops the bar. */
export const defaultHeaderOptions = Object.freeze({
    main: null,
    sub: null,
    actions: null,
    hidden: false,
    title: false,
    backButton: false,
});

const OPTION_KEYS = Object.keys(defaultHeaderOptions);

const HeaderOptionsContext = createContext(defaultHeaderOptions);
const HeaderOptionsRegistryContext = createContext(null);

// Native has no server pass; on web the registration effect must not run on
// the server either way — an isomorphic layout effect keeps header and page
// content in the same paint on the client.
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function pickDefined(props) {
    const values = {};
    for (const key of OPTION_KEYS) {
        if (props[key] !== undefined) {
            values[key] = props[key];
        }
    }
    return values;
}

function mergeEntries(entries) {
    if (entries.length === 0) return defaultHeaderOptions;
    return Object.assign({}, defaultHeaderOptions, ...entries.map((entry) => entry.values));
}

export function HeaderOptionsProvider({ children }) {
    const [entries, setEntries] = useState([]);

    // Registry is identity-stable for the provider's life so registering
    // components never re-run their effect because of the provider.
    const registry = useMemo(() => ({
        set(id, values) {
            setEntries((prev) => {
                const index = prev.findIndex((entry) => entry.id === id);
                if (index === -1) return [...prev, { id, values }];
                const next = prev.slice();
                next[index] = { id, values };
                return next;
            });
        },
        remove(id) {
            setEntries((prev) => {
                if (!prev.some((entry) => entry.id === id)) return prev;
                return prev.filter((entry) => entry.id !== id);
            });
        },
    }), []);

    const options = useMemo(() => mergeEntries(entries), [entries]);

    return (
        <HeaderOptionsRegistryContext.Provider value={registry}>
            <HeaderOptionsContext.Provider value={options}>
                {children}
            </HeaderOptionsContext.Provider>
        </HeaderOptionsRegistryContext.Provider>
    );
}

/** Merged options for the header of the current `Layout`. */
export function useHeaderOptions() {
    return useContext(HeaderOptionsContext);
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
export function PageHeaderOptions({ main, sub, actions, hidden, title, backButton, mobileOnly = false }) {
    const registry = useContext(HeaderOptionsRegistryContext);
    const isDesktop = useIsDesktop();
    const active = !(mobileOnly && isDesktop);
    const id = useId();

    // Keyed on the option values themselves: element props are compared by
    // identity, so callers should memo `sub`/`main` like any other element.
    useIsoLayoutEffect(() => {
        if (!registry || !active) return undefined;
        registry.set(id, pickDefined({ main, sub, actions, hidden, title, backButton }));
        return undefined;
    }, [registry, id, active, main, sub, actions, hidden, title, backButton]);

    // Also runs when `active` flips to false (desktop resize), dropping the entry.
    useIsoLayoutEffect(() => {
        if (!registry || !active) return undefined;
        return () => registry.remove(id);
    }, [registry, id, active]);

    return null;
}
