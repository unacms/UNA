import type { AnimatedIconSpec, LazyAnimatedIconEntry } from './types';

/**
 * A registry entry whose spec loads on demand. On web the icon draws statically until it has loaded, so the spec's
 * code stays out of the page's first chunk:
 *
 *   MyIcon: lazyAnimatedIcon(() => import('app/customization/animated-icons/my-icon')),
 */
export function lazyAnimatedIcon(load: LazyAnimatedIconEntry['load']): LazyAnimatedIconEntry {
    return { lazyAnimatedIcon: true, load };
}

export function isLazyAnimatedIcon(value: unknown): value is LazyAnimatedIconEntry {
    return !!value && typeof value === 'object' && (value as LazyAnimatedIconEntry).lazyAnimatedIcon === true;
}

export function isAnimatedIconSpec(value: unknown): value is AnimatedIconSpec {
    return !!value && typeof value === 'object' && Array.isArray((value as AnimatedIconSpec).parts);
}

/** The spec a lazy entry resolved to: the value itself or a module's default export. */
export function loadedSpec(value: unknown): AnimatedIconSpec | null {
    if (isAnimatedIconSpec(value)) return value;
    const fallback = (value as { default?: unknown } | null)?.default;
    return isAnimatedIconSpec(fallback) ? fallback : null;
}
