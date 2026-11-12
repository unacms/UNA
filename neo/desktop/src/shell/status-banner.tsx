import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { Icon } from '../components/icon';
import { type ApiAvailability, appAvailability, type OffCode, useApiOff } from '../lib/api-availability';
import { errorMessage } from '../lib/errors';
import { t } from '../lib/i18n';
import { useOnline } from '../lib/use-online';

type Props = {
    /** The network shown: only its state is said here, another network's is its own. */
    siteUrl: string;
    /** Says something in the window's live region. */
    announce: (text: string) => void;
    /**
     * Try again left the page while the keyboard was on it (the API answers again, the computer
     * went offline): where the keyboard goes instead of nowhere.
     */
    onRetryGone?: () => void;
    availability?: ApiAvailability;
};

type RetryProps = { checking: boolean; onClick: () => void; onGone?: () => void };

/** Try again. It says so when it is taken off the page while it has the keyboard's focus. */
function RetryButton({ checking, onClick, onGone }: RetryProps) {
    const button = useRef<HTMLButtonElement>(null);
    const gone = useRef(onGone);
    useEffect(() => {
        gone.current = onGone;
    });
    // a layout effect's cleanup runs while the button is still in the page, so its focus can be read
    useLayoutEffect(() => {
        const el = button.current;
        return () => {
            if (el && document.activeElement === el) gone.current?.();
        };
    }, []);
    return (
        <button ref={button} type="button" className="btn small" onClick={onClick} aria-disabled={checking || undefined} data-busy={checking || undefined}>
            <span>{t('Try again')}</span>
        </button>
    );
}

function offText(code: OffCode): string {
    return code === 'api_disabled' ? t('The API is turned off on this network') : t('API v2 is turned off on this network');
}

/**
 * Said, and shown, above the panes while what is on screen is what was saved: the computer has
 * no network, or the network's site has its API turned off (lib/api-availability.ts). Neither
 * is in the way of anything, and neither signs anyone out. A site with its API off can be asked
 * again from here (Try again); Rust keeps asking too, and once the API answers the banner goes
 * by itself and says so. What failed meanwhile is loaded again by the window's session
 * (useReloadWhenApiBack), which is there on screens without this banner too.
 */
export function StatusBanner({ siteUrl, announce, onRetryGone, availability = appAvailability }: Props) {
    const online = useOnline();
    const off = useApiOff(siteUrl, availability);
    const [checking, setChecking] = useState(false);
    const latest = useRef(announce);
    useEffect(() => {
        latest.current = announce;
    });

    // back: said (per network: another site's state is not this one's)
    const was = useRef<{ site: string; off: boolean }>({ site: siteUrl, off: off !== null });
    useEffect(() => {
        const before = was.current;
        was.current = { site: siteUrl, off: off !== null };
        if (before.site !== siteUrl || !before.off || off !== null) return;
        latest.current(t('The network’s API answers again'));
    }, [off, siteUrl]);

    const retry = () => {
        if (checking) return;
        setChecking(true);
        availability.check(siteUrl).then(
            (code) => {
                setChecking(false);
                // still off: said again, since the banner's words did not change
                if (code) latest.current(offText(code));
            },
            (e: unknown) => {
                setChecking(false);
                latest.current(errorMessage(e));
            },
        );
    };

    // offline first: nothing can be asked of the site without a network
    const text = !online ? t('You’re offline. Showing what was saved; new posts and changes wait for the network.') : off ? offText(off) : null;
    const canRetry = online && off !== null;
    return (
        <div className="offline-status">
            <div className={text ? 'offline-banner' : undefined}>
                {/* the words are the live region; the button is beside it, not read out with it */}
                <div className="offline-text" role="status">
                    {text ? (
                        <>
                            <Icon name={online ? 'power-off' : 'cloud-off'} size={16} />
                            <span>{text}</span>
                        </>
                    ) : null}
                </div>
                {canRetry ? <RetryButton checking={checking} onClick={retry} onGone={onRetryGone} /> : null}
            </div>
        </div>
    );
}
