import * as WebBrowser from 'expo-web-browser';
import { appSetting, FeedbackHaptics, clearNotif } from 'app/lib/util';
import { playTabFeedback } from 'app/components/nav/tab-feedback';
import { isExternalTabUrl, resolveTabUrl } from './tab-menu';
import {
    isAtTabRoot,
    isSelectedTab,
    navigateToTabRoot,
    rememberSelectedTab,
} from 'app/lib/navigation/tab-history';
import emitter, { EVENTS } from 'app/context/emitter';

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
 * Shared tab-press: external URL, notif clear, re-tap root/reset, haptic.
 * First tap of a tab restores its last page (navigator switch). A consecutive
 * tap of the already-selected tab jumps to that tab's root.
 * `variant: 'js'` = RouterTabs Screen listener. `'expo'` = NativeTabs navigation listener.
 */
export async function handleTabPress({
    e,
    tab,
    tabIndex,
    currentUser,
    setCurrentUser,
    setBottomSheetData,
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

    // Use last-selected tab, not pathname. NativeTabs may focus the target
    // tab before this listener runs; pathname would then look like a re-tap.
    if (isSelectedTab(tabKey)) {
        e.preventDefault?.();
        if (isJs) {
            e.stopPropagation?.();
        }

        if (!isAtTabRoot(tabKey, currentUser)) {
            navigateToTabRoot(router, tabKey, currentUser);
        } else {
            emitter.emit(EVENTS.conductor, { action: 'reset_to_first' });
        }

        rememberSelectedTab(tabKey);
        scheduleTabFeedback(isJs);
        return;
    }

    rememberSelectedTab(tabKey);
    scheduleTabFeedback(isJs);
}
