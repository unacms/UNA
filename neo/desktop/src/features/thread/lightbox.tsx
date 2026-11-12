import { type KeyboardEvent, useEffect, useLayoutEffect, useRef } from 'react';

import type { Schema } from 'una-api';

import { closeModal, openModal } from '../../components/dialog';
import { Icon } from '../../components/icon';
import { t } from '../../lib/i18n';
import { useMediaSrc } from '../../lib/media';
import { pictureOf, videoOf } from '../feed/media';

type Media = Schema<'Media'>;

type Props = {
    /** The post's photos, in order. */
    images: readonly Media[];
    /** The photo shown; null when the lightbox is closed. */
    index: number | null;
    onIndex: (index: number) => void;
    onClose: () => void;
    /** What the photos belong to, for the dialog's name ("Lily Carter's post"). */
    label: string;
    /** Each one's name (a photo's title), said with its place and given as its text; none for a post's photos. */
    names?: readonly (string | null | undefined)[];
};

/**
 * A post's photos full size, as a modal <dialog>: focus stays inside it, ← and → (or the
 * buttons) go through the photos, Home and End to the first and last, Esc or Close closes it,
 * and focus goes back to the photo that opened it. While it is open the app's own shortcuts
 * are off (command-bus.ts skips them under an open dialog).
 */
export function Lightbox({ images, index, onIndex, onClose, label, names }: Props) {
    const allowed = useMediaSrc();
    const dialog = useRef<HTMLDialogElement>(null);
    const returnTo = useRef<HTMLElement | null>(null);
    const open = index !== null;

    useLayoutEffect(() => {
        const d = dialog.current;
        if (!d) return;
        if (open) {
            if (d.open) return;
            returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            openModal(d);
            return;
        }
        if (d.open) closeModal(d);
        // closed by Close, Esc or the post going away: focus goes back to the photo that opened it
        const back = returnTo.current;
        returnTo.current = null;
        if (back?.isConnected) back.focus();
    }, [open]);

    // the dialog closes itself on Esc (the cancel event, then close): keep React's state in step
    useEffect(() => {
        const d = dialog.current;
        if (!d) return;
        d.addEventListener('close', onClose);
        return () => d.removeEventListener('close', onClose);
    }, [onClose]);

    const n = images.length;
    const current = index === null ? undefined : images[index];
    const go = (i: number) => onIndex((i + n) % n);

    const onKeyDown = (e: KeyboardEvent<HTMLDialogElement>) => {
        if (index === null || n < 2) return;
        const rtl = getComputedStyle(e.currentTarget).direction === 'rtl';
        switch (e.key) {
            case 'ArrowRight':
                go(index + (rtl ? -1 : 1));
                break;
            case 'ArrowLeft':
                go(index + (rtl ? 1 : -1));
                break;
            case 'Home':
                onIndex(0);
                break;
            case 'End':
                onIndex(n - 1);
                break;
            default:
                return;
        }
        e.preventDefault();
    };

    const isVideo = current?.kind === 'video';
    const video = current && isVideo ? videoOf(current, allowed) : null;
    const src = current && !isVideo ? pictureOf(current, 'large', allowed) : null;
    const place = index === null ? '' : n > 1 ? (isVideo ? t('Video {{n}} of {{total}}', { n: index + 1, total: n }) : t('Photo {{n}} of {{total}}', { n: index + 1, total: n })) : isVideo ? t('Video') : t('Photo');
    const name = index === null ? '' : (names?.[index] ?? '').trim();
    const position = name ? `${place}: ${name}` : place;

    return (
        <dialog ref={dialog} className="lightbox" aria-label={`${position}, ${label}`} onKeyDown={onKeyDown}>
            {current ? (
                <>
                    {/* Close is always drawn: a photo that can't be shown never leaves the dialog with nothing to focus */}
                    <div className="lightbox-bar">
                        <p className="lightbox-count" aria-live="polite" aria-atomic="true">
                            {position}
                        </p>
                        <button type="button" className="lightbox-btn" aria-label={t('Close')} onClick={onClose} autoFocus aria-keyshortcuts="Escape">
                            <Icon name="x" size={20} />
                        </button>
                    </div>
                    <div className="lightbox-stage">
                        {/* the site keeps no alt text for photos: a named one's is its name, else the dialog's name says which one this is */}
                        {video ? (
                            <video key={current.id} src={video.src} poster={video.poster} controls preload="metadata" aria-label={position} />
                        ) : src ? (
                            <img key={current.id} src={src} alt={names ? name || place : ''} width={current.width ?? undefined} height={current.height ?? undefined} />
                        ) : (
                            <p className="lightbox-missing">{isVideo ? t('This video can’t be played here.') : t('This photo can’t be shown here.')}</p>
                        )}
                    </div>
                    {n > 1 ? (
                        <div className="lightbox-nav">
                            <button type="button" className="lightbox-btn" aria-label={t('Previous')} onClick={() => go((index ?? 0) - 1)} aria-keyshortcuts="ArrowLeft">
                                <Icon name="chevron-left" size={20} />
                            </button>
                            <button type="button" className="lightbox-btn" aria-label={t('Next')} onClick={() => go((index ?? 0) + 1)} aria-keyshortcuts="ArrowRight">
                                <Icon name="chevron-right" size={20} />
                            </button>
                        </div>
                    ) : null}
                </>
            ) : null}
        </dialog>
    );
}
