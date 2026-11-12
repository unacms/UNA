import { useMemo } from 'react';

import type { Schema, UnaApi } from 'una-api';

import { NEW_POST_FIELD, useCompose } from '../features/compose/compose-sheet';
import { type EmptySpec, FeedList } from '../features/feed/feed-list';
import { FEED_LABELS, FeedTabs, feedTabId } from '../features/feed/feed-tabs';
import { PageColumns } from '../features/page-blocks/page-blocks';
import { SECTION_PAGES } from '../features/page-blocks/page-layout';
import { type FeedSource, PAGE_SIZE, useFeed } from '../features/feed/use-feed';
import { unwrap } from '../lib/api';
import { useSiteInfo } from '../lib/branding';
import { useApp } from '../lib/context';
import { t } from '../lib/i18n';
import { useNavigation, useRoute } from '../lib/navigation';
import { type FeedName, listFeed, sectionFeeds } from '../lib/router';
import { Pane, ToolbarButton } from '../shell/pane';

/** Where Cmd+N puts the cursor: the compose sheet's text box. */
export { NEW_POST_FIELD };

/** The feeds of posts (Home's and Explore's); Discussions' "new" is an order of its own list, Events' are its lists, Media's its tabs, Tasks' and Posts' (popular, mine) its lists, Groups' and Spaces' (all, joined) theirs, People's (recent, active, online, friends) its people. */
type PostFeed = Exclude<FeedName, 'new' | 'upcoming' | 'going' | 'past' | 'videos' | 'photos' | 'albums' | 'files' | 'open' | 'completed' | 'popular' | 'mine' | 'all' | 'joined' | 'recent' | 'active' | 'online' | 'friends'>;

const ENDPOINTS = {
    following: '/feeds/home',
    'for-you': '/feeds/for-you',
    hot: '/feeds/hot',
    latest: '/feeds/public',
} as const satisfies Record<PostFeed, string>;

function isPostFeed(feed: FeedName): feed is PostFeed {
    return Object.hasOwn(ENDPOINTS, feed);
}

/** What an empty feed says (spec 4.6), and the way out: the network's name in the hint. */
function emptySpec(feed: PostFeed, network: string, actions: { newPost?: () => void; browseGroups: () => void }): EmptySpec {
    const newPost = actions.newPost ? (
        <button type="button" className="btn btn-primary" onClick={actions.newPost}>
            {t('New post')}
        </button>
    ) : null;
    switch (feed) {
        case 'following':
            return {
                icon: 'house',
                title: t('Your Home is quiet'),
                hint: t('Follow people and join groups on {{network}} to see their posts here.', { network }),
                actions: (
                    <>
                        <button type="button" className="btn" onClick={actions.browseGroups}>
                            {t('Browse groups')}
                        </button>
                        {newPost}
                    </>
                ),
            };
        case 'for-you':
            return { icon: 'house', title: t('Nothing to suggest yet'), hint: t('Follow people and join groups on {{network}}, and posts for you show up here.', { network }) };
        case 'hot':
            return { icon: 'compass', title: t('Nothing is popular right now') };
        case 'latest':
            return { icon: 'compass', title: t('Nothing here yet'), hint: t('Be the first to post on {{network}}.', { network }), actions: newPost };
    }
}

export function loadFeed(api: UnaApi, feed: PostFeed, cursor: string | undefined): Promise<Schema<'Page_Activity'>> {
    const query = { cursor, limit: PAGE_SIZE };
    return api.GET(ENDPOINTS[feed], { params: { query } }).then(unwrap);
}

const TITLES = { home: t('Home'), explore: t('Explore') } as const;

/** Feeds ordered by rank, not time (see FeedSource.ranked). */
const RANKED: ReadonlySet<FeedName> = new Set(['for-you', 'hot']);

/** Home (Following, For you, Hot) and Explore (Latest, Hot): a feed per tab. */
export function Feed({ section }: { section: 'home' | 'explore' }) {
    const { api } = useApp();
    const compose = useCompose();
    const route = useRoute();
    const { showFeed, go } = useNavigation();
    const site = useSiteInfo();
    const feeds = sectionFeeds(section);
    const listed = (route.list.section === section ? listFeed(route.list) : null) ?? feeds[0] ?? 'latest';
    const name: PostFeed = isPostFeed(listed) ? listed : 'latest';
    const selected = route.detail?.kind === 'post' ? route.detail.id : null;

    const source = useMemo<FeedSource>(
        () => ({ key: ['feed', name], load: (cursor) => loadFeed(api, name, cursor), ranked: RANKED.has(name) }),
        [api, name],
    );
    const feed = useFeed(source);

    const title = TITLES[section];
    return (
        <Pane
            pane="list"
            title={title}
            scope={feeds.length > 1 ? <FeedTabs feeds={feeds} current={name} onChange={showFeed} /> : undefined}
            actions={compose ? <ToolbarButton icon="square-pen" label={t('New post')} commandId="new-post" onClick={() => compose.open()} /> : undefined}
            ready={!feed.query.isLoading}
            busy={feed.query.isLoading}
        >
            {/* the site's page for the section: its complementary blocks beside the feed (PageColumns) */}
            <PageColumns path={SECTION_PAGES[section]} title={title} ended={feed.query.isSuccess && !feed.query.hasNextPage}>
                <FeedList
                    key={name}
                    feed={feed}
                    cacheKey={`feed/${name}`}
                    label={`${title}, ${FEED_LABELS[name]}`}
                    empty={emptySpec(name, site.name, { newPost: compose ? () => compose.open() : undefined, browseGroups: () => go('groups') })}
                    selectedId={selected}
                    tabId={feeds.length > 1 ? feedTabId(name) : undefined}
                />
            </PageColumns>
        </Pane>
    );
}
