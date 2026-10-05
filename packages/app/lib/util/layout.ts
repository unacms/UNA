import { Platform } from 'react-native'
import { isComponent } from 'app/components/registry'
import { appSetting } from './settings'
import { strToObj } from './object'

export { cn } from 'cnfast';

export const isWeb = Platform.OS === 'web'
export const isIos = Platform.OS === 'ios'
export const isAndroid = Platform.OS === 'android'

/** Expo UI NeoButton (SwiftUI / Material). Off on web. */
export function isExpoUI() {
    return !isWeb && !!appSetting('native', 'expo_ui_buttons');
}

/** expo-router NativeTabs. Needs isExpoUI + expo_native_tabs. */
export function isNativeTabsEnabled() {
    return isExpoUI() /*&& isIos*/ && !!appSetting('native', 'expo_native_tabs');
}

/** Text under tab icons (web footer + native JS / NativeTabs). */
export function isTabBarLabelsEnabled() {
    return !!appSetting('native', 'tab_labels');
}

/**
 * Android NativeTabs bar height (dp) without the system inset it pads itself
 * with: Material 3 sizes it to its items once `with-android-tab-bar-height`
 * (apps/expo/plugins) lifts the 80dp floor. iOS needs no constant — its bar is
 * part of the tab screen's safe-area inset.
 */
export function androidTabBarHeight(labelsHidden: boolean) {
    return labelsHidden ? 56 : 80;
}

/** iOS 26+: Liquid Glass (SwiftUI `glassEffect`) and the floating tab bar; the app still supports iOS 16.4. */
export const hasLiquidGlass = isIos && parseInt(String(Platform.Version), 10) >= 26

/** Side margin of the iOS 26 floating tab bar on iPhone (measured on a 15 Pro). */
export const IOS_TAB_BAR_MARGIN = 21

export const LAYOUT_BREAKPOINTS = {
    '2xl': 1536,
    xl: 1280,
    lg: 1024,
    md: 768,
    sm: 640
};

const LAYOUT_BREAKPOINTS_DESC = Object.entries(LAYOUT_BREAKPOINTS).sort((a, b) => b[1] - a[1]);

/** Largest breakpoint label (`2xl`…`sm`) whose min width fits; `''` below all. */
export function getBreakpoint(width: number): string {
    for (const [label, min] of LAYOUT_BREAKPOINTS_DESC) {
        if (width >= min) return label;
    }
    return '';
}

