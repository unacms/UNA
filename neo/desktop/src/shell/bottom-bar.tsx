/**
 * The window's bottom bar, under the sidebar and the content, as Linear has it: the network's
 * footer links on the left (GET /navigation `footer`: Studio > Navigation > Footer, `sys_footer`),
 * and the agent chats on the right (features/agents). A footer link to a page of the site opens
 * that page in the content pane, as a sidebar row does (nothing beside it); a link to another
 * site opens in the browser; a link to the site that the app can't show is left out (the app
 * never sends people to the site for what it shows itself); text (the copyright notice) is text.
 */
import type { ReactNode } from 'react';

import { t } from '../lib/i18n';
import { type ListRoute } from '../lib/router';
import { type NavigationItem, targetList, useSiteNavigation } from '../lib/site-navigation';
import { dragRegion } from '../lib/platform';

export type FooterLink = { key: string; label: string } & ({ kind: 'list'; list: ListRoute } | { kind: 'external'; url: string } | { kind: 'text' });

/** The footer's items as the bar draws them, in Studio's order. */
export function footerLinks(items: readonly NavigationItem[], siteUrl: string): FooterLink[] {
    let origin = '';
    try {
        origin = new URL(siteUrl).origin;
    } catch {
        // no site: every link is another's
    }
    const out: FooterLink[] = [];
    for (const item of items) {
        const label = item.title.trim();
        if (!label) continue;
        const list = targetList(item.target);
        if (list) {
            out.push({ key: item.id, label, kind: 'list', list });
            continue;
        }
        if (item.link) {
            let url: URL | null = null;
            try {
                url = new URL(item.link);
            } catch {
                url = null;
            }
            // the site's own pages open in the app or not at all
            if (url && /^https?:$/.test(url.protocol) && url.origin !== origin) out.push({ key: item.id, label, kind: 'external', url: url.href });
            continue;
        }
        if (!item.target) out.push({ key: item.id, label, kind: 'text' });
    }
    return out;
}

type Props = {
    siteUrl: string;
    /** A footer link's page: shown in the content pane with nothing beside it (the sidebar's rule). */
    onGo: (list: ListRoute) => void;
    /** The agent chats, at the right end. */
    agents?: ReactNode;
};

export function BottomBar({ siteUrl, onGo, agents }: Props) {
    const navigation = useSiteNavigation();
    const links = footerLinks(navigation?.footer ?? [], siteUrl);
    return (
        <div className="chrome-bottom" {...dragRegion}>
            {links.length ? (
                <nav className="footer-links" aria-label={t('Footer')}>
                    <ul>
                        {links.map((l) => (
                            <li key={l.key}>
                                {l.kind === 'list' ? (
                                    <button type="button" className="footer-link" onClick={() => onGo(l.list)}>
                                        {l.label}
                                    </button>
                                ) : l.kind === 'external' ? (
                                    // the browser opens it (App's captureLinks takes every http(s) link)
                                    <a className="footer-link" href={l.url}>
                                        {l.label}
                                    </a>
                                ) : (
                                    <span className="footer-text">{l.label}</span>
                                )}
                            </li>
                        ))}
                    </ul>
                </nav>
            ) : (
                <span className="chrome-fill" {...dragRegion} />
            )}
            {agents ? <div className="chrome-agents">{agents}</div> : null}
        </div>
    );
}
