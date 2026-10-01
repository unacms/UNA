import { Conductor } from 'app/ui/molecules/sections/conductor';
import { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { appSetting, getBlocksFromData, getPageData } from 'app/lib/util';
import { useFocusEffect } from 'app/lib/hooks/router'
import { useCurrentUser } from 'app/context/user';
import { subscribe } from 'app/ui/atoms/socket';
import { patchCachedPageDataByUrl } from 'app/lib/cache/native-tab-page-cache';
import emitter, { EVENTS } from 'app/context/emitter';

const ConductorMemo = memo(Conductor, (prev, next) => (
    prev.ts === next.ts && prev.data?.timestamp === next.data?.timestamp
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

    const isCoverDisabled = appSetting('cover', 'view_by_module', pageData.cover_block.profile?.module) == 'none';

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
