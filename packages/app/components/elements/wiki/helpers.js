import { Platform } from 'react-native'
import { DEFAULT_HEADER_HEIGHT } from 'app/context/jotai/layout'
import { appSetting } from 'app/lib/util'
import { parseFrontMatter } from 'app/lib/markdown/frontmatter'
import { wikiCacheKey } from 'app/lib/wiki-page-cache'

export const isWeb = Platform.OS === 'web'

/** Extra space below the fixed header when scrolling to a TOC heading. */
export const TOC_SCROLL_GAP = 12

export function getWikiHeaderOffset(headerHeight) {
    if (isWeb && typeof document !== 'undefined') {
        let sum = 0
        document.querySelectorAll('.header-fixed').forEach((el) => {
            const rect = el.getBoundingClientRect()
            if (rect.height <= 0) return
            const style = getComputedStyle(el)
            sum += rect.height
                + parseFloat(style.marginTop || 0)
                + parseFloat(style.marginBottom || 0)
        })
        if (sum > 0) return sum + TOC_SCROLL_GAP
    }

    return (Number(headerHeight) || DEFAULT_HEADER_HEIGHT) + TOC_SCROLL_GAP
}

const depthClassNameMap = {
    0: '',
    1: 'ps-3',
    2: 'ps-6',
    3: 'ps-9',
};

