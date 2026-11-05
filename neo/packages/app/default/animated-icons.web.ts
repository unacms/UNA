'use client';

import { ANIMATED_ICON_NAMES } from 'app/ui/atoms/animated-icons/names';
import { lazyAnimatedIcon } from 'app/ui/atoms/animated-icons/lazy';
import type { AnimatedIconSpec, LazyAnimatedIconEntry } from 'app/ui/atoms/animated-icons/types';
import type { ComponentType } from 'react';

/** A registry value: a spec, a `lazyAnimatedIcon(() => import(...))` entry, or (legacy) a component. */
export type AnimatedIconRegistryValue = AnimatedIconSpec | LazyAnimatedIconEntry | ComponentType<any>;

const loadSpecs = () => import('app/ui/atoms/animated-icons/specs');

/**
 * Animated icons by resolved Lucide name (see animated-icons.md). On web each entry is a loader: the page draws the
 * static icon first and swaps in the animated one once the engine and specs have loaded, after hydration.
 */
export const animatedIcons: Record<string, AnimatedIconRegistryValue> = Object.fromEntries(
    ANIMATED_ICON_NAMES.map((name) => [name, lazyAnimatedIcon(() => loadSpecs().then((m) => m.specs[name]))])
);
