'use client'

import { useEffect, useState, type ComponentType } from 'react';
import { animatedIcons } from 'app/customization/animated-icons';
import { IconFromSet } from 'app/ui/atoms/iconset';
import { useIconClassColor } from 'app/ui/atoms/icon-class-color';
import type { IconCoreProps } from 'app/ui/atoms/icon';
import type { AnimatedIconSpec, LazyAnimatedIconEntry } from './types';
import AnimatedLucideIcon from './animated-lucide-icon';
import { engineProps } from './engine-props';
import { isAnimatedIconSpec, isLazyAnimatedIcon, loadedSpec } from './lazy';
import { LegacyAnimatedIcon } from './legacy-icon';
import { animatedIconKey } from './resolve';

const registry = animatedIcons as Record<string, unknown>;

/** Native: the registry value an icon name animates with (aliases resolved), or null. */
export function findAnimatedIcon(name: string): unknown {
    const key = animatedIconKey(registry, name);
    return key ? registry[key] : null;
}

const loaded = new Map<LazyAnimatedIconEntry, AnimatedIconSpec | null>();

/** A lazy entry's spec once loaded (a fork may register one on native too); the static icon draws meanwhile. */
function useLazySpec(entry: LazyAnimatedIconEntry | null) {
    const [spec, setSpec] = useState(() => (entry ? loaded.get(entry) : undefined));
    useEffect(() => {
        if (!entry || loaded.has(entry)) return;
        let alive = true;
        entry.load().then(
            (value) => { const result = loadedSpec(value); loaded.set(entry, result); if (alive) setSpec(result); },
            () => { loaded.set(entry, null); }
        );
        return () => { alive = false; };
    }, [entry]);
    return entry ? (spec ?? loaded.get(entry)) : undefined;
}

/** Native host: draws the registry value synchronously (spec engine or legacy component). */
export function AnimatedIconHost(props: IconCoreProps) {
    const value = props.animatedIcon;
    const lazySpec = useLazySpec(isLazyAnimatedIcon(value) ? value : null);
    const classColor = useIconClassColor(props.cleanedClassName);
    if (typeof value === 'function')
        return <LegacyAnimatedIcon {...props} Component={value as ComponentType<any>} />;
    const spec = isAnimatedIconSpec(value) ? value : lazySpec;
    if (!spec) return <IconFromSet {...props} animatedIcon={null} />;
    const engine = engineProps(props);
    return <AnimatedLucideIcon {...engine} color={props.color || classColor} spec={spec} />;
}