export const getDepthClassName = (depth) => depthClassNameMap[depth] || '';
export const getItemId = (item, indexPath) => String(item?.id || item?.name || item?.url || item?.link || indexPath);
export const hasItemPath = (item) => Boolean(String(item?.url || item?.link || ''));
export const normalizePathComparable = (path) => String(path || '')
    .replace(/^https?:\/\/[^/]+/i, '')
    .split(/[?#]/)[0]
    .replace(/^\/+|\/+$/g, '');

export const getItemPath = (item) => {
    const p = String(item?.url || item?.link || '');
    return p ? (p.startsWith('/') ? p : `/${p}`) : '';
};

export const getRouteParam = (value) => Array.isArray(value) ? value[0] : value;

export function findWikiBreadcrumbTrail(items, currentPathComparable, ancestors = []) {
    for (const item of items || []) {
        const title = item?.title || item?.name
        if (!title) continue

        const path = getItemPath(item)
        const pathKey = normalizePathComparable(path)
        const crumb = {
            key: `${pathKey || title}-${ancestors.length}`,
            title,
            path: path || null,
            isCurrent: false,
        }

        if (pathKey && pathKey === currentPathComparable) {
            return [...ancestors, { ...crumb, isCurrent: true }]
        }

        const found = findWikiBreadcrumbTrail(
            item?.subitems || [],
            currentPathComparable,
            [...ancestors, crumb],
        )
        if (found) return found
    }

    return null
}

export function buildWikiBreadcrumbs(menuItems, currentPath) {
    const currentKey = normalizePathComparable(currentPath)
    const trail = findWikiBreadcrumbTrail(menuItems, currentKey) || []
    const root = appSetting('wiki', 'breadcrumb') || {}
    const rootLabel = String(root.root_label || '').trim()
    const rootPath = root.root_path
        ? (String(root.root_path).startsWith('/') ? String(root.root_path) : `/${root.root_path}`)
        : null
    const rootKey = normalizePathComparable(rootPath)

    if (!rootLabel) return trail

    const rootCrumb = {
        key: 'wiki-breadcrumb-root',
        title: rootLabel,
        path: rootPath,
        isCurrent: Boolean(rootKey && rootKey === currentKey),
    }

    if (trail[0] && normalizePathComparable(trail[0].path) === rootKey) {
        return trail
    }

    if (rootCrumb.isCurrent && !trail.length) {
        return [rootCrumb]
    }

    if (rootCrumb.isCurrent) {
        return trail
    }

    return [rootCrumb, ...trail]
}

export const stripMarkdownInline = (text) => String(text || '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .trim();

export const slugifyHeading = (text) => String(text || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-') || 'section';

// Build the TOC from the Markdown source (h2/h3). Parsing the source is reliable
// and synchronous — the web renderer parses Markdown asynchronously via WASM, so
// reading the rendered DOM here would race the render and often yield an empty TOC.
export function extractMarkdownHeadings(markdown) {
    if (!markdown || typeof markdown !== 'string') return [];

    const lines = markdown.split(/\r?\n/);
    const seenIds = new Map();
    const items = [];
    let inFence = false;

    lines.forEach((line) => {
        if (/^\s*(```|~~~)/.test(line)) {
            inFence = !inFence;
            return;
        }
        if (inFence) return;

        const match = line.match(/^\s{0,3}(#{2,3})\s+(.+?)\s*#*\s*$/);
        if (!match) return;

        const level = match[1].length;
        const text = stripMarkdownInline(match[2]);
        if (!text) return;

        const base = slugifyHeading(text);
        const count = seenIds.get(base) || 0;
        const id = count === 0 ? base : `${base}-${count + 1}`;
        seenIds.set(base, count + 1);

        items.push({ id, key: `${id}-${items.length}`, text, level });
    });

    return items;
}

export const WIKI_ACTION_TYPES = new Set(['wiki_add_block', 'wiki_add_page']);

/** Private element slots for chrome the custom wiki layout rediscovers by identity. */
export const WIKI_NAV_SLOT = '__wiki_nav'
export const WIKI_TOC_SLOT = '__wiki_toc'

export function hasWikiCenterContent(page) {
    const center = page?.elements?.cell_center
    if (!center) return false
    if (Array.isArray(center)) return center.length > 0
    return Object.keys(center).length > 0
}

export function flattenPageBlocks(data) {
    return Object.values(data?.elements ?? {})
        .flatMap((level) => (Array.isArray(level) ? level : Object.values(level ?? {})))
        .filter(Boolean)
}

/**
 * UNA wiki TOC service block (TemplServiceWiki::page_contents).
 * Custom NEO layout ignores UNA cell placement — find it anywhere in the page.
 */
export function isWikiTocBlock(block) {
    if (!block) return false
    const source = String(block.source || '')
    if (source === 'system:page_contents' || source.includes('page_contents')) {
        return true
    }
    // Service payload / cached HTML marker from TemplServiceWiki::page_contents.
    try {
        return JSON.stringify(block.content || []).includes('bx_wiki_toc')
    } catch {
        return false
    }
}

export function findWikiTocBlock(data) {
    return flattenPageBlocks(data).find(isWikiTocBlock) || null
}

/** Left wiki pages menu — identity over cell_left index. */
export function findWikiNavBlock(data) {
    return flattenPageBlocks(data).find((block) => (
        Array.isArray(block?.content)
        && block.content.some((el) => el?.type === 'menu_wiki')
    )) || null
}

/**
 * Merge a content-only UNA page payload into an existing wiki page,
 * preserving sidebar chrome found by block identity (not UNA cell index).
 * Returns null when content-only data is missing center content so callers
 * do not cache/show the previous page under the new URL.
 */
export function mergeWikiPageContent(basePage, contentPage, url) {
    if (!hasWikiCenterContent(contentPage)) return null

    const path = wikiCacheKey(url || contentPage.url || basePage?.url)
    const base = basePage || {}
    const shellNav = findWikiNavBlock(base)
    const shellToc = findWikiTocBlock(base)

    const elements = {
        ...(base.elements || {}),
        ...(contentPage.elements || {}),
        // Always take article body from the content response.
        cell_center: contentPage.elements.cell_center,
    }

    const merged = {
        ...base,
        ...contentPage,
        elements,
        // Cache/routing identity lives in `url` (full normalized path).
        url: path || base.url,
        // UNA `uri` is a page name (e.g. 'wiki'), not a path segment — never
        // fabricate one from the path or it can leak into key derivations.
        uri: contentPage.uri ?? base.uri,
        title: contentPage.title ?? base.title,
        module: contentPage.module ?? base.module,
    }

    // Content-only responses often omit shell sidebars (and composite TOC).
    // Re-attach by identity into private slots — wiki layout does not use cells.
    if (shellNav && !findWikiNavBlock(merged)) {
        merged.elements[WIKI_NAV_SLOT] = [shellNav]
    }
    if (shellToc && !findWikiTocBlock(merged)) {
        merged.elements[WIKI_TOC_SLOT] = [shellToc]
    }

    return merged
}

export function getWikiCenterContentItems(cell) {
    const blocks = Array.isArray(cell) ? cell : Object.values(cell || {});

    return blocks.flatMap((block) => {
        // Skip UNA wiki TOC service HTML (jQuery #bx_wiki_toc) — TOC links are
        // built client-side from headings; the block is chrome for the right rail.
        if (!block?.content || block.hidden == true || isWikiTocBlock(block)) return [];

        const contentItems = Array.isArray(block.content)
            ? block.content
            : Object.values(block.content);

        return contentItems.filter(Boolean);
    });
}

/** Markdown sources from every article block (skip add-page / add-block CTAs). */
export function getWikiMarkdownContents(cell) {
    return getWikiCenterContentItems(cell).flatMap((item) => {
        if (WIKI_ACTION_TYPES.has(item?.type)) return [];
        const content = item?.data?.content;
        return typeof content === 'string' ? [content] : [];
    });
}

/** All non-TOC center blocks (article + add CTAs). */
export function getWikiCenterBlocks(cell) {
    const blocks = Array.isArray(cell) ? cell : Object.values(cell || {});
    return blocks.filter((block) => (
        block
        && block.hidden != true
        && !isWikiTocBlock(block)
        && block.content
    ));
}

export function isWikiActionBlock(block) {
    const contentItems = Array.isArray(block?.content)
        ? block.content
        : Object.values(block?.content || {});
    return contentItems.some((item) => WIKI_ACTION_TYPES.has(item?.type));
}

export function getWikiBlockPayload(block) {
    const contentItems = Array.isArray(block?.content)
        ? block.content
        : Object.values(block?.content || {});
    const item = contentItems.find((entry) => !WIKI_ACTION_TYPES.has(entry?.type)) || contentItems[0];
    const raw = typeof item?.data?.content === 'string' ? item.data.content : '';
    const parsed = parseFrontMatter(raw);
    return {
        item,
        menu: item?.data?.menu || null,
        added: item?.data?.info?.added,
        attributes: parsed.attributes,
        body: parsed.attributes ? parsed.body : raw,
        raw,
    };
}
