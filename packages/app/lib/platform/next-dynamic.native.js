import { createElement, lazy, Suspense } from 'react';

/**
 * Native stand-in for `next/dynamic` (aliased in apps/expo/metro.config.js), so
 * registry `_map.js` files can use `dynamic(() => import('./x'))` on both platforms.
 *
 * Metro inlines `import()`, so there is no code splitting to gain on native. The
 * load starts when the map is evaluated and the component then renders
 * synchronously, like a static import; `React.lazy` + Suspense only covers a
 * render that comes before the import has settled.
 */
export default function dynamic(loader, options = {}) {
    let Loaded = null;
    const promise = loader().then((mod) => {
        Loaded = mod && typeof mod === 'object' && 'default' in mod ? mod.default : mod;
        return { default: Loaded };
    });
    const Lazy = lazy(() => promise);
    const Loading = options.loading;

    function DynamicComponent(props) {
        if (Loaded) {
            return createElement(Loaded, props);
        }
        return createElement(
            Suspense,
            { fallback: Loading ? createElement(Loading) : null },
            createElement(Lazy, props)
        );
    }
    return DynamicComponent;
}
