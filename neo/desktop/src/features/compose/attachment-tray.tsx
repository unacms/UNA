import { useLayoutEffect, useRef } from 'react';

import { t, tn } from '../../lib/i18n';
import { useMediaSrc } from '../../lib/media';
import { pictureOf } from '../feed/media';

import { type Attachment, sizeText } from './attachments';

const removeId = (key: string) => `attachment-${key}-remove`;

/** What a tray's item is called: a photo, a video, or (new files) a file. */
const kindWord = (kind: Attachment['kind']) => (kind === 'video' ? t('Video') : kind === 'file' ? t('File') : t('Photo'));

/** What an item's buttons are called: "Retry Photo cat.jpg", "Remove Video clip.mp4". */
const retryLabel = (kind: Attachment['kind'], name: string) => (kind === 'video' ? t('Retry Video {{name}}', { name }) : kind === 'file' ? t('Retry File {{name}}', { name }) : t('Retry Photo {{name}}', { name }));
const removeLabel = (kind: Attachment['kind'], name: string) => (kind === 'video' ? t('Remove Video {{name}}', { name }) : kind === 'file' ? t('Remove File {{name}}', { name }) : t('Remove Photo {{name}}', { name }));

function statusText(a: Attachment): string {
    if (a.status === 'uploading') return a.total ? t('Uploading, {{percent}}%', { percent: Math.floor((100 * a.sent) / a.total) }) : t('Uploading');
    if (a.status === 'failed') return a.error === undefined ? t('Not uploaded: something went wrong') : t('Not uploaded: {{reason}}', { reason: a.error });
    return a.media?.state === 'processing' ? t('Uploaded; the site is converting it') : t('Ready');
}

/**
 * The photos and videos of the post being written: a picture of each (the local one, then the
 * site's), its upload's progress, Retry for one that failed and Remove. The site keeps no alt
 * text, so there is no field for one; the name says which file it is.
 * Removing one moves focus to the next one's Remove, or to `fallbackFocusId` after the last.
 * While `held` (the form is being sent) Retry and Remove do nothing, and keep the keyboard.
 */
export function AttachmentTray({
    items,
    onRemove,
    onRetry,
    fallbackFocusId,
    held = false,
}: {
    items: readonly Attachment[];
    onRemove: (key: string) => void;
    onRetry: (key: string) => void;
    fallbackFocusId: string;
    held?: boolean;
}) {
    const allowed = useMediaSrc();
    const focusAfter = useRef<string | null>(null);
    useLayoutEffect(() => {
        const id = focusAfter.current;
        if (!id) return;
        focusAfter.current = null;
        document.getElementById(id)?.focus();
    });

    if (!items.length) return null;
    return (
        <ul className="attachments" aria-label={tn(items.length, '{{count}} attachment', '{{count}} attachments')}>
            {items.map((a, i) => {
                // a file that is no photo or video has no picture (its address is the file itself)
                const picture = allowed(a.preview) ?? (a.media && a.kind !== 'file' ? pictureOf(a.media, 'thumb', allowed) : null);
                return (
                    <li key={a.key} className={`attachment attachment-${a.status}`}>
                        <div className="attachment-thumb" aria-hidden="true">
                            {picture ? <img src={picture} alt="" decoding="async" /> : <span className="attachment-kind">{kindWord(a.kind)}</span>}
                        </div>
                        <div className="attachment-info">
                            <span className="attachment-name" title={a.name}>
                                <span className="sr-only">{`${kindWord(a.kind)} `}</span>
                                {a.name}
                            </span>
                            <span className={`small ${a.status === 'failed' ? 'error' : 'muted'}`}>
                                {statusText(a)}
                                {a.size ? ` · ${sizeText(a.size)}` : ''}
                            </span>
                            {a.status === 'uploading' ? <progress className="attachment-progress" max={a.total || 1} value={a.sent} aria-label={t('Uploading {{name}}', { name: a.name })} /> : null}
                        </div>
                        <div className="attachment-buttons">
                            {a.status === 'failed' && a.picked ? (
                                <button type="button" className="btn btn-quiet small" aria-disabled={held || undefined} onClick={() => (held ? undefined : onRetry(a.key))} aria-label={retryLabel(a.kind, a.name)}>
                                    {t('Retry')}
                                </button>
                            ) : null}
                            <button
                                type="button"
                                id={removeId(a.key)}
                                className="btn btn-quiet small"
                                aria-label={removeLabel(a.kind, a.name)}
                                aria-disabled={held || undefined}
                                onClick={() => {
                                    if (held) return;
                                    const next = items[i + 1] ?? items[i - 1];
                                    focusAfter.current = next ? removeId(next.key) : fallbackFocusId;
                                    onRemove(a.key);
                                }}
                            >
                                {t('Remove')}
                            </button>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
