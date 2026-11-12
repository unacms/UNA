import type { FocusEvent, KeyboardEvent, MouseEvent } from 'react';

import type { Schema } from 'una-api';

import { Avatar } from '../../components/avatar';
import { Icon } from '../../components/icon';
import { ProfileBadges } from '../../components/profile-badges';
import { SiteMark } from '../../components/site-mark';
import { ago } from '../../lib/api';
import { useSiteInfo } from '../../lib/branding';
import { useApp } from '../../lib/context';
import { locale, t } from '../../lib/i18n';
import { useOpenProfile } from '../profile/profile-link';
import { kindBadge } from './kind-icon';

type Notification = Schema<'Notification'>;

export type NotificationRowProps = {
    notification: Notification;
    /** Opened in the detail pane now (aria-current). */
    selected: boolean;
    /** Open it (Enter, o, a click on the row). */
    onOpen: () => void;
    /** Open what it is about in a window of its own (a double-click on the row); none where that can't be. */
    onOpenInWindow?: () => void;
    /** The virtualizer measures the row through it. */
    rowRef: (el: HTMLElement | null) => void;
    index: number;
    /** Its place among the virtual rows (day headings included): what the virtualizer measures it by. */
    virtualIndex: number;
    /** aria-setsize: the number of notifications, or -1 while more pages may follow. */
    setSize: number;
    /** Where the virtualizer places the row, in px from the top of the list. */
    offset: number;
    /** The day it is under ("Today", "Yesterday", a weekday or a date): said with its time. */
    day?: string;
    tabIndex: number;
    onFocus: (e: FocusEvent<HTMLElement>) => void;
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => void;
};

/**
 * What opening a notification does, for its name: the app opens what it is about, or who did it
 * (actions.ts); only one with neither opens on the site, and that is said, not drawn.
 */
function opensOnSite(n: Notification): boolean {
    return n.object_kind === 'other' && !n.actor;
}

/**
 * Who it is from (the first line) and what happened (the second): the site's text, without the
 * actor's name where it starts with it, since the first line says it.
 */
export function splitNotificationText(text: string, actor: string | null): { who: string | null; what: string } {
    if (actor && text.startsWith(actor)) return { who: actor, what: text.slice(actor.length).trim() };
    return { who: actor, what: text };
}

/**
 * One notification in the inbox: an article (the feed pattern) that is a stop in the list's
 * keys, laid out like a conversation in Messages: who on the first line with the time, what
 * happened on the second, cut to one line. Its text opens it, and so do Enter and a click
 * anywhere on the row; the picture opens who did it, with a badge for the kind of thing that
 * happened. Unread ones have a dot before the name, stronger text and the word ", unread".
 */
export function NotificationRow({ notification: n, selected, onOpen, onOpenInWindow, rowRef, index, virtualIndex, setSize, offset, day, tabIndex, onFocus, onKeyDown }: NotificationRowProps) {
    const openProfile = useOpenProfile();
    const site = useSiteInfo();
    const { siteUrl } = useApp();
    const textId = `notification-${n.id}-text`;
    const whoId = `notification-${n.id}-who`;
    const metaId = `notification-${n.id}-meta`;
    const actor = n.actor ?? null;
    const badge = kindBadge(n.kind, n.source);
    const onSite = opensOnSite(n);
    const { who, what } = splitNotificationText(n.text, actor?.display_name ?? null);
    // the first line repeats the text's start only when the text named the actor: then both are the name
    const named = !!who && n.text !== what;
    const whoText = who ?? site.name;

    const onClick = (e: MouseEvent<HTMLElement>) => {
        // the picture and links have their own job
        if ((e.target as Element).closest('button:not([data-open]), a')) return;
        onOpen();
    };
    const onDoubleClick = (e: MouseEvent<HTMLElement>) => {
        if (!onOpenInWindow || (e.target as Element).closest('button:not([data-open]), a')) return;
        window.getSelection()?.removeAllRanges();
        onOpenInWindow();
    };

    const picture = (
        <span className="kind-avatar">
            {actor ? (
                <Avatar profile={actor} size={40} />
            ) : (
                // a system or site message: the network's mark, not a "?"
                <SiteMark site={site} siteUrl={siteUrl} size={40} />
            )}
            <span className="kind-badge" data-tone={badge.tone} aria-hidden="true">
                <Icon name={badge.icon} size={11} />
            </span>
        </span>
    );

    return (
        <article
            ref={rowRef}
            className={`notification-row${n.read ? '' : ' unread'}`}
            data-index={index}
            data-row={virtualIndex}
            data-id={n.id}
            aria-posinset={index + 1}
            aria-setsize={setSize}
            aria-labelledby={named ? `${whoId} ${textId}` : textId}
            aria-describedby={metaId}
            aria-current={selected || undefined}
            tabIndex={tabIndex}
            onFocus={onFocus}
            onKeyDown={onKeyDown}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            style={{ transform: `translateY(${offset}px)` }}
        >
            {actor && openProfile ? (
                <button type="button" className="avatar-button" aria-label={t('{{name}}’s profile', { name: actor.display_name })} onClick={() => openProfile(actor)}>
                    {picture}
                </button>
            ) : (
                picture
            )}
            <span className="notification-main">
                <span className="notification-line">
                    {n.read ? null : <span className="unread-dot" aria-hidden="true" />}
                    {/* the actor's badges after the name: in the row's name too when it starts with the
                        name ("Lily, Moderator, liked your post"); the pills are aria-hidden */}
                    <span id={whoId} className={`notification-who truncate${who && actor?.badges?.length ? ' with-badges' : ''}`}>
                        <bdi>{whoText}</bdi>
                        {/* the comma leads into the text only when the text is part of the row's name */}
                        {who ? <ProfileBadges badges={actor?.badges} trail={named ? ',' : ''} /> : null}
                    </span>
                    <span id={metaId} className="notification-meta">
                        {day ? <span className="sr-only">{`${day}, `}</span> : null}
                        <time dateTime={n.created_at} title={new Date(n.created_at).toLocaleString(locale())}>
                            {ago(n.created_at)}
                        </time>
                        {n.read ? null : <span className="sr-only">{`, ${t('unread')}`}</span>}
                        {onSite ? <span className="sr-only">{`, ${t('opens on the site')}`}</span> : null}
                    </span>
                </span>
                {/* not a tab stop: the row is; screen readers in browse mode can press it. Its click
                    opens through the row's handler, once. With the first line it is the row's name;
                    it is only cut on screen. */}
                <button type="button" id={textId} className="link-button notification-text" data-open="" tabIndex={-1}>
                    <span className="notification-clamp">{what}</span>
                </button>
            </span>
        </article>
    );
}
