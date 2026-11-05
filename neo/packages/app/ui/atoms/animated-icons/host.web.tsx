'use client'

import { useEffect, useState, useSyncExternalStore, type ComponentType } from 'react';
import { animatedIcons } from 'app/customization/animated-icons';
import { IconFromSet } from 'app/ui/atoms/iconset';
import type { IconCoreProps } from 'app/ui/atoms/icon';
import type { AnimatedIconSpec } from './types';
import { engineProps } from './engine-props';
import { isAnimatedIconSpec, isLazyAnimatedIcon, loadedSpec } from './lazy';
import { LegacyAnimatedIcon } from './legacy-icon';

/**
 * Web host. Everything in this file is in the page's first chunk, so it stays small: the engine, the specs and
 * the alias data load in their own chunks once the page is idle after hydration (or on the first pointer or
 * focus move, whichever comes first). Until then, and for names without an animated icon, `Icon` draws the
 * static mask, which has the same geometry, so the swap moves nothing.
 */

type Runtime = typeof import('./runtime.web');

const registry = animatedIcons as Record<string, unknown>;
let runtime: Runtime | null = null;
let version = 0;
let loadStarted = false;
let loadScheduled = false;
const listeners = new Set<() => void>();
/** Spec per icon name once known; null when the name has no animated icon. */
const specs = new Map<string, AnimatedIconSpec | null>();
const pending = new Set<string>();

const emit = () => {
    version += 1;
    listeners.forEach((listener) => listener());
};
const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
};
const getVersion = () => version;
/** Hydration renders what the server rendered: the static icon. */
const getServerVersion = () => 0;

function loadRuntime() {
    if (loadStarted) return;
    loadStarted = true;
    // The default specs chunk is fetched alongside, so the swap waits for one round trip, not two.
    void import('app/ui/atoms/animated-icons/specs').catch(() => {});
    import('./runtime.web').then(
        (module) => { runtime = module; emit(); },
        () => {} // stays static
    );
}

function scheduleRuntime() {
    if (loadScheduled || typeof window === 'undefined') return;
    loadScheduled = true;
    const events = ['pointerover', 'focusin'] as const;
    let idle: number | undefined;
    const go = () => {
        events.forEach((type) => window.removeEventListener(type, go, true));
        if (idle !== undefined) (window.cancelIdleCallback ?? window.clearTimeout)(idle);
        loadRuntime();
    };
    events.forEach((type) => window.addEventListener(type, go, { capture: true, passive: true }));
    idle = window.requestIdleCallback ? window.requestIdleCallback(go, { timeout: 4000 }) : window.setTimeout(go, 2000);
}

type Resolved =
    | { kind: 'spec'; spec: AnimatedIconSpec }
    | { kind: 'component'; Component: ComponentType<any> }
    | null
    | undefined;

/** What `name` animates with: undefined while unknown (engine or lazy spec still loading), null for nothing. */
function resolve(name: string): Resolved {
    const direct = registry[name];
    // A legacy component a fork registered draws at once, as it always did.
    if (typeof direct === 'function') return { kind: 'component', Component: direct as ComponentType<any> };
    if (!runtime) return undefined;
    const key = runtime.animatedIconKey(registry, name);
    const value = key ? registry[key] : null;
    if (typeof value === 'function') return { kind: 'component', Component: value as ComponentType<any> };
    if (isAnimatedIconSpec(value)) return { kind: 'spec', spec: value };
    if (!isLazyAnimatedIcon(value)) return null;
    if (specs.has(name)) {
        const spec = specs.get(name);
        return spec ? { kind: 'spec', spec } : null;
    }
    if (!pending.has(name)) {
        pending.add(name);
        value.load().then(
            (loaded) => { specs.set(name, loadedSpec(loaded)); emit(); },
            () => { specs.set(name, null); emit(); }
        );
    }
    return undefined;
}

export function findAnimatedIcon(name: string): unknown {
    // The registry and aliases are only known once the runtime has loaded; the host decides then.
    return name;
}

export function AnimatedIconHost(props: IconCoreProps) {
    const current = useSyncExternalStore(subscribe, getVersion, getServerVersion);
    const icon = typeof props.icon === 'string' ? props.icon : '';
    const resolved = current > 0 || typeof registry[icon] === 'function' ? resolve(icon) : undefined;
    // Drawn statically first (hydration, or before the engine loaded): the swap fades the active fill in.
    const [startedStatic] = useState(() => !resolved);

    useEffect(() => {
        scheduleRuntime();
    }, []);

    if (resolved?.kind === 'component')
        return <LegacyAnimatedIcon {...props} Component={resolved.Component} />;
    if (resolved?.kind !== 'spec' || !runtime) {
        // Until then: the inline Lucide copy where web has one (no mask request), else the mask.
        const Inline = props.InlineIcon;
        if (Inline)
            return <Inline width={props.width || props.size} height={props.height || props.size} color={props.color} strokeWidth={props._strokeWidth} className={props.cleanedClassName} />;
        return <IconFromSet {...props} animatedIcon={null} />;
    }

    const engine = engineProps(props);
    // As the static icon: a `text-*` class wins over `color`.
    const color = /\b(?:dark:)?text-/.test(engine.className) ? undefined : engine.color;
    const Engine = runtime.AnimatedLucideIcon;
    return <Engine {...engine} color={color} spec={resolved.spec} swapped={startedStatic} />;
}
