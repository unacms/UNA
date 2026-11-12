import { useEffect, useState } from 'react';

import { t } from '../lib/i18n';
import { Icon } from './icon';

/** How long a load runs before its skeleton shows: a fast answer flashes nothing (spec 4.6). */
export const SKELETON_DELAY_MS = 300;

/** True once `active` has held for `ms`; false again as soon as it stops. */
export function useDelayed(active: boolean, ms = SKELETON_DELAY_MS): boolean {
    const [shown, setShown] = useState(false);
    useEffect(() => {
        if (!active) return;
        const timer = window.setTimeout(() => setShown(true), ms);
        return () => {
            window.clearTimeout(timer);
            setShown(false);
        };
    }, [active, ms]);
    return active && shown;
}

type Shape = 'post' | 'row' | 'notification' | 'conversation';

/** The bars' widths per shape: a conversation row has two lines (names, then the newest message). */
const BARS: Record<Shape, readonly string[]> = {
    post: ['40%', '90%', '60%'],
    row: ['40%', '90%', '60%'],
    notification: ['40%', '90%', '60%'],
    conversation: ['40%', '75%'],
};

/**
 * Three rows in the list's own geometry (a 40px circle and bars, BARS), after
 * 300ms of loading. Decorative: the pane's aria-busy says it is loading.
 */
export function SkeletonRows({ loading, shape = 'row', count = 3 }: { loading: boolean; shape?: Shape; count?: number }) {
    const shown = useDelayed(loading);
    if (!shown) return null;
    return (
        <div className={`skeletons skeletons-${shape}`} aria-hidden="true" data-skeleton="">
            {Array.from({ length: count }, (_, i) => (
                <div key={i} className="skeleton-row">
                    <span className="skeleton-circle" />
                    <span className="skeleton-bars">
                        {BARS[shape].map((w, j) => (
                            <span key={j} className="skeleton-bar" style={{ width: w }} />
                        ))}
                    </span>
                </div>
            ))}
        </div>
    );
}

/** A load that failed, in the pane (spec 4.6): the reason and Try again, said as an alert. */
export function InlineError({ message, onRetry, busy }: { message: string; onRetry?: () => void; busy?: boolean }) {
    return (
        <div className="inline-error" role="alert">
            <p className="inline-error-text">
                <Icon name="circle-alert" size={20} />
                <span>{message}</span>
            </p>
            {onRetry ? (
                <button type="button" className="btn" onClick={() => {
                        if (!busy) onRetry();
                    }}
                    aria-disabled={busy || undefined} data-busy={busy || undefined}>
                    <span>{t('Try again')}</span>
                </button>
            ) : null}
        </div>
    );
}
