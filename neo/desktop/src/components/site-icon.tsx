/**
 * An icon a site names (a sidebar item's Lucide icon, Studio's choice): the app's own set when it
 * has it, otherwise the same Lucide release loaded on demand, one small module per icon, from the
 * app's bundle (nothing comes from the network). Until it has loaded, and for a name Lucide does
 * not have, the place's own icon (`fallback`) draws, at the same size, so the row never moves.
 */
import { useEffect, useState } from 'react';

import { Icon, type IconName, isIconName, svgMarkup } from './icon';

const loaded = new Map<string, string | null>();

/** The loader of a Lucide icon, by name; null for none. The map of loaders is a chunk of its own. */
async function loader(name: string): Promise<(() => Promise<string>) | null> {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) return null;
    const { lucide } = await import('./icon-loaders');
    return lucide.get(name) ?? null;
}

type Props = { name: string | null | undefined; fallback: IconName; size?: 16 | 20 };

export function SiteIcon({ name, fallback, size = 20 }: Props) {
    const own = name && isIconName(name) ? name : null;
    const [html, setHtml] = useState<string | null>(() => (name && !own ? (loaded.get(name) ?? null) : null));
    useEffect(() => {
        if (!name || own || loaded.has(name)) return;
        let live = true;
        loader(name)
            .then((load) => (load ? load() : null))
            .then((raw) => {
                if (raw === null) {
                    loaded.set(name, null);
                    return;
                }
                const markup = svgMarkup(raw);
                loaded.set(name, markup);
                if (live) setHtml(markup);
            })
            .catch(() => loaded.set(name, null));
        return () => {
            live = false;
        };
    }, [name, own]);
    if (own) return <Icon name={own} size={size} />;
    const markup = html ?? (name ? loaded.get(name) : null);
    if (!markup) return <Icon name={fallback} size={size} />;
    return <span className="icon" aria-hidden="true" data-icon={name} style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: markup }} />;
}
