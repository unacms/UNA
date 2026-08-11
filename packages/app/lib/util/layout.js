import { Platform } from 'react-native'
import { isComponent } from 'app/components/registry'
import { appSetting } from './settings'
import { strToObj } from './object'

export { cn } from 'cnfast';

export const isWeb = Platform.OS === 'web'

export const LAYOUT_BREAKPOINTS = {
    '2xl': 1536,
    xl: 1280,
    lg: 1024,
    md: 768,
    sm: 640
};

const LAYOUT_BREAKPOINTS_DESC = Object.entries(LAYOUT_BREAKPOINTS).sort((a, b) => b[1] - a[1]);

export function getBreakpoint(width) {
    for (const [label, min] of LAYOUT_BREAKPOINTS_DESC) {
        if (width >= min) return label;
    }
    return '';
}

export function normalizeClasses(a) {
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


export function isShowCover(cover, currentUser, url) {
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
export function getHeaderToolbarNeoButtonDefaults(isDesktop) {
    const config = appSetting('header_toolbar', 'neoButton') || {};
    const platform = isDesktop ? 'desktop' : 'mobile';
    const platformConfig = config[platform] || {};
    return {
        style: platformConfig.style ?? (isDesktop ? 'bordered' : 'borderless'),
        controlSize: platformConfig.controlSize ?? 'regular',
    };
}

export function getPageWidth(uri, config) {
    //let settings = appSetting('l-ayouts', uri)
    const settings = getPageSettings(config, uri);
    if (settings?.max_width)
        return settings.max_width;

    return appSetting('layout', 'max_width');
}

export function getPageContentWidth(layoutKey) {
    if (!layoutKey) {
        return appSetting('layout', 'page_content_width_default');
    }
    const pageLayouts = appSetting('layout', 'page_content_width') || {};
    return pageLayouts[layoutKey] ?? appSetting('layout', 'page_content_width_default');
}

export function getLayoutName(data, uri) {
    if (data?.page_status) {
        return { layoutName: 'default', layoutBlocks: '', isCustomLayout: false, columnLayout: '' };
    }

    const pageSettings = getPageSettings(data?.config, uri) || {};
    const customLayout = pageSettings.layout || '';
    const customBlocks = pageSettings.blocks || '';
    const isCustom = Boolean(customLayout);

    const checks = [
        {
            cond: uri === 'login',
            name: 'login',
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

export function getHeaderSettings(uri, isDesktop, layout, config) {
    let settings = getPageSettings(config, uri);
    if (!settings?.headerSettings) {
        if (layout == 'navigator') {
            settings = { headerSettings: { offset: isDesktop ? true : false, header: false, backButton: false, menu: true, footer: true } }
        }
        if (layout == 'messenger') {
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

export function getPageSettings(config, uri) {
    if (!appSetting('layout', 'user_remote_config')) {
        return appSetting('layouts', uri);
    }
    if (!config) return appSetting('layouts', uri);
    if (typeof config === 'object') return config;
    return strToObj(config) ?? appSetting('layouts', uri);
}

