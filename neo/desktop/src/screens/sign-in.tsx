import { type ReactNode, useEffect, useRef, useState } from 'react';

import type { Schema } from 'una-api';

import { Icon } from '../components/icon';
import { SiteMark } from '../components/site-mark';
import { readKept, siteInfoOf } from '../lib/branding';
import { errorMessage } from '../lib/errors';
import { t } from '../lib/i18n';
import { cancelSignIn, discoverSite, inApp, type SessionSummary, SIGNED_OUT_TEXT, signIn, type Session } from '../lib/native';
import { readStored, writeStored } from '../lib/storage';
import { APP_ICON } from '../lib/brand';

const LAST_SITE = 'una.lastSite';

function readLastSite(): string {
    return readStored(LAST_SITE) ?? import.meta.env.VITE_UNA_URL ?? '';
}

function normalize(input: string): string {
    const s = input.trim().replace(/\/+$/, '');
    return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}

type Props = {
    onSignedIn: (s: Session) => void;
    /** Adding a network while signed in to another: back to it. */
    onCancel?: () => void;
    /** Networks still signed in to (after signing out of one whose token ran out): switch to one. */
    others?: SessionSummary[];
    onSwitch?: (key: string) => void;
    /** Shown above the form (the keychain could not be read, with Try again). */
    notice?: ReactNode;
    /** The open network, which its site signed out: sign in to it again (its address filled in). */
    again?: Session;
    /** Sign out of `again` here too: the network leaves the list. */
    onSignOutOf?: () => void;
    signingOut?: boolean;
};

/** What the sign-in screen of a network its site signed out says (spec: a network never disappears by itself). */
export function signInAgainText(s: Pick<Session, 'siteUrl' | 'siteName' | 'accountName'>): { title: string; text: string } {
    const name = s.siteName?.trim() || hostOf(s.siteUrl);
    const who = s.accountName?.trim();
    return {
        title: t('Sign in to {{name}} again', { name }),
        text: who
            ? t('{{name}} signed you out as {{who}}. Sign in again to keep using it here. It stays in your list of networks until you sign out of it.', { name, who })
            : t('{{name}} signed you out. Sign in again to keep using it here. It stays in your list of networks until you sign out of it.', { name }),
    };
}

function hostOf(siteUrl: string): string {
    try {
        return new URL(siteUrl).host;
    } catch {
        return siteUrl;
    }
}

