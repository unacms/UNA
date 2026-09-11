import * as WebBrowser from 'expo-web-browser';
import { appSetting, FeedbackHaptics, clearNotif } from 'app/lib/util';
import { playTabFeedback } from 'app/components/nav/tab-feedback';
import { isExternalTabUrl, resolveTabUrl } from './tab-menu';
import { canGoBackInTab, navigateBackInTab } from 'app/lib/navigation/tab-history';
import emitter from 'app/context/emitter';

function scheduleTabFeedback(defer) {
    if (defer) {
        setTimeout(() => {
            playTabFeedback();
        }, 0);
        return;
    }
    playTabFeedback();
}

/**
 * Shared tab-press: external URL, notif clear, re-tap back/reset, haptic.
 * `variant: 'js'` = RouterTabs Screen listener. `'expo'` = NativeTabs navigation listener.
 */
export async function handleTabPress({
    e,
    tab,
    tabIndex,
    currentUser,
    setCurrentUser,
    setBottomSheetData,
    pathname,
    router,
    variant,
}) {
    const tabUrl = resolveTabUrl(tab, currentUser);
    const notificationUrl = appSetting('notifications', 'url');
    const isJs = variant === 'js';

    setBottomSheetData(null);

    if (isExternalTabUrl(tabUrl)) {
        if (isJs) {
            e.preventDefault();
        } else {
            e.preventDefault?.();
        }
        await WebBrowser.openBrowserAsync(tabUrl);
        FeedbackHaptics('Medium');
        return;
    }

    const tabKey = `/tab${tabIndex}`;
    const shouldClearNotif = isJs ? e.type === 'tabPress' : true;
    if (shouldClearNotif && tabUrl === notificationUrl) {
        clearNotif();
        setCurrentUser({
            notifications: 0,
            notificationsTs: Date.now(),
            counters: {
                ...(currentUser?.counters || {}),
                bx_notifications: 0,
            },
        });
    }

    if (pathname?.startsWith(tabKey)) {
        e.preventDefault?.();
        if (isJs) {
            e.stopPropagation?.();
        }

        if (canGoBackInTab(tabKey)) {
            navigateBackInTab(router, tabKey, currentUser);
        } else {
            emitter.emit('conductor', { action: 'reset_to_first' });
        }

        scheduleTabFeedback(isJs);
        return;
    }

    scheduleTabFeedback(isJs);
}
