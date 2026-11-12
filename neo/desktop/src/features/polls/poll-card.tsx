import { useQueryClient } from '@tanstack/react-query';
import { useId, useLayoutEffect, useRef, useState } from 'react';

import { Icon } from '../../components/icon';
import { useWindowAnnounce } from '../../lib/announce';
import { ApiError } from '../../lib/api';
import { useApp } from '../../lib/context';
import { errorMessage } from '../../lib/errors';
import { t } from '../../lib/i18n';
import { idempotencyKeyFor, type IdempotencySlot } from '../../lib/idempotency';
import { fetchPoll, percents, type Poll, putPoll, votePoll, votersText, votesText, withVote } from './polls';

type Props = {
    poll: Poll;
    /** The question as the card's heading (a feed row's level, or the thread's). */
    headingLevel?: 2 | 3;
    /**
     * The id of a heading that already says the question (the pane's title): the card draws no
     * heading of its own, and its answers and results are named by that one.
     */
    labelledBy?: string;
};

/**
 * A poll where it is shown (a feed's post, the thread, its own pane): its answers as a radio
 * group with Vote while the viewer may vote, then the results, a bar per answer with its share
 * and count, the viewer's answer marked (an icon and words, not colour alone). A vote shows at
 * once everywhere the poll is (putPoll), is said in the window's live region, and is put back
 * with the site's reason when it refuses. Results the poll hides until one votes are not drawn;
 * how many voted always is.
 */
