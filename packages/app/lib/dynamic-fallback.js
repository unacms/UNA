/**
 * `loading` for registry entries loaded with `next/dynamic`:
 *
 *   dynamic(() => import('./text'), { loading: DynamicFallback })
 *
 * Any `loading` gives each entry its own Suspense boundary. Without one, a
 * component that is not loaded yet (a form opened by a click) suspends up to the
 * page boundary and blanks the whole page; with one, only that spot waits, and
 * server-rendered entries hydrate independently.
 *
 * Keep the call literal — `dynamic(() => import('…'), { … })` with `dynamic`
 * imported from 'next/dynamic' — so Next can preload the chunks of every entry
 * rendered during SSR (a wrapper around `dynamic` loses that).
 */
export function DynamicFallback() {
    return null;
}
