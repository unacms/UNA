import { useEffect } from 'react';
import { useCurrentUser } from 'app/context/user';
import { useBottomSheetData } from 'app/context/bottomsheet';
import { useIsFocused, useNavigation, usePathname, useRouter } from 'app/lib/hooks/router';
import { getTabList, splitTabBarItems } from 'app/components/nav/tabs/tab-menu';
import { handleTabPress } from 'app/components/nav/tabs/tab-press';
import { getSelectedTab, rememberSelectedTab } from 'app/lib/navigation/tab-history';

/**
 * NativeTabs has no Screen `listeners`. Re-tap / external / notif-clear live
 * here so JS tabs keep their existing tabPress handlers.
 */
export default function NativeTabPressSync({ tabKey }) {
    const navigation = useNavigation();
    const pathname = usePathname();
    const router = useRouter();
    const isFocused = useIsFocused();
    const { currentUser, setCurrentUser } = useCurrentUser();
    const { setBottomSheetData } = useBottomSheetData();

    useEffect(() => {
        if (isFocused && !getSelectedTab()) {
            rememberSelectedTab(tabKey);
        }
    }, [isFocused, tabKey]);

    useEffect(() => {
        if (!navigation?.addListener) return undefined;

        const onTabPress = async (e) => {
            const TabList = getTabList(currentUser) || [];
            const { visible, overflow, moreTabIndex } = splitTabBarItems(TabList);
            const match = String(tabKey || '').match(/^\/tab(\d+)$/);
            const tabIndex = match ? Number(match[1]) : 0;

            // More: its trigger's own `tabPress` listener (expoui-tabs) opens the
            // menu or the profile — handling it here too would do it twice.
            if (overflow.length > 0 && tabIndex === moreTabIndex) {
                return;
            }

            const tab = overflow.length > 0 ? visible[tabIndex] : TabList[tabIndex];
            if (!tab) return;

            await handleTabPress({
                e,
                tab,
                tabIndex,
                currentUser,
                setCurrentUser,
                setBottomSheetData,
                pathname,
                router,
                variant: 'expo',
            });
        };

        const unsub = navigation.addListener('tabPress', onTabPress);
        return unsub;
    }, [
        navigation,
        pathname,
        router,
        tabKey,
        currentUser,
        setCurrentUser,
        setBottomSheetData,
    ]);

    return null;
}
