import { type ReactNode, useRef } from 'react';

import type { Schema } from 'una-api';

import { AnimatedIcon } from '../components/animated-icon';
import { Avatar } from '../components/avatar';
import { Icon, type IconName } from '../components/icon';
import { Tooltip } from '../components/tooltip';
import { VisuallyHidden } from '../components/visually-hidden';
import { useApp } from '../lib/context';
import { t, tn } from '../lib/i18n';
import { showMenu, useMenuExpanded } from '../lib/native-menu';
import { dragRegion } from '../lib/platform';
import type { Section } from '../lib/router';
import { appUpdates, useUpdates } from '../lib/updates';
import { ariaKeyShortcuts, command, type CommandId } from '../lib/shortcuts';
import { SearchField } from '../features/search/search-view';
import { NetworkSwitcher } from './network-switcher';
import { ToolbarButton } from './pane';

/**
 * A row of the sidebar: a section, nothing else. Pressing it shows the section in the content
 * pane with nothing open beside it (Navigation.go); a row has no way to open a detail beside
 * whatever list is shown, so none can (the Requests row once did: Connections' Requests tab is
 * its place). `spokenBadge` says what the badge counts (", 3 unread" when not given).
 */
export type NavItem = { section: Section; label: string; command?: CommandId; badge?: number; spokenBadge?: string; icon?: IconName };

type Props = {
    items: NavItem[];
    current: Section | null;
    onNavigate: (section: Section) => void;
    profile?: Schema<'Profile'>;
    mac: boolean;
    /** Drawn under the sections (the Groups the profile is in); not in the icon rail. */
    extra?: ReactNode;
    /**
     * The sidebar as the site sets it up (GET /navigation, sidebar-navigation.tsx), drawn in the
     * navigation landmark instead of `items` and `extra`, the icon rail too.
     */
    navigation?: ReactNode;
    /** Icons only (narrow windows, or Cmd+\): names are the buttons' accessible names and tooltips. */
    rail?: boolean;
    /** Hide or show the names (Cmd+\). */
    onToggle?: () => void;
    /** Settings (Cmd+,), at the foot. */
    onOpenSettings?: () => void;
    settingsOpen?: boolean;
    /** The profile menu's commands (View Profile, Keyboard Shortcuts, Sign Out). */
    onCommand?: (id: CommandId) => void;
    /** Act as another profile of the account. */
    onSwitchProfile?: (profileId: string) => void;
};

/** "99+" over 99: the count in the row, quiet; the exact number is in the row's name. */
export function badgeText(n: number): string {
    return n > 99 ? '99+' : String(n);
}

export function NavRow({
    label,
    icon,
    siteIcon,
    iconNode,
    current,
    keys,
    badge,
    spokenBadge,
    rail,
    mac,
    onClick,
}: {
    mac: boolean;
    label: string;
    icon?: IconName;
    /** An icon of the site's (a Lucide name the app may not have), drawn animated as `icon` is. */
    siteIcon?: { name: string | null; fallback: IconName };
    /** Anything else in the icon's place. */
    iconNode?: ReactNode;
    current?: 'page' | 'true';
    keys?: CommandId;
    badge?: number;
    spokenBadge?: string;
    rail: boolean;
    onClick: () => void;
}) {
    const c = keys ? command(keys) : undefined;
    return (
        <li>
            <Tooltip text={label} command={c}>
                <button type="button" className="nav-item" aria-current={current} aria-keyshortcuts={c ? ariaKeyShortcuts(c, mac) : undefined} onClick={onClick}>
                    <span className="nav-icon">
                        {iconNode ??
                            (siteIcon ? (
                                <AnimatedIcon name={siteIcon.name} fallback={siteIcon.fallback} active={!!current} />
                            ) : icon ? (
                                <AnimatedIcon name={icon} fallback={icon} active={!!current} />
                            ) : null)}
                    </span>
                    {rail ? <VisuallyHidden>{label}</VisuallyHidden> : <span className="nav-label truncate">{label}</span>}
                    {badge ? (
                        <>
                            <span className="nav-badge" aria-hidden="true">
                                {badgeText(badge)}
                            </span>
                            <VisuallyHidden>{spokenBadge ?? tn(badge, ', {{count}} unread', ', {{count}} unread')}</VisuallyHidden>
                        </>
                    ) : null}
                </button>
            </Tooltip>
        </li>
    );
}

/**
 * The account's profiles and what the person does with their own account, a menu button at the
 * sidebar's foot: the profiles (the acting one checked), View Profile, Settings…, Keyboard
 * Shortcuts and Sign Out.
 */
