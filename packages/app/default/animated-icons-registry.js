'use client';

import { AnimatedHouse } from 'app/ui/atoms/animated-icons/icons/house';
import { AnimatedCompass } from 'app/ui/atoms/animated-icons/icons/compass';
import { AnimatedTvMinimalPlay } from 'app/ui/atoms/animated-icons/icons/tv-minimal-play';

/** Keys must match resolved Lucide icon names (e.g. after findIconFromRemote). */
export const animatedIconRegistry = {
    House: AnimatedHouse,
    Compass: AnimatedCompass,
    TvMinimalPlay: AnimatedTvMinimalPlay,
};

export function getAnimatedIconComponent(name) {
    return animatedIconRegistry[name] ?? null;
}
