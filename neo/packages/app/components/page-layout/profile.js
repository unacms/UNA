import { Conductor } from 'app/ui/molecules/sections/conductor';
import { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { appSetting, getBlocksFromData, getPageData, isWeb } from 'app/lib/util';
import { useScreenTier } from 'app/context/measure';
import { isPageCoverHiddenOn } from 'app/lib/page-cover';
import { useFocusEffect, useIsFocused } from 'app/lib/hooks/router'
import { useCurrentUser } from 'app/context/user';
import { subscribe } from 'app/ui/atoms/socket';
import { patchCachedPageDataByUrl } from 'app/lib/cache/native-tab-page-cache';
import emitter, { EVENTS } from 'app/context/emitter';
import { CONNECTION_PATCHED } from 'app/lib/connection-cache';

const ConductorMemo = memo(Conductor, (prev, next) => (
    prev.ts === next.ts && prev.data?.timestamp === next.data?.timestamp
    && prev.isCoverDisabled === next.isCoverDisabled
));

export default function PageLayoutProfile({ layoutName, data, uri, blocks }) {
    const [pageData, setPageData] = useState(data);
    const { currentUser, setCurrentUser } = useCurrentUser();

    const adoptPageData = useCallback((next) => {
        if (!next) return;
        const stamped = {
            ...next,
            timestamp: Date.now(),
        };
        setPageData(stamped);
        patchCachedPageDataByUrl(
            stamped.url,
            stamped,
            currentUser?.id,
            currentUser?.confirmed,
        );
    }, [currentUser?.id, currentUser?.confirmed]);

    // The informer strip (layout.web.js, conductor/native-ui.js) shows the viewer's informers: a refreshed profile
    // ("This group is pending approval." after a status change) brings its own, which replace them. Only while this
    // page is the one on screen: the apps keep a profile mounted in a tab the viewer left.
    const refreshedInformer = pageData?.user?.informer;
    const isFocused = useIsFocused();
    useEffect(() => {
        if (!isFocused || !currentUser || !Array.isArray(refreshedInformer)) return;
        if (JSON.stringify(refreshedInformer) !== JSON.stringify(currentUser.informer || []))
            setCurrentUser({ informer: refreshedInformer });
    }, [refreshedInformer, isFocused]); // eslint-disable-line react-hooks/exhaustive-deps

    // When the current page was refetched after a connection change, apply it here.
    useEffect(() => {
        const pageUrl = pageData?.url;
        const subscription = emitter.addListener(EVENTS.page, (payload) => {
            if (payload?.action !== 'updated' || !payload.data) return;
            const nextUrl = payload.data.url;
            if (pageUrl && nextUrl) {
                const a = String(pageUrl).replace(/^\/+/, '');
                const b = String(nextUrl).replace(/^\/+/, '');
                if (a !== b) return;
            }
            adoptPageData(payload.data);
        });
        return () => subscription.remove();
    }, [pageData?.url, adoptPageData]);

    // The viewer followed, befriended or left this profile: its cover (the counts, their avatars and the actions)
    // is asked for again on its own, without the page's blocks (`blocks: 'none'`), and replaces the one shown.
    // With sockets on, UNA's connection event reloads the whole page as well (above); this needs none.
    useEffect(() => {
        const profileId = pageData?.cover_block?.profile?.id;
        const pageUrl = pageData?.url;
        if (!profileId || !pageUrl) return;

        let active = true;
        const subscription = emitter.addListener(EVENTS.connections, async (payload) => {
            if (payload?.action !== CONNECTION_PATCHED || String(payload.profileId) !== String(profileId)) return;
            const response = await getPageData(pageUrl, false, {}, 'none');
            const cover = response?.data?.cover_block;
            if (!active || !cover || String(cover.profile?.id) !== String(profileId)) return;
            setPageData((current) => (
                String(current?.cover_block?.profile?.id) === String(profileId)
                    ? { ...current, cover_block: cover, timestamp: Date.now() }
                    : current
            ));
        });
        return () => {
            active = false;
            subscription.remove();
        };
    }, [pageData?.cover_block?.profile?.id, pageData?.url]);

    // Soft-reload profile/group page when UNA pushes profile_{id} / changed
    // (e.g. after entity edit). Do not touch currentUser — payload is the entity.
    useEffect(() => {
        const profileId = pageData?.cover_block?.profile?.id;
        const pageUrl = pageData?.url;
        if (!profileId || !pageUrl) return;

        return subscribe('profile_' + profileId, 'changed', async () => {
            const sResponse = await getPageData(pageUrl);
            if (sResponse?.data) {
                adoptPageData(sResponse.data);
            }
        });
    }, [pageData?.cover_block?.profile?.id, pageData?.url, adoptPageData]);

    // Adopt shell revalidate (expo-screen stale-while-revalidate bumps timestamp).
    useEffect(() => {
        if (pageData?.ts !== data?.ts || pageData?.timestamp !== data?.timestamp) {
            setPageData(data);
        }
    }, [data?.ts, data?.timestamp]);

    useFocusEffect(
        useCallback(() => {
            (async () => {
                if (currentUser?.current_context && currentUser?.current_context != pageData?.user?.current_context) {
                    const sResponse = await getPageData(pageData.url);
                    if (sResponse.data != pageData) {
                        adoptPageData(sResponse.data);
                    }
                }
            })();
        }, [currentUser?.current_context, adoptPageData])
    );

    if (!pageData.menu.items) {
        pageData.menu.items = [];
    }

    const menu = useMemo(() => {
        const items = pageData.menu?.items ?? [];
        const hasCurrent = items.some((item) => item.link === pageData.url);
        return {
            ...pageData.menu,
            title: pageData.menu?.title ?? '',
            config: pageData.menu?.config ?? '{add:[]}',
            items: hasCurrent
                ? items
                : [...items, { id: 'hidden', name: uri, title: '', link: pageData.url }],
        };
    }, [pageData.ts, pageData.timestamp, uri, pageData.url]);

    // No cover where the app's settings turn it off, or where Studio hides the page's cover on this
    // screen size or in the mobile app ("Cover hidden on"), as UNA does.
    const screenTier = useScreenTier();
    const isCoverDisabled = appSetting('cover', 'view_by_module', pageData.cover_block.profile?.module) == 'none'
        || isPageCoverHiddenOn(pageData.cover_hidden_on, screenTier, !isWeb);

    return (
        <ConductorMemo
            layoutName={layoutName}
            ts={pageData.ts}
            isHideDefaultHeader={true}
            isCoverDisabled={isCoverDisabled}
            menu={menu}
            data={pageData}
            blocks={blocks || getBlocksFromData(pageData)}
        />
    )
}
