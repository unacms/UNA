/**
 * A page of the site the app has no screen of its own for (a sidebar item of the site's menus
 * whose target is a page, or whose section the app does not have): its blocks the app draws, in
 * the page's reading order, each a card (PageBlock), under the page's title. The list route's
 * `page` is its path on the site (GET /layout/resolve). Nothing else of the site's page is drawn,
 * and nothing opens the site.
 */
import { EmptyState } from '../../components/empty-state';
import { SkeletonRows } from '../../components/skeleton';
import { t } from '../../lib/i18n';
import { useRoute } from '../../lib/navigation';
import { usePanesMode } from '../../shell/layout';
import { Pane, usePaneBody } from '../../shell/pane';
import { PageBlock } from './page-blocks';
import { type ResolvedPage, type Screen, screenOf, shownOn, usePageLayout, useWidth } from './page-layout';

/** The blocks of every cell that show on a screen, in reading order (top, the columns, bottom). */
export function pageBlocks(page: ResolvedPage | undefined, screen: Screen) {
    return (page?.cells ?? []).flatMap((cell) => cell.blocks.filter((block) => shownOn(block, screen)));
}

export function SitePage({ path }: { path: string | null }) {
    const layout = usePageLayout(path);
    const title = layout.data?.title || t('Page');
    return (
        <Pane pane="list" title={title} names ready={!layout.isLoading}>
            <SitePageBody path={path} />
        </Pane>
    );
}

function SitePageBody({ path }: { path: string | null }) {
    const body = usePaneBody();
    const width = useWidth(body);
    const route = useRoute();
    const mode = usePanesMode();
    const screen = screenOf(width, !!route.detail && mode !== 'cover');
    const layout = usePageLayout(path);
    if (layout.isLoading) return <SkeletonRows loading shape="post" />;
    if (!path || layout.isError) return <EmptyState icon="file-text" title={t('This page isn’t available.')} hint={t('It may have moved, or it is not open to you.')} />;
    const blocks = pageBlocks(layout.data, screen);
    if (!blocks.length) return <EmptyState icon="file-text" title={t('Nothing on this page that the app can show.')} />;
    return (
        <div className="column site-page">
            {blocks.map((block) => (
                <PageBlock key={block.id} block={block} screen={screen} />
            ))}
        </div>
    );
}