export function SignIn({ onSignedIn, onCancel, others = [], onSwitch, notice, again, onSignOutOf, signingOut }: Props) {
    const [site, setSite] = useState(() => (again ? again.siteUrl : onCancel ? '' : readLastSite()));
    const [info, setInfo] = useState<Schema<'ApiInfo'> | null>(null);
    const [busy, setBusy] = useState(false);
    const [waiting, setWaiting] = useState(false);
    const [status, setStatus] = useState('');
    const [error, setError] = useState<string | null>(null);
    // the button under the pointer and the keyboard focus swap between Sign in and Cancel: keep focus on the one shown
    const signInButton = useRef<HTMLButtonElement>(null);
    const cancelButton = useRef<HTMLButtonElement>(null);
    const anotherButton = useRef<HTMLButtonElement>(null);
    const started = useRef(false);
    useEffect(() => {
        if (waiting) {
            started.current = true;
            cancelButton.current?.focus();
        } else if (started.current) signInButton.current?.focus();
    }, [waiting]);
    // the site found: Continue (which had focus) is gone, so focus goes to the next step's
    // action, not to the page (WCAG 2.4.3); outside the app that is disabled, so Use another
    useEffect(() => {
        if (!info) return;
        (signInButton.current && !signInButton.current.disabled ? signInButton.current : anotherButton.current)?.focus();
    }, [info]);

    const findSite = async () => {
        setBusy(true);
        setError(null);
        try {
            const url = normalize(site);
            const found = await discoverSite(url);
            setSite(url);
            setInfo(found);
            setStatus(t('Found {{name}}.', { name: siteInfoOf(url, undefined, found).name }));
            writeStored(LAST_SITE, url);
        } catch (e) {
            // the app's own messages (Rust) already say what went wrong; a browser TypeError doesn't
            setError(e instanceof TypeError ? t('Could not reach that address: {{reason}}', { reason: e.message }) : errorMessage(e));
        } finally {
            setBusy(false);
        }
    };

    const errorLine = error ? (
        <p className="error small sign-in-error" role="alert" id="sign-in-error">
            {error}
        </p>
    ) : null;

    const startSignIn = async () => {
        if (!info) return;
        setWaiting(true);
        setError(null);
        setStatus(t('Your browser is open. Sign in there and allow the app, then come back here.'));
        try {
            onSignedIn(await signIn(site, info));
        } catch (e) {
            const message = errorMessage(e);
            // Rust's reason (auth.rs `cancelled`): the same text from the same language file
            if (message === t('Sign-in was cancelled')) setStatus(t('Sign-in cancelled.'));
            else {
                setStatus('');
                setError(message);
            }
        } finally {
            setWaiting(false);
        }
    };

    const cancel = () => {
        void cancelSignIn().catch((e: unknown) => setError(errorMessage(e)));
    };

    return (
        <div className="center-page">
            <div className="sign-in">
                {notice}
                <img className="sign-in-icon" src={APP_ICON} alt="" width={64} height={64} />
                <h1>{onCancel ? t('Add a network') : again ? signInAgainText(again).title : t('Sign in to your network')}</h1>
                {onCancel ? (
                    <p className="muted small">{t('You stay signed in to the networks you have; switch between them with the network menu at the top of the sidebar.')}</p>
                ) : again ? (
                    <p className="muted small">{signInAgainText(again).text}</p>
                ) : null}
                {!info ? (
                    <form
                        className="sign-in-form"
                        onSubmit={(e) => {
                            e.preventDefault();
                            void findSite();
                        }}
                    >
                        <p id="sign-in-hint" className="muted small">
                            {t('Enter the address of a UNA network you have an account on.')}
                        </p>
                        <label htmlFor="site">{t('Network address')}</label>
                        <input
                            id="site"
                            // text, not url: a url field with required refuses "community.example"
                            // before normalize() adds the scheme
                            type="text"
                            inputMode="url"
                            autoComplete="url"
                            autoCapitalize="off"
                            spellCheck={false}
                            // an example address, not words: i18n-ok
                            placeholder="community.example"
                            aria-invalid={error ? true : undefined}
                            aria-describedby={error ? 'sign-in-hint sign-in-error' : 'sign-in-hint'}
                            value={site}
                            onChange={(e) => {
                                setSite(e.target.value);
                                // the address is being corrected: no longer the one that failed
                                if (error) setError(null);
                            }}
                            autoFocus
                            required
                        />
                        {errorLine}
                        <button className="btn btn-primary btn-lg" type="submit" disabled={busy || !site.trim()} aria-busy={busy}>
                            {t('Continue')}
                        </button>
                    </form>
                ) : (
                    <div className="sign-in-site">
                        <SitePreview siteUrl={site} info={info} />
                        <p className="muted small">{t('Your browser opens the site’s sign-in page. Sign in there, choose the profile to use and allow the app, then come back here.')}</p>
                        {waiting ? (
                            <button ref={cancelButton} className="btn btn-lg" onClick={cancel}>
                                {t('Cancel sign-in')}
                            </button>
                        ) : (
                            <button ref={signInButton} className="btn btn-primary btn-lg" onClick={() => void startSignIn()} disabled={!inApp}>
                                {t('Sign in with the browser')}
                            </button>
                        )}
                        {errorLine}
                        <button
                            ref={anotherButton}
                            className="btn btn-quiet"
                            onClick={() => {
                                setInfo(null);
                                setStatus('');
                                setError(null);
                            }}
                            disabled={waiting}
                        >
                            {t('Use another network')}
                        </button>
                        {!inApp ? <p className="muted small">{t('Sign-in works in the desktop app, not in a plain browser tab.')}</p> : null}
                    </div>
                )}
                <p className="muted small sign-in-status" role="status" aria-live="polite">
                    {status}
                </p>
                {onCancel ? (
                    <button className="btn btn-quiet" onClick={onCancel} disabled={waiting}>
                        {t('Back')}
                    </button>
                ) : null}
                {again && onSignOutOf ? (
                    <button className="btn btn-quiet" onClick={onSignOutOf} disabled={waiting} aria-disabled={signingOut || undefined} aria-busy={signingOut || undefined}>
                        {t('Sign out of {{name}}', { name: again.siteName?.trim() || hostOf(again.siteUrl) })}
                    </button>
                ) : null}
                {!onCancel && others.length && onSwitch ? (
                    <section aria-labelledby="other-networks" className="sign-in-others">
                        <h2 id="other-networks" className="small">
                            {t('Or open a network you are signed in to')}
                        </h2>
                        <ul>
                            {others.map((s) => (
                                <li key={s.key}>
                                    <OtherNetwork session={s} onOpen={() => onSwitch(s.key)} disabled={waiting} />
                                </li>
                            ))}
                        </ul>
                    </section>
                ) : null}
            </div>
        </div>
    );
}

/** A network still signed in to: a 44px row with its mark, its name and the host and account (spec 7.3). */
function OtherNetwork({ session, onOpen, disabled }: { session: SessionSummary; onOpen: () => void; disabled: boolean }) {
    const site = siteInfoOf(session.siteUrl, session.siteName, readKept(session.siteUrl), session.accountName);
    return (
        <button className="sign-in-other" onClick={onOpen} disabled={disabled}>
            <SiteMark site={site} siteUrl={session.siteUrl} size={24} />
            <span className="sign-in-other-text">
                <span className="sign-in-other-name">{site.name}</span>
                <span className="sign-in-other-host">{site.account ? `${site.host} – ${site.account}` : site.host}</span>
                {session.needsSignIn ? <span className="sign-in-other-host">{SIGNED_OUT_TEXT}</span> : null}
            </span>
        </button>
    );
}

/** The network found at the address: its mark, name and host (spec 7.3), before the browser opens. */
function SitePreview({ siteUrl, info }: { siteUrl: string; info: Schema<'ApiInfo'> }) {
    const site = siteInfoOf(siteUrl, undefined, info);
    return (
        <div className="sign-in-preview">
            <SiteMark site={site} siteUrl={siteUrl} size={40} />
            <p className="sign-in-preview-text">
                <strong className="sign-in-preview-name">{site.name}</strong>
                <span className="sign-in-preview-host">{site.host}</span>
            </p>
            <span className="sign-in-preview-check">
                <Icon name="check" size={16} />
            </span>
        </div>
    );
}
