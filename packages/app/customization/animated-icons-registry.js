'use client';

import { animatedIconRegistry as animatedIconRegistryDefault } from 'app/default/animated-icons-registry';

// DON'T EDIT THIS FILE IN MAIN REPO!!!
// Custom projects: spread in additional animated icons or overrides.
export const animatedIconRegistry = {
    ...animatedIconRegistryDefault,
};

export function getAnimatedIconComponent(name) {
    return animatedIconRegistry[name] ?? null;
}
