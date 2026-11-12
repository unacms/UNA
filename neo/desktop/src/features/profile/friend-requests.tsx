import type { ContextAction } from '../../components/context-actions';
import { t, tn } from '../../lib/i18n';
import { useNavigation } from '../../lib/navigation';
import { connectionsRoute } from '../../lib/router';
import { useSync } from '../../lib/sync-provider';

/** How many requests wait, as a short text: '', '3' or '30+' (one page is all it reads). */
export function requestCountText(count: number, more: boolean): string {
    if (!count) return '';
    return more ? `${count}+` : String(count);
}

/**
 * The button that goes to the friend requests (Connections' Requests tab, in the content pane)
 * from one's own profile, with how many wait: the sync's count (GET /sync), which answering one
 * brings up to date.
 */
export function FriendRequestsButton({ className = 'btn small' }: { className?: string }) {
    const { history } = useNavigation();
    const count = useSync().badges?.friend_requests ?? 0;
    const n = count > 99 ? '99+' : requestCountText(count, false);
    return (
        <button type="button" className={className} onClick={() => history.push(connectionsRoute('requests'))}>
            {t('Friend requests')}
            {n ? (
                <span className="nav-badge" aria-hidden="true">
                    {n}
                </span>
            ) : null}
            {n ? <span className="sr-only">{count > 99 ? t(', 99+ waiting') : tn(count, ', {{count}} waiting', ', {{count}} waiting')}</span> : null}
        </button>
    );
}

/** The same button as one of a profile's hero actions (and its toolbar's copy), with the count as its badge. */
export function useFriendRequestsAction(): ContextAction {
    const { history } = useNavigation();
    const count = useSync().badges?.friend_requests ?? 0;
    const n = count > 99 ? '99+' : requestCountText(count, false);
    return { key: 'friend-requests', label: t('Friend requests'), icon: 'users', count: n ? { text: n, spoken: count > 99 ? t('99+ waiting') : tn(count, '{{count}} waiting', '{{count}} waiting') } : undefined, run: () => history.push(connectionsRoute('requests')) };
}
