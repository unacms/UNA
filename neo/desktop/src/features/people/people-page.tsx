import { useQuery } from '@tanstack/react-query';

import { EmptyState } from '../../components/empty-state';
import { SegmentedTabs } from '../../components/segmented-tabs';
import { SkeletonRows } from '../../components/skeleton';
import { unwrap } from '../../lib/api';
import { useApp } from '../../lib/context';
import { t } from '../../lib/i18n';
import { useNavigation, useRoute } from '../../lib/navigation';
import { feedRoute, SECTION_FEEDS } from '../../lib/router';
import { useSiteHasTag } from '../../lib/site-modules';
import { Pane } from '../../shell/pane';
import { FEED_LABELS } from '../feed/feed-tabs';
import { ConnectionsList, type ConnectionsSource } from '../profile/connections-list';
import { connectionsKey } from '../profile/graph';

/** People's tabs: the directory's views (GET /persons), then one's friends; Recent is the default. */
export const PEOPLE_TABS = SECTION_FEEDS.people;
export type PeopleTab = (typeof PEOPLE_TABS)[number];

const PANEL_ID = 'people-panel';
const tabId = (tab: PeopleTab) => `people-tab-${tab}`;

/** What each tab lists, its accessible name and what its empty list says. */
const TAB_LISTS: Record<PeopleTab, { label: string; empty: string; hint: string }> = {
    recent: { label: t('People, newest first'), empty: t('No people yet'), hint: t('People who join the network show up here.') },
    active: { label: t('People, the most recently active first'), empty: t('No one has been active yet'), hint: t('People show up here after they sign in.') },
    online: { label: t('People online now'), empty: t('No one is online right now'), hint: t('People show up here while they use the network.') },
    friends: { label: t('Your friends, newest friendship first'), empty: t('No friends yet'), hint: t('People who accept your friend requests, and whose requests you accept, show up here.') },
};

/**
 * The tabs the acting profile has: all of them, or the directory's alone where it can't have
 * friends (an organization whose module has friends off: `lists.friends` false). Every tab while
 * that is not known yet, so the tabs do not move for a person.
 */
export function peopleTabs(friends: boolean | undefined): PeopleTab[] {
    return friends === false ? PEOPLE_TABS.filter((tab) => tab !== 'friends') : [...PEOPLE_TABS];
}

/**
 * The People section: the network's people directory, as the site's People pages list them
 * (Persons' Recent, Active and Online: GET /persons), and one's own friends (GET
 * /profiles/{id}/friends, as Connections' Friends), a tab each, the tab in the route
 * (/people?feed=online). A name opens the profile (Cmd+click: in a window of its own). The
 * sidebar's People opens it at Recent, Your friends' Browse people too, and All your friends at
 * Friends. Connections (requests, following, followers) stays a section of its own.
 */
export function PeoplePage() {
    const route = useRoute();
    const { history } = useNavigation();
    const { api, me } = useApp();
    const id = me.active_profile_id;
    // a site without the Persons module has no directory (GET /api/v2 does not list it)
    const directory = useSiteHasTag('persons');
    const connections = useQuery({ queryKey: connectionsKey(id), queryFn: async () => unwrap(await api.GET('/profiles/{id}/connections', { params: { path: { id } } })) });
    const tabs = peopleTabs(connections.data?.lists.friends);
    const wanted = (route.list.feed ?? 'recent') as PeopleTab;
    const current = tabs.includes(wanted) ? wanted : (tabs[0] ?? 'recent');
    const list = TAB_LISTS[current];
    const source: ConnectionsSource = current === 'friends' ? { kind: 'list', profileId: id, list: 'friends' } : { kind: 'people', view: current };
    const none = directory === false && current !== 'friends';
    // the directory is asked for once the site said it has one (the list is kept offline, so mostly at once)
    const waiting = directory === null && current !== 'friends';

    return (
        <Pane
            pane="list"
            title={t('People')}
            scope={
                <SegmentedTabs
                    label={t('People')}
                    values={tabs}
                    labels={FEED_LABELS}
                    current={current}
                    onChange={(tab) => history.push({ list: feedRoute('people', tab), detail: history.current.detail })}
                    panelId={PANEL_ID}
                    tabId={tabId}
                />
            }
        >
            <div className="column" id={PANEL_ID} role="tabpanel" aria-labelledby={tabId(current)}>
                {waiting ? (
                    <SkeletonRows loading />
                ) : none ? (
                    <EmptyState shown icon="users" title={t('This network has no people directory.')} />
                ) : (
                    // one's friends are Connections' list (Message, Remove friend in a row's More menu)
                    <ConnectionsList key={`${id}-${current}`} source={source} label={list.label} emptyText={list.empty} emptyHint={list.hint} manage={current === 'friends'} />
                )}
            </div>
        </Pane>
    );
}
