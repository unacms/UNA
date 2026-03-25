'use client';

import { AnimatedHouse } from 'app/ui/atoms/animated-icons/icons/house';

/** Keys must match resolved Lucide icon names (e.g. after findIconFromRemote). */
export const animatedIconRegistry = {
    House: AnimatedHouse,
};

export function getAnimatedIconComponent(name) {
    return animatedIconRegistry[name] ?? null;
}
