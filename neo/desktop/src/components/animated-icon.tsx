/**
 * A sidebar icon that moves a little when its row is pointed at or focused, and takes a light fill
 * while its row is the current one: xymbols' animated Lucide icons, the ones NEO's and UNA's menus
 * use, with the same drawings and motions.
 *
 * Until the icon's data has loaded (one small module per icon, from the app's bundle), and for a
 * name xymbols has no animation for, the still icon draws (`SiteIcon`) at the same size, so the
 * row never moves. Reduced motion keeps the fill and drops the movement (xymbols' own styles).
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { type AnimatedIconData, type AnimationController, createAnimatedElement, ensureAnimateStyles } from 'xymbols/animated';

import type { IconName } from './icon';
import { SiteIcon } from './site-icon';

const GLOB = import.meta.glob<AnimatedIconData>(['xymbols-dist/generated/animated/*.js', '!**/index.js'], { import: 'default' });
/** The loaders by Lucide name (the file's name). */
const ANIMATED = new Map(Object.entries(GLOB).map(([path, load]) => [path.slice(path.lastIndexOf('/') + 1, -'.js'.length), load]));

const loaded = new Map<string, AnimatedIconData | null>();

/** The loader of an icon's animation, by its Lucide name; null for none. */
export function animationLoader(name: string): (() => Promise<AnimatedIconData>) | null {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) return null;
    return ANIMATED.get(name) ?? null;
}

type Props = {
    /** The Lucide name: the app's own (`IconName`) or one a site names. */
    name: string | null | undefined;
    /** What draws for a name Lucide does not have. */
    fallback: IconName;
    /** The row it is in is the current one: the icon takes its fill. */
    active?: boolean;
    size?: 16 | 20;
    /** The rows whose hover and keyboard focus play it. */
    group?: string;
};

export function AnimatedIcon({ name, fallback, active = false, size = 20, group = '.nav-item' }: Props) {
    const host = useRef<HTMLSpanElement>(null);
    const controller = useRef<AnimationController | null>(null);
    // what has loaded since this icon was drawn; an icon loaded before is read from `loaded`
    const [fresh, setFresh] = useState<{ name: string; icon: AnimatedIconData } | null>(null);
    const data = name ? (fresh?.name === name ? fresh.icon : (loaded.get(name) ?? null)) : null;

    useEffect(() => {
        if (!name || loaded.has(name)) return;
        const load = animationLoader(name);
        if (!load) {
            loaded.set(name, null);
            return;
        }
        let live = true;
        load().then(
            (icon) => {
                loaded.set(name, icon);
                if (live) setFresh({ name, icon });
            },
            () => loaded.set(name, null),
        );
        return () => {
            live = false;
        };
    }, [name]);

    // `active` is read when the drawing is made and kept current below, so a change of row never
    // rebuilds the icon
    const activeRef = useRef(active);
    useLayoutEffect(() => {
        activeRef.current = active;
    }, [active]);
    // before the paint: the animated drawing replaces the still one with no empty frame between
    useLayoutEffect(() => {
        const el = host.current;
        if (!el || !data) return;
        ensureAnimateStyles();
        const made = createAnimatedElement(data, { size, strokeWidth: 1.5, trigger: ['group-hover'], group, active: activeRef.current, class: 'icon' });
        made.element.setAttribute('aria-hidden', 'true');
        made.element.setAttribute('focusable', 'false');
        el.replaceChildren(made.element);
        controller.current = made.controller;
        return () => {
            made.controller.destroy();
            controller.current = null;
            el.replaceChildren();
        };
    }, [data, size, group]);

    useEffect(() => {
        controller.current?.setActive(active);
    }, [active]);

    if (!data) return <SiteIcon name={name} fallback={fallback} size={size} />;
    return <span ref={host} className="animated-icon" data-icon={name ?? undefined} style={{ width: size, height: size }} />;
}
