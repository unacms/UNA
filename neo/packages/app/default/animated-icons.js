'use client';

import { specs } from 'app/ui/atoms/animated-icons/specs';

/**
 * Animated icons by resolved Lucide name (see animated-icons.md). Native draws them synchronously from the specs;
 * the web registry (animated-icons.web.js) holds loaders with the same keys instead.
 * A value is a spec, a `lazyAnimatedIcon(() => import(...))` entry, or (legacy) a component.
 */
export const animatedIcons = { ...specs };
