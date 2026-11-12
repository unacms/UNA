import { useEffect, useRef } from 'react';

import { fileSizeText } from '../features/files/files';
import { APP_NAME } from '../lib/brand';
import { locale, t, tn } from '../lib/i18n';
import { isWindows } from '../lib/platform';
import { appUpdates, type UpdateInfo, type UpdatesStore, useUpdates } from '../lib/updates';
import { Dialog } from './dialog';

const TITLE_ID = 'update-title';

/** The release date as the person's language writes a date, or nothing when there is none. */
export function releaseDate(date: string | null | undefined): string | null {
    if (!date) return null;
    const d = new Date(date);
    return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString(locale(), { year: 'numeric', month: 'long', day: 'numeric' });
}

/** How far a download has come: "4.2 MB of 12.0 MB", or "4.2 MB" while the size is not known. */
export function progressText(downloaded: number, total: number | null): string {
    const done = fileSizeText(downloaded) ?? tn(0, '{{count}} byte', '{{count}} bytes');
    const all = total ? fileSizeText(total) : null;
    return all ? t('{{done}} of {{total}}', { done, total: all }) : done;
}

function Notes({ update }: { update: UpdateInfo }) {
    const date = releaseDate(update.date);
    return (
        <>
            <p>{t('{{app}} {{version}} is out. You have {{current}}.', { app: APP_NAME, version: update.version, current: update.currentVersion })}</p>
            {date ? <p className="muted small">{t('Released {{date}}', { date })}</p> : null}
            {update.notes ? (
                <div className="update-notes-box">
                    <h3 id="update-notes-title" className="update-notes-title">
                        {t('What’s new')}
                    </h3>
                    {/* plain text, as the release says it; focusable so the keyboard can scroll it */}
                    <div className="update-notes" tabIndex={0} role="region" aria-labelledby="update-notes-title">
                        {update.notes}
                    </div>
                </div>
            ) : null}
        </>
    );
}

/**
 * The update dialog: checking, up to date, a new version with what is new in it, the download
 * and the install. Nothing is installed until the person chooses Install and Restart. While it
 * installs the dialog cannot be closed (the app is about to start again).
 */
export function UpdateDialog({ store = appUpdates }: { store?: UpdatesStore }) {
    const state = useUpdates(store);
    const heading = useRef<HTMLHeadingElement>(null);
    const close = () => store.closeDialog();
    // a step that takes away the focused button (Install and Restart, Try again) leaves focus
    // on the heading, inside the dialog, rather than on the page under it
    useEffect(() => {
        if (!state.dialogOpen) return;
        const inside = heading.current?.closest('dialog')?.contains(document.activeElement);
        if (!inside) heading.current?.focus();
    }, [state.phase, state.dialogOpen]);
    const busy = state.phase === 'downloading' || state.phase === 'installing';
    const restartNote = isWindows ? t('The installer closes {{app}} and opens it again.', { app: APP_NAME }) : t('{{app}} starts again once it is installed.', { app: APP_NAME });

    let title = t('Software update');
    // what the live region says: short, once per step (the notes are read where they are)
    let said = '';
    let body = null;
    let actions = null;
    switch (state.phase) {
        case 'idle':
        case 'checking':
            said = t('Checking for updates…');
            body = (
                <p className="update-line">
                    <span className="spinner" aria-hidden="true" />
                    {t('Checking for updates…')}
                </p>
            );
            break;
        case 'current':
            title = t('{{app}} is up to date', { app: APP_NAME });
            said = title;
            body = <p>{t('{{app}} {{version}} is the newest version.', { app: APP_NAME, version: __APP_VERSION__ })}</p>;
            actions = (
                <button className="btn btn-primary" onClick={close}>
                    {t('OK')}
                </button>
            );
            break;
        case 'available':
            title = t('A new version of {{app}} is available', { app: APP_NAME });
            said = title;
            body = (
                <>
                    <Notes update={state.update} />
                    <p className="muted small">{restartNote}</p>
                </>
            );
            actions = (
                <>
                    <button className="btn" onClick={close}>
                        {t('Later')}
                    </button>
                    <button className="btn btn-primary" onClick={() => void store.install()}>
                        {t('Install and Restart')}
                    </button>
                </>
            );
            break;
        case 'downloading': {
            title = t('Updating {{app}}', { app: APP_NAME });
            const { downloaded, total } = state;
            said = t('Downloading {{app}} {{version}}…', { app: APP_NAME, version: state.update.version });
            body = (
                <>
                    <label htmlFor="update-progress">{t('Downloading {{app}} {{version}}…', { app: APP_NAME, version: state.update.version })}</label>
                    <progress id="update-progress" className="update-progress" max={total ?? undefined} value={total ? Math.min(downloaded, total) : undefined} aria-valuetext={progressText(downloaded, total)} />
                    <p className="muted small" aria-hidden="true">
                        {progressText(downloaded, total)}
                    </p>
                </>
            );
            break;
        }
        case 'installing':
            title = t('Updating {{app}}', { app: APP_NAME });
            said = t('Installing {{app}} {{version}}…', { app: APP_NAME, version: state.update.version });
            body = (
                <>
                    <p className="update-line">
                        <span className="spinner" aria-hidden="true" />
                        {t('Installing {{app}} {{version}}…', { app: APP_NAME, version: state.update.version })}
                    </p>
                    <p className="muted small">{restartNote}</p>
                </>
            );
            break;
        case 'failed':
            title = state.update ? t('The update was not installed') : t('Could not check for updates');
            body = (
                <p role="alert" className="update-error">
                    {state.reason}
                </p>
            );
            actions = (
                <>
                    <button className="btn" onClick={close}>
                        {t('Close')}
                    </button>
                    <button className="btn btn-primary" onClick={() => void (state.update ? store.install() : store.check({ manual: true }))}>
                        {t('Try again')}
                    </button>
                </>
            );
            break;
    }

    return (
        <Dialog open={state.dialogOpen} onClose={close} className="dialog update-dialog" labelledBy={TITLE_ID}>
            <div className="dialog-head">
                <h2 id={TITLE_ID} ref={heading} tabIndex={-1}>
                    {title}
                </h2>
                {busy ? null : (
                    <button className="btn btn-quiet icon-btn" aria-label={t('Close')} onClick={close}>
                        <span aria-hidden="true">×</span>
                    </button>
                )}
            </div>
            <div className="dialog-body">
                {/* each step said once; the progress bar is read when the reader reaches it, not at each chunk */}
                <p className="sr-only" role="status" aria-live="polite">
                    {said}
                </p>
                {body}
                {actions ? <div className="dialog-actions">{actions}</div> : null}
            </div>
        </Dialog>
    );
}
