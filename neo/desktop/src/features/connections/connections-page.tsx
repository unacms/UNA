import { useQuery } from '@tanstack/react-query';

import { SegmentedTabs } from '../../components/segmented-tabs';
import { unwrap } from '../../lib/api';
import { useApp } from '../../lib/context';
import { t, tn } from '../../lib/i18n';
import { useNavigation, useRoute } from '../../lib/navigation';
import { CONNECTIONS_TABS, type ConnectionsTab, connectionsRoute } from '../../lib/router';
import { useSync } from '../../lib/sync-provider';
import { Pane } from '../../shell/pane';
import { ConnectionsList, type ConnectionsSource } from '../profile/connections-list';
import { connectionsKey } from '../profile/graph';

const PANEL_ID = 'connections-panel';
const tabId = (tab: ConnectionsTab) => `connections-tab-${tab}`;

export const CONNECTIONS_TAB_LABELS: Record<ConnectionsTab, string> = { friends: t('Friends'), requests: t('Requests'), sent: t('Sent', { context: 'requests' }), following: t('Following'), followers: t('Followers') };

/** What each tab lists, its accessible name and what its empty list says. */
const TAB_LISTS: Record<ConnectionsTab, { label: string; empty: string; hint: string }> = {
    friends: { label: t('Your friends, newest friendship first'), empty: t('No friends yet'), hint: t('People who accept your friend requests, and whose requests you accept, show up here.') },
    requests: { label: t('Friend requests waiting for you, newest first'), empty: t('No friend requests'), hint: t('When someone asks to be your friend, you can accept or decline here.') },
    sent: { label: t('Friend requests you sent, newest first'), empty: t('No requests waiting'), hint: t('Friend requests you send wait here until they are answered.') },
    following: { label: t('People you follow, newest first'), empty: t('Not following anyone yet'), hint: t('Follow people to see their posts on Home.') },
    followers: { label: t('People who follow you, newest first'), empty: t('No followers yet'), hint: t('People who follow you show up here.') },
};

/**
 * The tabs the acting profile has: all of them, or only Following and Followers where it can't
 * have friends (an organization whose module has friends off: `lists.friends` false). Every tab
 * while that is not known yet, so the tabs do not move for a person.
 */
export function connectionsTabs(friends: boolean | undefined): ConnectionsTab[] {
    return friends === false ? CONNECTIONS_TABS.filter((tab) => tab === 'following' || tab === 'followers') : [...CONNECTIONS_TABS];
}

/** "1 waiting", "12 waiting": what the Requests tab's count says. */
export function requestsSpoken(n: number): string {
    return tn(n, '{{count}} waiting', '{{count}} waiting');
}

/**
 * The Connections section (the site's Connections pages): the acting profile's friends, the
 * friend requests waiting for it (Accept, Decline) and the ones it sent (Cancel), whom it
 * follows and who follows it, a tab each. A page in the content pane, as Media or Events: a
 * person opens their profile's page here too, and Back comes back to the tab.
 */
export function ConnectionsPage() {
    const route = useRoute();
    const { history } = useNavigation();
    const { api, me } = useApp();
    const id = me.active_profile_id;
    const waiting = useSync().badges?.friend_requests ?? 0;
    const connections = useQuery({ queryKey: connectionsKey(id), queryFn: async () => unwrap(await api.GET('/profiles/{id}/connections', { params: { path: { id } } })) });
    const tabs = connectionsTabs(connections.data?.lists.friends);
    const wanted = route.list.connections ?? 'friends';
    const current = tabs.includes(wanted) ? wanted : (tabs[0] ?? 'following');
    const list = TAB_LISTS[current];
    const source: ConnectionsSource = current === 'requests' ? { kind: 'requests' } : current === 'sent' ? { kind: 'sent' } : { kind: 'list', profileId: id, list: current };

    return (
        <Pane
            pane="list"
            title={t('Connections')}
            scope={
                <SegmentedTabs
                    label={t('Connections')}
                    values={tabs}
                    labels={CONNECTIONS_TAB_LABELS}
                    counts={{ requests: { value: waiting, spoken: requestsSpoken(waiting) } }}
                    current={current}
                    onChange={(tab) => history.push(connectionsRoute(tab))}
                    panelId={PANEL_ID}
                    tabId={tabId}
                />
            }
        >
            <div className="column" id={PANEL_ID} role="tabpanel" aria-labelledby={tabId(current)}>
                <ConnectionsList key={`${id}-${current}`} source={source} label={list.label} emptyText={list.empty} emptyHint={list.hint} manage />
            </div>
        </Pane>
    );
}