function ProfileSwitcher({ profile, rail, onCommand, onSwitchProfile }: Pick<Props, 'profile' | 'rail' | 'onCommand' | 'onSwitchProfile'>) {
    const { me } = useApp();
    const button = useRef<HTMLButtonElement>(null);
    const expanded = useMenuExpanded('profile');
    const name = profile?.display_name ?? t('Profile');
    const run = (id: CommandId) => () => onCommand?.(id);
    const open = () => {
        const el = button.current;
        if (!el) return;
        const accel = (id: CommandId) => command(id).accelerator;
        void showMenu(
            [
                ...me.profiles.map((p) => ({
                    text: p.display_name,
                    checked: p.id === me.active_profile_id,
                    run: () => {
                        if (p.id !== me.active_profile_id) onSwitchProfile?.(p.id);
                    },
                })),
                'separator',
                { text: t('View Profile'), accelerator: accel('go-profile'), run: run('go-profile') },
                { text: t('Settings…'), accelerator: accel('open-settings'), run: run('open-settings') },
                { text: t('Keyboard Shortcuts'), run: run('show-shortcuts') },
                { text: t('Check for Updates…'), run: run('check-updates') },
                'separator',
                { text: t('Sign Out'), run: run('sign-out') },
            ],
            { anchor: el },
            { label: t('Profile'), owner: 'profile' },
        ).catch((e: unknown) => console.error('menu', e));
    };
    const control = (
        <button
            ref={button}
            type="button"
            className="sidebar-me"
            aria-haspopup="menu"
            aria-expanded={expanded}
            aria-label={t('{{name}}, switch profile', { name })}
            onClick={open}
            onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    open();
                }
            }}
        >
            {profile ? <Avatar profile={profile} size={24} /> : null}
            {rail ? null : (
                <>
                    <span className="sidebar-me-name truncate">{name}</span>
                    <span className="network-chevron">
                        <Icon name="chevrons-up-down" size={14} />
                    </span>
                </>
            )}
        </button>
    );
    // the rail shows only the avatar: the name on hover and focus
    return rail ? <Tooltip text={name}>{control}</Tooltip> : control;
}

/**
 * A new version the app found by itself and has not installed: a button at the sidebar's foot
 * that opens the update dialog. Nothing is installed from here.
 */
function UpdateButton() {
    useUpdates();
    const update = appUpdates.pending;
    if (!update) return null;
    const label = t('Update to {{version}}', { version: update.version });
    const control = (
        <button type="button" className="tb-btn tb-btn-lg sidebar-update" aria-label={label} onClick={() => appUpdates.openDialog()}>
            <Icon name="circle-arrow-down" size={20} />
        </button>
    );
    return <Tooltip text={label}>{control}</Tooltip>;
}

/**
 * What the sidebar's toggle does next (Cmd+Backslash): the names or the icon rail, and in a
 * narrow window the names over the panes. The View menu's item says the same (menu.rs).
 */
export function sidebarToggleLabel(rail: boolean): string {
    return rail ? t('Show sidebar names') : t('Show icons only');
}

/**
 * The source list: the network (a menu), the search field, the sections with their counts,
 * the groups, and the profile (a menu). It sits on the window's material (tokens.css). Only
 * the sections and the groups are the navigation landmark; the search is its own landmark.
 */
export function Sidebar({ items, current, onNavigate, profile, mac: isMac, extra, navigation, rail = false, onToggle, onOpenSettings, settingsOpen, onCommand, onSwitchProfile }: Props) {
    const settings = command('open-settings');
    // the app's own sections, for a site that sets up no sidebar (GET /navigation)
    const fixed = (
        <>
            <ul className="nav-list">
                {items.map((n) => (
                    <NavRow
                        key={n.section}
                        label={n.label}
                        icon={n.icon}
                        keys={n.command}
                        badge={n.badge}
                        spokenBadge={n.spokenBadge}
                        rail={rail}
                        mac={isMac}
                        current={current === n.section ? 'page' : undefined}
                        onClick={() => onNavigate(n.section)}
                    />
                ))}
            </ul>
            {rail ? null : extra}
        </>
    );
    return (
        <div className="sidebar" data-pane="sidebar" data-rail={rail || undefined}>
            {/* the toggle is the top bar's (top-bar.tsx); a sidebar drawn on its own may still have one */}
            {onToggle ? (
                <div className="sidebar-head" {...dragRegion}>
                    <ToolbarButton className="sidebar-toggle" icon="panel-left" label={sidebarToggleLabel(rail)} commandId="toggle-sidebar" onClick={onToggle} />
                </div>
            ) : null}
            <NetworkSwitcher rail={rail} />
            {rail ? null : <SearchField variant="sidebar" />}
            <nav className="sidebar-nav" aria-label={t('Sections')}>
                {navigation ?? fixed}
            </nav>
            <div className="sidebar-foot">
                <UpdateButton />
                <ProfileSwitcher profile={profile} rail={rail} onCommand={onCommand} onSwitchProfile={onSwitchProfile} />
                {onOpenSettings ? (
                    <Tooltip text={t('Settings')} command={settings}>
                        <button
                            type="button"
                            className="tb-btn tb-btn-lg sidebar-settings"
                            aria-label={t('Settings')}
                            aria-current={settingsOpen ? 'page' : undefined}
                            aria-keyshortcuts={ariaKeyShortcuts(settings, isMac)}
                            onClick={onOpenSettings}
                        >
                            <Icon name="settings" size={20} />
                        </button>
                    </Tooltip>
                ) : null}
            </div>
        </div>
    );
}
