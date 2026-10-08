import { appSetting } from 'app/lib/util';
import { Text } from 'app/design/typography';

/** JS RouterTabs badge: JSX. NativeTabs badge: string. Same match rules, different render. */

function formatBadgeCount(count) {
    const n = Number(count) || 0;
    return n > 99 ? 99 : n;
}

export function getBadgeForTab(currentUser, tab) {
    const badgeTextSize = appSetting('theme', 'native_tabs', 'badgeTextSize') || 'text-xs';
    const notifCount = Number(currentUser?.notifications) || 0;
    const msgCount = Number(currentUser?.counters?.bx_messenger_new_messages) || 0;

    if (
        (tab.url === appSetting('notifications', 'url') || tab.badge === 'notifications') &&
        notifCount > 0
    ) {
        return (
            <Text className={`${badgeTextSize} text-white font-medium`}>
                {formatBadgeCount(notifCount)}
            </Text>
        )
    }

    if (
        tab.badge === 'notifications, messenger' &&
        (currentUser?.counters?.bx_messenger_new_messages + currentUser?.notifications) > 0
    ) {
        return (
            <Text className={`${badgeTextSize} text-white font-medium`}>
                {formatBadgeCount(
                    (currentUser?.counters?.bx_messenger_new_messages || 0) +
                        (currentUser?.notifications || 0)
                )}
            </Text>
        )
    }
    if (tab.url === appSetting('messenger', 'url') && msgCount > 0) {
        return (
            <Text className={`${badgeTextSize} text-white font-medium`}>
                {formatBadgeCount(msgCount)}
            </Text>
        )
    }
    return null
}

function formatBadgeLabelCount(count) {
    const n = Number(count) || 0;
    if (n <= 0) return null;
    return n > 99 ? '99+' : String(n);
}

export function getBadgeLabel(currentUser, tab) {
    if (
        (tab.url === appSetting('notifications', 'url') || tab.badge === 'notifications') &&
        currentUser?.notifications
    ) {
        return formatBadgeLabelCount(currentUser.notifications);
    }
    if (tab.badge === 'notifications, messenger') {
        return formatBadgeLabelCount(
            (currentUser?.counters?.bx_messenger_new_messages || 0) +
                (currentUser?.notifications || 0)
        );
    }
    if (tab.url === appSetting('messenger', 'url') && currentUser?.counters?.bx_messenger_new_messages) {
        return formatBadgeLabelCount(currentUser.counters.bx_messenger_new_messages);
    }
    return null;
}

/** Sum of the overflow tabs' badges, for the More tab. 0 when none. */
export function getOverflowBadgeTotal(currentUser, overflow = []) {
    let total = 0;
    for (const tab of overflow) {
        if (tab?.hide === true) continue;
        const n = parseInt(getBadgeLabel(currentUser, tab), 10);
        if (n > 0) total += n;
    }
    return total;
}