export function PollCard({ poll, headingLevel = 2, labelledBy }: Props) {
    const { api } = useApp();
    const queryClient = useQueryClient();
    const announce = useWindowAnnounce();
    const id = useId();
    const [choice, setChoice] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const questionId = labelledBy ?? `${id}-question`;
    // a retry of a vote whose answer never came goes with the same key (the site's first answer)
    const sent = useRef<IdempotencySlot['current']>(null);
    const H = headingLevel === 3 ? 'h3' : 'h2';
    const voting = !!poll.viewer?.can_vote && !poll.viewer.voted;
    // Vote goes away with the form it is in: focus goes to the results it brought (or back to
    // the form when the site refused), never to the page
    const root = useRef<HTMLDivElement>(null);
    const refocus = useRef(false);
    useLayoutEffect(() => {
        if (!refocus.current) return;
        const el = root.current?.querySelector<HTMLElement>(voting ? 'input[type="radio"]:checked, input[type="radio"]' : '.poll-results');
        if (!el) return;
        refocus.current = false;
        el.focus({ preventScroll: true });
    });

    const vote = async () => {
        if (!choice || busy) return;
        const before = poll;
        const option = poll.options.find((o) => o.id === choice);
        setBusy(true);
        setError(null);
        refocus.current = !!root.current?.contains(document.activeElement);
        putPoll(queryClient, withVote(poll, choice));
        try {
            const after = await votePoll(api, poll.id, choice, idempotencyKeyFor(sent, { poll: poll.id, option: choice }));
            sent.current = null;
            putPoll(queryClient, after);
            announce(`${option ? t('Voted for {{answer}}.', { answer: option.title }) : t('Voted for your answer.')} ${resultsWords(after)}`);
        } catch (e) {
            refocus.current = !!root.current?.contains(document.activeElement) || document.activeElement === document.body;
            setError(await refusedWords(e, before));
        } finally {
            setBusy(false);
        }
    };

    /**
     * The poll as the site has it after a refusal, and what to say. A 409 (voted before in
     * another window or on the site, or the poll is not open) shows the poll as it is now, so
     * the form does not come back to be refused again; a 403 keeps the results; anything else
     * puts the form back to try again.
     */
    const refusedWords = async (e: unknown, before: Poll): Promise<string> => {
        const message = errorMessage(e);
        if (e instanceof ApiError && e.status === 409) {
            sent.current = null;
            try {
                const now = await fetchPoll(api, poll.id);
                putPoll(queryClient, now);
                if (now.viewer?.voted) return t('You had already voted in this poll.');
                if (!now.viewer?.can_vote) return e.code === 'not_open' ? t('This poll is not open for votes yet.') : t('You can’t vote in this poll.');
                return t('Your vote was not counted. Try again.');
            } catch {
                putPoll(queryClient, before);
                return t('Your vote was not counted: {{reason}}', { reason: message });
            }
        }
        if (e instanceof ApiError && e.status === 403) {
            sent.current = null;
            putPoll(queryClient, { ...before, viewer: before.viewer ? { ...before.viewer, can_vote: false } : before.viewer });
            return t('You can’t vote in polls with your membership.');
        }
        putPoll(queryClient, before);
        return t('Your vote was not counted: {{reason}}', { reason: message });
    };

    const shares = percents(poll.options);
    const most = Math.max(0, ...poll.options.map((o) => o.votes ?? 0));

    return (
        <div ref={root} className="poll" data-voting={voting || undefined}>
            {labelledBy ? null : (
                <H id={questionId} className="poll-question">
                    {poll.question}
                </H>
            )}
            {voting ? (
                <form
                    className="poll-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        void vote();
                    }}
                >
                    <fieldset className="poll-options" aria-labelledby={questionId} disabled={busy}>
                        {poll.options.map((o) => (
                            <label key={o.id} className="poll-option" data-checked={choice === o.id || undefined}>
                                <input type="radio" name={`${id}-answer`} value={o.id} checked={choice === o.id} onChange={() => setChoice(o.id)} />
                                <bdi>{o.title}</bdi>
                            </label>
                        ))}
                    </fieldset>
                    <div className="poll-foot">
                        <button type="submit" className="btn btn-primary small" disabled={!choice} aria-busy={busy || undefined} data-busy={busy || undefined}>
                            {t('Vote')}
                        </button>
                        <span className="muted small">{votersText(poll)}</span>
                    </div>
                </form>
            ) : (
                <>
                    <ul className="poll-results" aria-labelledby={questionId} tabIndex={-1}>
                        {poll.options.map((o, i) => {
                            const mine = poll.viewer?.voted === o.id;
                            const share = shares[i] ?? 0;
                            const shown = poll.results_visible && o.votes !== null;
                            return (
                                <li key={o.id} className="poll-result" data-mine={mine || undefined} data-top={(shown && most > 0 && o.votes === most) || undefined}>
                                    <span className="poll-result-line">
                                        <span className="poll-result-title">
                                            {mine ? <Icon name="check" size={14} strong /> : null}
                                            <bdi>{o.title}</bdi>
                                            {mine ? <span className="sr-only">{t(', your answer')}</span> : null}
                                        </span>
                                        {shown ? (
                                            <span className="poll-result-count">
                                                <span className="poll-percent">{share}%</span>
                                                <span className="muted">
                                                    <span aria-hidden="true">·</span> {votesText(o.votes ?? 0)}
                                                </span>
                                            </span>
                                        ) : null}
                                    </span>
                                    {shown ? (
                                        <span className="poll-bar" aria-hidden="true">
                                            <span className="poll-bar-fill" style={{ width: `${share}%` }} />
                                        </span>
                                    ) : null}
                                </li>
                            );
                        })}
                    </ul>
                    <p className="poll-foot muted small">{votersText(poll)}</p>
                </>
            )}
            {error ? (
                <p className="error small" role="alert">
                    {error}
                </p>
            ) : null}
        </div>
    );
}

/** The results in words, for the live region after a vote: "Thursday 50%, 2 votes; ...". */
export function resultsWords(poll: Poll): string {
    if (!poll.results_visible) return votersText(poll);
    const shares = percents(poll.options);
    return poll.options.map((o, i) => `${o.title} ${shares[i] ?? 0}%, ${votesText(o.votes ?? 0)}`).join('; ') + '.';
}
