'use client';

import { specs } from 'app/ui/atoms/animated-icons/specs';
import type { AnimatedIconSpec, LazyAnimatedIconEntry } from 'app/ui/atoms/animated-icons/types';
import type { ComponentType } from 'react';

/** A registry value: a spec, a `lazyAnimatedIcon(() => import(...))` entry, or (legacy) a component. */
export type AnimatedIconRegistryValue = AnimatedIconSpec | LazyAnimatedIconEntry | ComponentType<any>;

/**
 * Animated icons by resolved Lucide name (see animated-icons.md). Native draws them synchronously from the specs;
 * the web registry (animated-icons.web.ts) holds loaders with the same keys instead.
 */
export const animatedIcons: Record<string, AnimatedIconRegistryValue> = { ...specs };
