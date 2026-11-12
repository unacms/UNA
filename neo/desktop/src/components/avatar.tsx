import type { CSSProperties } from 'react';

import type { Schema } from 'una-api';

import { useMediaSrc, usePicture } from '../lib/media';

type Pictured = Pick<Schema<'Profile'>, 'id' | 'kind' | 'display_name'> & { avatar?: string | null; avatar_large?: string | null };

/** FNV-1a (32 bit) of a string: the same profile gets the same colour everywhere. */
export function fnv1a(text: string): number {
    let hash = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash >>> 0;
}

/** Which of the eight monogram hues a profile has (tokens.css `[data-hue]`). */
export function hueOf(id: string): number {
    return fnv1a(id) % 8;
}

function firstGrapheme(word: string): string {
    if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
        const first = new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(word)[Symbol.iterator]().next();
        return first.done ? '' : first.value.segment;
    }
    return Array.from(word)[0] ?? '';
}

/** The first letter of the first two words; one letter on avatars under 24px. */
export function initials(name: string, size: number): string {
    const words = name.trim().split(/\s+/).filter(Boolean);
    const letters = words.slice(0, size < 24 ? 1 : 2).map((w) => firstGrapheme(w).toLocaleUpperCase());
    return letters.join('') || '?';
}

type Props = {
    profile: Pictured | null | undefined;
    size?: number;
    /** Groups and spaces are rounded squares, people circles. */
    shape?: 'circle' | 'square';
};

/**
 * A profile's picture, or its monogram when it has none, when mediaSrc refuses it (a host the
 * page may not load from) or when it fails to load (lib/media.ts usePicture: tried once more,
 * then remembered for the session). Until the picture's bytes arrive, its circle is filled with
 * the monogram's colour, never empty.
 */
export function Avatar({ profile, size = 40, shape }: Props) {
    const src = useMediaSrc();
    const form = shape ?? (profile?.kind === 'group' ? 'square' : 'circle');
    const wanted = profile ? (size > 48 && profile.avatar_large ? profile.avatar_large : profile.avatar) : null;
    const picture = usePicture(profile ? src(wanted) : null);
    const hue = profile ? hueOf(profile.id) : 0;
    const style = { '--size': `${size}px` } as CSSProperties;

    if (picture.src) {
        return (
            <img
                className="avatar"
                data-shape={form}
                data-hue={hue}
                src={picture.src}
                alt=""
                width={size}
                height={size}
                style={style}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={picture.onError}
                onLoad={picture.onLoad}
            />
        );
    }
    return (
        <span
            className="avatar avatar-mono"
            data-shape={form}
            data-hue={hue}
            aria-hidden="true"
            style={{ ...style, fontSize: Math.round(size * 0.4) }}
        >
            {initials(profile?.display_name ?? '', size)}
        </span>
    );
}

/**
 * A profile's or group's cover, full bleed, or a generated band in the colour of its monogram
 * (when it has none, mediaSrc refuses it or it fails). Decorative: no text sits on it.
 */
export function Cover({ profile, url }: { profile: Pick<Schema<'Profile'>, 'id'> | null | undefined; url: string | null | undefined }) {
    const src = useMediaSrc();
    const picture = usePicture(src(url));
    if (picture.src) {
        return (
            <img
                className="cover"
                data-hue={profile ? hueOf(profile.id) : 0}
                src={picture.src}
                alt=""
                decoding="async"
                referrerPolicy="no-referrer"
                onError={picture.onError}
                onLoad={picture.onLoad}
            />
        );
    }
    return <div className="cover cover-fallback" data-hue={profile ? hueOf(profile.id) : 0} aria-hidden="true" />;
}
