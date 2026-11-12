import type { CSSProperties } from 'react';

import type { Schema } from 'una-api';

import { badgeColors } from '../lib/badge-colors';
import { tn } from '../lib/i18n';
import { useMediaSrc, usePicture, usePictureFailed } from '../lib/media';
import { Icon, isIconName } from './icon';
import { Tooltip } from './tooltip';
import { VisuallyHidden } from './visually-hidden';
import './profile-badges.css';

type Badge = Schema<'ProfileBadge'>;

/** How many pills a row shows; the rest are "+N". */
export const BADGES_SHOWN = 2;

/** The names a screen reader hears after the profile's name: every badge, in order. */
export function badgeNames(badges: readonly Badge[] | undefined): string[] {
    return (badges ?? []).map((b) => b.name.trim()).filter((n) => n !== '');
}

/** The icon the app draws for a badge; null for none or one it does not bundle. */
function drawnIcon(badge: Badge) {
    return badge.icon && isIconName(badge.icon) ? badge.icon : null;
}

type MediaSrc = (url: string | null | undefined) => string | null;

/**
 * The badges that draw something: a name, an icon the app has, or a picture the app may load
 * (`src`, mediaSrc with the pictures that failed for good taken out: none when not given).
 * Another would be an empty pill.
 */
export function drawnBadges(badges: readonly Badge[] | undefined, src?: MediaSrc): Badge[] {
    return (badges ?? []).filter((b) => b.name.trim() !== '' || drawnIcon(b) !== null || (!!b.image && !!src?.(b.image)));
}

function pillStyle(color: string | null): CSSProperties {
    const c = badgeColors(color);
    return {
        '--badge-bg': c.light.bg,
        '--badge-fg': c.light.fg,
        '--badge-fg-more': c.light.more,
        '--badge-bg-dark': c.dark.bg,
        '--badge-fg-dark': c.dark.fg,
        '--badge-fg-dark-more': c.dark.more,
    } as CSSProperties;
}

/**
 * One badge: its picture (16px, round, in place of the icon) or its icon, then its name. An
 * `icon_only` badge is a round chip of the picture or icon alone, its name in a tooltip; one
 * with neither to draw (no picture, or one that failed twice, and no icon the app has) is a
 * text pill like the others. While a picture waits to be tried again its place stays, an empty
 * circle, so the badge keeps its shape. Nothing when it would be empty.
 */
function Pill({ badge, src }: { badge: Badge; src: MediaSrc }) {
    const picture = usePicture(badge.image ? src(badge.image) : null);
    const icon = drawnIcon(badge);
    const name = badge.name.trim();
    const pictured = !!picture.src || picture.waiting;
    const mark = picture.waiting ? (
        <span className="badge-image badge-image-pending" />
    ) : picture.src ? (
        <img
            className="badge-image"
            src={picture.src}
            alt=""
            width={16}
            height={16}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={picture.onError}
            onLoad={picture.onLoad}
        />
    ) : icon ? (
        <Icon name={icon} size={11} strong />
    ) : null;

    if (badge.icon_only && mark) {
        const chip = (
            <span className={`badge badge-chip${pictured ? ' badge-pictured' : ''}`} style={pillStyle(badge.color)} data-badge={badge.id}>
                {mark}
            </span>
        );
        return name ? <Tooltip text={name}>{chip}</Tooltip> : chip;
    }
    if (!mark && !name) return null;
    return (
        <span
            className={`badge${name === '' ? ' badge-icon-only' : ''}${pictured ? ' badge-pictured' : ''}`}
            style={pillStyle(badge.color)}
            data-badge={badge.id}
        >
            {mark}
            {name !== '' ? <span className="badge-text">{badge.name}</span> : null}
        </span>
    );
}

/**
 * A profile's badges after its name: small pills in the badge's colour, at most `max` of them and
 * "+N" for the rest (its tooltip names them). The pills are hidden from screen readers; the
 * full list is said as text after the name (", Moderator, Founder"), so the name stays the
 * accessible name of the profile link, and a row named by this element says the badges too.
 * A badge that would draw nothing (no name, no icon the app has, no picture it may load, or
 * one that failed for good) is left out, and "+N" counts only those drawn. Nothing for a
 * profile with none. In a row the pills that do not fit drop out whole, last first, before the
 * name gives way. `trail` ends the spoken list where more of a sentence follows it (a
 * notification's "liked your post").
 */
export function ProfileBadges({ badges, max = BADGES_SHOWN, lead = ', ', trail = '' }: { badges: readonly Badge[] | undefined; max?: number; lead?: string; trail?: string }) {
    const mediaSrc = useMediaSrc();
    const pictureFailed = usePictureFailed();
    // a picture that failed for good is no picture: its badge falls back, or takes no place under the cap
    const src: MediaSrc = (url) => {
        const s = mediaSrc(url);
        return s && !pictureFailed(s) ? s : null;
    };
    const drawn = drawnBadges(badges, src);
    if (!drawn.length) return null;
    const shown = drawn.slice(0, max);
    const rest = drawn.slice(max);
    const names = badgeNames(drawn);
    return (
        <span className="badges">
            <span className="badges-pills" aria-hidden="true">
                {shown.map((b) => (
                    <Pill key={b.id} badge={b} src={src} />
                ))}
                {rest.length ? (
                    // a neutral pill like a badge with no colour: opaque, so a row's selection behind it keeps the contrast
                    <Tooltip text={badgeNames(rest).join(', ') || tn(rest.length, '{{count}} more', '{{count}} more')}>
                        <span className="badge badge-more" style={pillStyle(null)}>
                            +{rest.length}
                        </span>
                    </Tooltip>
                ) : null}
            </span>
            {names.length ? <VisuallyHidden>{`${lead}${names.join(', ')}${trail}`}</VisuallyHidden> : null}
        </span>
    );
}
