import { appSetting } from 'app/config';

/** Guest home / splash routes: preload illustration for LCP. */
export function shouldPreloadSplashLcp(pageData, isHomePage) {
    if (!isHomePage || !pageData) {
        return false;
    }

    if (pageData.user?.id || pageData.logged === 1 || pageData.logged === '1') {
        return false;
    }

    if (pageData.layout === 'splash') {
        return true;
    }

    if (appSetting('layout', 'use_splash_page')) {
        return true;
    }

    const uri = pageData.uri || pageData.url || '';
    return uri === 'home' || uri === '/' || uri === '';
}