export function normalizeClasses(a: string): string;
export function normalizeClasses(a: string | null | undefined): string | null | undefined;
export function normalizeClasses(a: string | null | undefined): string | null | undefined {
    if (!a) return a
    // Notes:
    // - `group` is a special Tailwind marker (not a style utility).
    // - `web:group` won't create a `.group` ancestor on web unless we rewrite it.
    // - On native, we strip web-only and pseudo-class variants to reduce parsing work.
    if (isWeb) {
        return a.replace(/\bweb:group\b/g, 'group');
    }

    return a
        .replace(/\bweb:group\b/g, '')
        .replace(/\b\S*(hover|focus|active|group|duration|group-hover):\S*\b/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();
}

export const roundedClassToRadius = (roundedClass = '') => {
    const c = roundedClass.trim();
    if (c === 'rounded-full') return 9999;
    if (c === 'rounded-md') return 6;
    if (c === 'rounded-lg') return 8;
    if (c === 'rounded-xl') return 12;

    return 0;
};


/** Cover visibility setting: 1 all, 2 visitors only, 3 members only (default 1; always on home). */
export function isShowCover(cover: number | null | undefined, currentUser: unknown, url: string): boolean {
    if (cover === null || cover === undefined || url == 'home')
        cover = 1;
    if (cover === 1) // for all
        return true;
    if (cover === 2 && !currentUser) // for visitors
        return true;
    if (cover === 3 && currentUser) // for logged
        return true;

    return false;
}


/** Header toolbar NeoButton defaults from `header_toolbar.neoButton` settings (desktop/mobile). */
export function getHeaderToolbarNeoButtonDefaults(isDesktop: boolean, options?: { primary?: boolean }): { style: string; controlSize: string } {
    const primary = options?.primary === true;
    const config = appSetting('header_toolbar', 'neoButton') || {};
    const platform = isDesktop ? 'desktop' : 'mobile';
    const platformConfig = config[platform] || {};
    const fallbackStyle = isDesktop ? 'bordered' : 'borderless';
    const fallbackPrimaryStyle = isDesktop ? 'borderedProminent' : 'glassProminent';
    return {
        style: primary
            ? (platformConfig.primaryStyle ?? fallbackPrimaryStyle)
            : (platformConfig.style ?? fallbackStyle),
        controlSize: platformConfig.controlSize ?? 'regular',
    };
}

export function getPageWidth(uri: string, config?: unknown): any {
    //let settings = appSetting('l-ayouts', uri)
    const settings = getPageSettings(config, uri);
    if (settings?.max_width)
        return settings.max_width;

    return appSetting('layout', 'max_width');
}

function normalizeContentWidthKey(value: unknown): string {
    if (typeof value !== 'string' || !value) return '';
    return value.split('?')[0]!.replace(/^\/+|\/+$/g, '');
}

/** `chat` is the shared list | conversation layout; `messenger` is its alias. */
export function isChatLayout(layoutName: unknown): boolean {
    return layoutName === 'chat' || layoutName === 'messenger';
}

/** Layout name used for settings lookups: the alias shares the `chat` entries. */
function layoutSettingsKey(layoutKey: string): string {
    return isChatLayout(layoutKey) ? 'chat' : layoutKey;
}

/** Layout name or page URI from `layout.page_content_width`. URI wins so a page can opt out of its layout cap. */
export function getPageContentWidth(layoutName: string, uri?: string): any {
    const layoutKey = layoutSettingsKey(layoutName);
    const pageLayouts = appSetting('layout', 'page_content_width') || {};
    const uriKey = normalizeContentWidthKey(uri);
    if (uriKey && Object.prototype.hasOwnProperty.call(pageLayouts, uriKey)) {
        return pageLayouts[uriKey];
    }
    const uriWithSlash = uriKey ? `/${uriKey}` : '';
    if (uriWithSlash && Object.prototype.hasOwnProperty.call(pageLayouts, uriWithSlash)) {
        return pageLayouts[uriWithSlash];
    }
    if (layoutKey && Object.prototype.hasOwnProperty.call(pageLayouts, layoutKey)) {
        return pageLayouts[layoutKey];
    }
    return appSetting('layout', 'page_content_width_default');
}

export function getPageContentPaddingTiers(layoutName: string): any {
    if (!layoutName) return undefined;
    const layoutKey = layoutSettingsKey(layoutName);
    const pageLayouts = appSetting('layout', 'page_content_padding_layouts') || {};
    return Object.prototype.hasOwnProperty.call(pageLayouts, layoutKey)
        ? pageLayouts[layoutKey]
        : undefined;
}

function normalizeLayoutPath(uri: unknown): string {
    return String(uri || '').split(/[?#]/)[0]!.replace(/^\/+|\/+$/g, '');
}

function isTasksModule(data: { module?: string } | null | undefined): boolean {
    const module = String(data?.module || '');
    return module === 'bx_tasks' || module.startsWith('bx_tasks');
}

function isTaskViewPath(path: string): boolean {
    return path === 'view-task' || path.startsWith('view-task/');
}

/** Item view for a task (`/view-task/...` or the list-open `item` fetch). Not tasks-home. */
export function isTaskItemPage(data: any, uri: string): boolean {
    const path = normalizeLayoutPath(uri);
    const dataPath = normalizeLayoutPath(data?.uri);
    if (path === 'tasks-home' || dataPath === 'tasks-home') return false;
    if (isTaskViewPath(path) || isTaskViewPath(dataPath)) return true;
    return path === 'item' && isTasksModule(data);
}

export type LayoutNameResult = { layoutName: string; layoutBlocks: any; isCustomLayout: boolean; columnLayout: string };

export function getLayoutName(data: any, uri: string): LayoutNameResult {
    if (data?.page_status) {
        return { layoutName: 'default', layoutBlocks: '', isCustomLayout: false, columnLayout: '' };
    }

    const pageSettings = getPageSettings(data?.config, uri) || {};
    const customLayout = pageSettings.layout || '';
    const customBlocks = pageSettings.blocks || '';
    const isCustom = Boolean(customLayout);

    const checks: Array<{ cond: boolean; name: string; blocks?: any; custom?: boolean; columnLayout?: string }> = [
        {
            cond: uri === 'login',
            name: 'login',
            blocks: customBlocks,
            custom: true,
        },
        {
            // Before UNA `config.layout: 'post'` so list-open and direct URLs share `task`.
            cond: isTaskItemPage(data, uri),
            name: 'task',
            blocks: customBlocks,
            custom: true,
        },
        {
            cond: isCustom,
            name: customLayout,
            blocks: customBlocks,
            custom: true,
        },
        {
            cond: Boolean(data?.cover_block?.profile),
            name: 'profile',
        },
        {
            cond: uri === 'home',
            name: 'home',
            custom: true,
        },
        {
            cond: uri === 'create-account',
            name: 'create-account',
            custom: true,
        },
        {
            cond: data?.menu?.items?.length > 0 && !uri.includes('create-'),
            name: 'navigator',
        },
        {
            cond: data?.layout && isComponent('layout', data.layout),
            name: data.layout,
            blocks: customBlocks,
        },
    ];

    for (const { cond, name, blocks = customBlocks, custom = isCustom, columnLayout = '' } of checks) {
        if (cond) {
            return { layoutName: name, layoutBlocks: blocks, isCustomLayout: custom, columnLayout };
        }
    }

    return { layoutName: 'default', layoutBlocks: customBlocks, isCustomLayout: isCustom, columnLayout: '' };
}

export function getHeaderSettings(uri: string, isDesktop: boolean, layout: string, config?: unknown): any {
    let settings = getPageSettings(config, uri);
    if (!settings?.headerSettings) {
        if (layout == 'navigator') {
            settings = { headerSettings: { offset: isDesktop ? true : false, header: false, backButton: false, menu: true, footer: true } }
        }
        if (isChatLayout(layout)) {
            settings = { headerSettings: { offset: false, header: false, backButton: false, menu: true, footer: true } }
        }
        if (layout == 'profile') {
            settings = { headerSettings: { offset: false, header: false, footer: true } }
        }
    }

    const bBackButton = typeof settings?.headerSettings?.backButton !== 'undefined' ? settings.headerSettings.backButton : true;

    let bHeader = typeof settings?.headerSettings?.header !== 'undefined' ? settings.headerSettings.header : true;

    let bFooter = typeof settings?.headerSettings?.footer !== 'undefined' ? settings.headerSettings.footer : true;
    if (isDesktop) {
        bHeader = true;
    }

    const bMenu = typeof settings?.headerSettings?.menu !== 'undefined' ? settings.headerSettings.menu : true;

    const bTitle = typeof settings?.headerSettings?.title !== 'undefined' ? settings.headerSettings.title : true;

    let bOffset = typeof settings?.headerSettings?.offset !== 'undefined' ? settings.headerSettings.offset : false;

    let sCover = typeof settings?.headerSettings?.cover !== 'undefined' ? settings.headerSettings.cover : 'full';

    let sColumns = typeof settings?.headerSettings?.columns !== 'undefined' ? settings.headerSettings.columns : '';

    let bHideLeftmenu = typeof settings?.headerSettings?.hideLeftmenu !== 'undefined' ? settings.headerSettings.hideLeftmenu : false;

    // Apply offset on all viewports, not just larger ones PLAESE DONT CHANGE IT
    if (isDesktop)
        bOffset = true;

    return {
        backButton: bBackButton,
        header: bHeader,
        menu: bMenu,
        title: bTitle,
        offset: bOffset,
        footer: bFooter,
        cover: sCover,
        columns: sColumns,
        hideLeftmenu: bHideLeftmenu,
    }
}

/**
 * Per-page layout settings: remote `config` when enabled, else `layouts[uri]` from settings.
 * Page override point: `layout` picks a page layout (components/page-layout/_map.js) and
 * `blocks` sets its block list, which can name static components as `static:<name>`.
 * Forks add `layouts[uri]` in customization/settings.js.
 */
export function getPageSettings(config: unknown, uri: string): any {
    if (!appSetting('layout', 'user_remote_config')) {
        return appSetting('layouts', uri);
    }
    if (!config) return appSetting('layouts', uri);
    if (typeof config === 'object') return config;
    return strToObj(config as string) ?? appSetting('layouts', uri);
}

