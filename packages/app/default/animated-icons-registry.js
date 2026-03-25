'use client';

import { AnimatedHouse } from 'app/ui/atoms/animated-icons/icons/house';
import { AnimatedCompass } from 'app/ui/atoms/animated-icons/icons/compass';
import { AnimatedTvMinimalPlay } from 'app/ui/atoms/animated-icons/icons/tv-minimal-play';
import { AnimatedStore } from 'app/ui/atoms/animated-icons/icons/store';
import { AnimatedShapes } from 'app/ui/atoms/animated-icons/icons/shapes';
import { AnimatedCalendar } from 'app/ui/atoms/animated-icons/icons/calendar';
import { AnimatedInfo } from 'app/ui/atoms/animated-icons/icons/info';
import { AnimatedMail } from 'app/ui/atoms/animated-icons/icons/mail';
import { AnimatedMenu } from 'app/ui/atoms/animated-icons/icons/menu';

/** Keys must match resolved Lucide icon names (e.g. after findIconFromRemote). */
export const animatedIconRegistry = {
    House: AnimatedHouse,
    Compass: AnimatedCompass,
    TvMinimalPlay: AnimatedTvMinimalPlay,
    Store: AnimatedStore,
    Shapes: AnimatedShapes,
    Calendar: AnimatedCalendar,
    Info: AnimatedInfo,
    Mail: AnimatedMail,
    Menu: AnimatedMenu,
};

export function getAnimatedIconComponent(name) {
    return animatedIconRegistry[name] ?? null;
}
