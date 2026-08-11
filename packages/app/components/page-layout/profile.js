import { Conductor } from 'app/ui/molecules/sections/conductor';
import { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { appSetting, getBlocksFromData, cloneObject, getPageData } from 'app/lib/util';
import { useLayoutData } from 'app/context/layout';
import { useRouter, redirectTo, useFocusEffect } from 'app/lib/hooks/router'
import { useCurrentUser } from 'app/context/user';
import { subscribe } from 'app/ui/atoms/socket';
import { patchCachedPageDataByUrl } from 'app/lib/tab-page-cache';
const ConductorMemo = memo(Conductor, (prev, next) => (
    prev.ts === next.ts && prev.data?.timestamp === next.data?.timestamp
));

export default function PageLayoutProfile({ layoutName, data, uri, blocks }) {
    const { layoutData, setLayoutData } = useLayoutData();
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

    const router = useRouter();
    useEffect(() => {
        if (!layoutData || layoutData?.type != 'connections:action') return;

        // Leave/redirect: navigate away without soft-reloading the current group page first.
        if (layoutData?.data?.data?.redirect) {
            setLayoutData(null);
            redirectTo(router, layoutData.data.data.redirect);
            return;
        }

        if (layoutData?.data?.reload) {
            (async () => {
                if (layoutData?.data?.object?.initiator == pageData?.cover_block?.profile?.id || layoutData?.data?.object?.content == pageData?.cover_block?.profile?.id || !layoutData?.data?.object?.content) {
                    setLayoutData(null);
                    const sResponse = await getPageData(pageData.url);
                    if (sResponse.data != pageData) {
                        adoptPageData(sResponse.data);
                    }
                }
            })();
        }
    }, [layoutData?.data?.time]);

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
        const base = pageData.menu?.items?.length ? cloneObject(pageData.menu) : { items: [] };
        const isNamePresent = base.items.some(item => item.link === pageData.url);
        if (!isNamePresent) {
            base.items.push({ id: 'hidden', name: uri, title: '', link: pageData.url });
        }
        if (!base.config) {
            base.title = base.title ?? '';
            base.config = '{add:[]}';
        }
        return base;

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
