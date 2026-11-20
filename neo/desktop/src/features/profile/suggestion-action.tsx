import { useRef, useState } from 'react';

import type { Schema } from 'una-api';

import { useWindowAnnounce } from '../../lib/announce';
import { errorMessage } from '../../lib/errors';
import { t } from '../../lib/i18n';
import { announcement } from './graph';
import { useGraphAction } from './relation-buttons';

/** What a suggestion offers: asking to be friends, or following. */
export type SuggestionVerb = 'befriend' | 'follow';

const DONE_LABELS: Record<SuggestionVerb, string> = { befriend: t('Requested'), follow: t('Following', { context: 'state' }) };

type Props = {
    profile: Schema<'Profile'>;
    action: SuggestionVerb;
    /** The class of the line that says why the site refused, drawn after the button. */
    errorClassName?: string;
    /** Why the site refused, or null on a new try, for a caller that shows it in a place of its own (and none after the button). */
    onError?: (message: string | null) => void;
};

/**
 * Add friend or Follow for a suggested profile (Connections' Suggestions, a page's suggestions
 * block). Once the site took it the button says so (Requested, Following) and stays where it
 * was, so focus stays on it; the suggestion goes from the list the next time the list is read
 * (afterGraphChange marks every list of suggestions stale), not now, which would take the row
 * from under the pointer. Why the site refused shows after it, or where `onError` puts it.
 */
export function SuggestionAction({ profile, action, errorClassName = 'error small', onError }: Readonly<Props>) {
    const run = useGraphAction(profile);
    const announce = useWindowAnnounce();
    const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
    const [ownError, setOwnError] = useState<string | null>(null);
    const setError = (message: string | null) => (onError ? onError(message) : setOwnError(message));
    const busy = useRef(false);
    const press = async () => {
        if (busy.current || state === 'done') return;
        busy.current = true;
        setState('busy');
        setError(null);
        try {
            const status = await run(action);
            setState('done');
            announce(announcement(action, profile.display_name, status));
        } catch (e) {
            setState('idle');
            setError(errorMessage(e));
        } finally {
            busy.current = false;
        }
    };
    const label = state === 'done' ? DONE_LABELS[action] : action === 'befriend' ? t('Add friend') : t('Follow');
    return (
        <>
            <button
                type="button"
                className={`btn small${state === 'done' ? '' : ' btn-primary'}`}
                aria-label={`${label}, ${profile.display_name}`}
                aria-disabled={state !== 'idle' || undefined}
                data-busy={state === 'busy' ? '' : undefined}
                onClick={() => void press()}
            >
                <span>{label}</span>
            </button>
            {ownError ? (
                <p className={errorClassName} role="alert">
                    {ownError}
                </p>
            ) : null}
        </>
    );
}
