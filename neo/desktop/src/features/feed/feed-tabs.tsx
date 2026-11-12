import { SegmentedTabs } from '../../components/segmented-tabs';
import { t } from '../../lib/i18n';
import type { FeedName } from '../../lib/router';

export const FEED_LABELS: Record<FeedName, string> = {
    following: t('Following'),
    'for-you': t('For you'),
    hot: t('Hot'),
    latest: t('Latest'),
    new: t('New'),
    upcoming: t('Upcoming'),
    going: t('Going'),
    past: t('Past'),
    popular: t('Popular'),
    mine: t('Mine'),
    videos: t('Videos'),
    photos: t('Photos'),
    albums: t('Albums'),
    files: t('Files'),
    open: t('Open', { context: 'state' }),
    completed: t('Completed'),
    all: t('All'),
    joined: t('Yours'),
    recent: t('Recent'),
    active: t('Active'),
    online: t('Online'),
    friends: t('Friends'),
};

/** The panel the tabs control: the feed list under them (one list pane at a time). */
export const FEED_PANEL_ID = 'feed-panel';
export const feedTabId = (feed: FeedName) => `feed-tab-${feed}`;

type Props = {
    feeds: readonly FeedName[];
    current: FeedName;
    onChange: (feed: FeedName) => void;
};

/** The segmented control above a feed, as tabs (SegmentedTabs): arrow keys switch feeds. */
export function FeedTabs({ feeds, current, onChange }: Props) {
    return <SegmentedTabs label={t('Feeds')} values={feeds} labels={FEED_LABELS} current={current} onChange={onChange} panelId={FEED_PANEL_ID} tabId={feedTabId} />;
}
