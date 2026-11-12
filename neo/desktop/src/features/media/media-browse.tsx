import { EmptyState } from '../../components/empty-state';
import type { IconName } from '../../components/icon';
import { SegmentedTabs } from '../../components/segmented-tabs';
import { t } from '../../lib/i18n';
import { useNavigation, useRoute } from '../../lib/navigation';
import { type DetailRoute, feedRoute, type FeedName, sectionFeeds } from '../../lib/router';
import { useSiteModules } from '../../lib/site-modules';
import { Pane, ToolbarButton } from '../../shell/pane';
import { FEED_LABELS } from '../feed/feed-tabs';
import { FilesPages } from '../files/file-list';
import { AlbumsPages } from '../photos/album-list';
import { PhotosPages } from '../photos/photo-list';
import { VideosPages } from '../videos/video-list';

const PANEL_ID = 'media-panel';
const mediaTabId = (tab: FeedName) => `media-tab-${tab}`;

/** What each tab of Media adds from the toolbar and its empty list. */
const ADD: Record<string, { label: string; icon: IconName; detail: DetailRoute }> = {
    videos: { label: t('Add video'), icon: 'upload', detail: { kind: 'new-video' } },
    photos: { label: t('Add photos'), icon: 'image-plus', detail: { kind: 'new-photos' } },
    albums: { label: t('New album'), icon: 'plus', detail: { kind: 'new-album' } },
    files: { label: t('Add files'), icon: 'file-up', detail: { kind: 'new-files' } },
};

/**
 * The tabs of Media the site has: one per media module GET /api/v2 lists (Videos, Photos, Albums, Files),
 * in that order; null while the list is not known (every tab until then).
 */
export function mediaTabs(tags: readonly string[] | null): FeedName[] {
    const all = sectionFeeds('media');
    return tags ? all.filter((t) => tags.includes(t)) : [...all];
}

/**
 * The Media section: a tab per media module the site has, each the network's newest first:
 * videos as rows, photos as a grid of square tiles, albums as cards, files as rows by type. One opens beside the list;
 * the toolbar adds one of the tab's kind.
 */
export function MediaBrowse() {
    const route = useRoute();
    const { history, openDetail } = useNavigation();
    const modules = useSiteModules().data;
    const tags = modules === undefined ? null : (modules ?? []).map((m) => m.tag);
    const tabs = mediaTabs(tags);
    const current = route.list.feed && tabs.includes(route.list.feed) ? route.list.feed : (tabs[0] ?? 'videos');
    const add = ADD[current];
    const open = () => {
        if (add) openDetail(add.detail);
    };
    const action = add ? (
        <button type="button" className="btn btn-primary" onClick={open}>
            {add.label}
        </button>
    ) : undefined;
    return (
        <Pane
            pane="list"
            title={t('Media')}
            scope={tabs.length > 1 ? <SegmentedTabs label={t('Media')} values={tabs} labels={FEED_LABELS} current={current} onChange={(t) => history.push({ list: feedRoute('media', t), detail: history.current.detail })} panelId={PANEL_ID} tabId={mediaTabId} /> : undefined}
            actions={add && tabs.includes(current) ? <ToolbarButton icon={add.icon} label={add.label} onClick={open} /> : undefined}
        >
            <div className="column" id={PANEL_ID} role={tabs.length > 1 ? 'tabpanel' : undefined} aria-labelledby={tabs.length > 1 ? mediaTabId(current) : undefined}>
                {!tabs.length ? (
                    <EmptyState icon="film" title={t('This network has no videos, photos or files.')} />
                ) : current === 'photos' ? (
                    <PhotosPages of={{ all: true }} label={t('Photos, newest first')} empty={t('No photos yet')} hint={t('Photos people add to this network show up here.')} action={action} />
                ) : current === 'files' ? (
                    <FilesPages of={{ all: true }} label={t('Files, newest first')} empty={t('No files yet')} hint={t('Files people share in this network show up here.')} selectedId={route.detail?.kind === 'file' ? route.detail.id : null} action={action} />
                ) : current === 'albums' ? (
                    <AlbumsPages of={{ all: true }} label={t('Albums, newest first')} empty={t('No albums yet')} hint={t('Albums people make in this network show up here.')} action={action} />
                ) : (
                    <VideosPages
                        of={{ all: true }}
                        label={t('Videos, newest first')}
                        empty={t('No videos yet')}
                        hint={t('Videos people add to this network show up here.')}
                        selectedId={route.detail?.kind === 'video' ? route.detail.id : null}
                        action={action}
                    />
                )}
            </div>
        </Pane>
    );
}
