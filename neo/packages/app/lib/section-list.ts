/**
 * A section that opens on its own menu on phones and tablets (UNA's `section_nav_small` = `list`, Studio >
 * Navigation > a menu; the account's Settings): the menu, as a list of the section's pages, is the section's first
 * screen, and each page opens from it with Back. The list is at the section's own page, the uri the menu names in its
 * `config` (`hub`: `settings`). That page is not one of the menu's items and UNA sends no blocks for it; on large
 * screens it opens the menu's first page, as UNA's site does.
 */
export type SectionNavSmall = 'list' | 'tabs';

type PageData = { url?: string; uri?: string; name?: string; layout_parsed?: boolean; elements?: Record<string, unknown> | null };
type Menu = { object?: string; title?: string; items?: unknown[] };

/**
 * How the section's menu shows below desktop. Without a page of its own to hold the list (`hub`) it is tabs; a UNA
 * that does not send the setting yet showed every such section as a list.
 */
export function resolveSectionNavSmall(value: unknown, hub: string): SectionNavSmall {
    if (!hub) return 'tabs';
    if (typeof value !== 'string') return 'list';
    return value === 'list' ? 'list' : 'tabs';
}

/** A page url or uri as UNA names the page: no `page/` prefix, outer slashes or query. */
function pagePath(url: string | undefined): string {
    let path = (url ?? '').split('?')[0] ?? '';
    if (path.startsWith('page/')) path = path.slice(5);
    while (path.startsWith('/')) path = path.slice(1);
    return path;
}

/** Whether the page is the section's own page (the menu's `hub`). */
export function isSectionRootPage(data: PageData | null | undefined, hub: string): boolean {
    return !!hub && pagePath(data?.url || data?.uri) === hub;
}

/** A menu block of this menu among the page's blocks (a UNA whose settings page still lists the menu itself). */
function hasMenuBlock(elements: Record<string, unknown>, object: string): boolean {
    return Object.values(elements).some((cell) =>
        Array.isArray(cell) && cell.some((block) =>
            Array.isArray(block?.content) && block.content.some((item: any) => item?.type === 'menu' && item?.data?.content?.object === object)
        )
    );
}

/**
 * The section's own page with its menu as the first block of the center cell: a plain block (no design box) holding
 * the menu, as UNA sends a menu block, so the list is drawn by the menu element like any other. Returned unchanged
 * when the page already has that block, or is not in the cells format.
 */
export function withSectionListBlock<T extends PageData>(data: T, menu: Menu): T {
    const elements = data?.elements && typeof data.elements === 'object' ? data.elements : {};
    const hasBlocks = Object.values(elements).some((cell) => Array.isArray(cell) && cell.length > 0);
    if ((hasBlocks && !data.layout_parsed) || hasMenuBlock(elements, String(menu?.object || ''))) return data;

    const title = menu?.title || data?.name || '';
    const block = {
        id: 'section-list',
        module: 'system',
        title,
        designbox_id: 0,
        hidden_on: false,
        // UNA names a menu block by its menu; a block without a name is not drawn.
        source: String(menu?.object || 'section-list'),
        content: [{ id: 1, type: 'menu', data: { title, content: menu } }],
    };
    const center = Array.isArray(elements.cell_center) ? elements.cell_center : [];
    return { ...data, layout_parsed: true, elements: { ...elements, cell_center: [block, ...center] } };
}
