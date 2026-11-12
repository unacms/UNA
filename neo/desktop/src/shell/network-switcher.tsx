import { useRef } from 'react';

import { Icon } from '../components/icon';
import { SiteMark } from '../components/site-mark';
import { Tooltip } from '../components/tooltip';
import { useSiteInfo } from '../lib/branding';
import { useApp } from '../lib/context';
import { t } from '../lib/i18n';
import { inApp, openExternal, sessionLabel } from '../lib/native';
import { type MenuEntry, showMenu, useMenuExpanded } from '../lib/native-menu';
import { platform } from '../lib/platform';
import { ariaKeyShortcuts, command, type CommandId } from '../lib/shortcuts';

const switchKey = (i: number): CommandId => `switch-network-${i + 1}` as CommandId;

/** The network menu's items: the networks signed in to, Add Network…, the site, Sign Out. */
export function networkMenu({
    sessions,
    current,
    name,
    switchNetwork,
    addNetwork,
    openSite,
    signOut,
}: {
    sessions: { key: string; siteUrl: string; siteName: string; accountName: string; needsSignIn?: boolean }[];
    current?: string;
    name: string;
    switchNetwork?: (key: string) => void;
    addNetwork?: () => void;
    openSite: () => void;
    signOut: () => void;
}): MenuEntry[] {
    const entries: MenuEntry[] = sessions.map((s, i) => {
        const c = i < 9 ? command(switchKey(i)) : null;
        const here = s.key === current;
        // the open one by the name the rest of the menu and the sidebar use (a sign-in of an
        // older version kept none, and the site's own name was asked for since)
        const text = here && !s.siteName.trim() && name ? sessionLabel({ ...s, siteName: name }) : sessionLabel(s);
        return {
            // one its site signed out stays here: choosing it opens its sign-in screen
            text: s.needsSignIn ? t('{{name}} (signed out)', { name: text }) : text,
            checked: here,
            accelerator: c?.accelerator,
            keyshortcuts: c ? ariaKeyShortcuts(c, platform.mac) : undefined,
            run: () => {
                if (!here) switchNetwork?.(s.key);
            },
        };
    });
    if (entries.length) entries.push('separator');
    if (inApp && addNetwork) entries.push({ text: t('Add Network…'), run: addNetwork });
    entries.push({ text: t('Open {{name}} in Browser', { name }), run: openSite });
    entries.push('separator');
    entries.push({ text: t('Sign Out of {{name}}', { name }), run: signOut });
    return entries;
}

/**
 * The network at the top of the sidebar: its mark and name, a menu button. The menu is the
 * OS's own (lib/native-menu.ts): the networks signed in to (the open one checked, each with
 * its Cmd+Ctrl key), Add Network…, the site in the browser and Sign Out. Focus is back on the
 * button when it closes.
 */
/** "UNA Makers, switch network"; with the account when another sign-in to the same site is in the menu. */
export function networkButtonName(site: { name: string; account?: string }, sessions: { siteUrl: string }[], siteUrl: string): string {
    const sameSite = sessions.filter((s) => s.siteUrl.replace(/\/+$/, '') === siteUrl.replace(/\/+$/, '')).length;
    return sameSite > 1 && site.account ? t('{{name}}, {{account}}, switch network', { name: site.name, account: site.account }) : t('{{name}}, switch network', { name: site.name });
}

export function NetworkSwitcher({ rail }: { rail: boolean }) {
    const { siteUrl, sessions = [], sessionKey, switchNetwork, addNetwork, signOut } = useApp();
    const site = useSiteInfo();
    const button = useRef<HTMLButtonElement>(null);
    const expanded = useMenuExpanded('network');

    const open = () => {
        const el = button.current;
        if (!el) return;
        const entries = networkMenu({
            sessions,
            current: sessionKey,
            name: site.name,
            switchNetwork,
            addNetwork,
            openSite: () => void openExternal(siteUrl).catch((e: unknown) => console.error('open site', e)),
            signOut,
        });
        void showMenu(entries, { anchor: el }, { label: t('Networks'), owner: 'network' }).catch((e: unknown) => console.error('menu', e));
    };

    const control = (
        <button
            ref={button}
            type="button"
            className="network"
            aria-haspopup="menu"
            aria-expanded={expanded}
            aria-label={networkButtonName(site, sessions, siteUrl)}
            title={rail ? undefined : site.name}
            onClick={open}
            onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    open();
                }
            }}
        >
            <SiteMark site={site} siteUrl={siteUrl} size={24} />
            {rail ? null : (
                <>
                    <span className="network-name truncate">{site.name}</span>
                    <span className="network-chevron">
                        <Icon name="chevrons-up-down" size={14} />
                    </span>
                </>
            )}
        </button>
    );
    // the rail shows only the mark: its name on hover and focus, as the rows have
    return rail ? <Tooltip text={site.name}>{control}</Tooltip> : control;
}
