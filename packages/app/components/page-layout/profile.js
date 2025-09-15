import { Conductor } from 'app/ui/molecules/conductor';
import { useState, useEffect, useMemo, memo } from 'react';
import { appSetting, getBlocksFromData, cloneObject, getPageData } from 'app/lib/util';
import { useLayoutData } from 'app/context/layout';
import { processBlocks } from 'app/lib/conductor-helpers';

const ConductorMemo = memo(Conductor, (prev, next) => prev.ts === next.ts);

export default function PageLayoutProfile({ layoutName, data, uri, blocks }) {
    const { layoutData } = useLayoutData();
    const [pageData, setPageData] = useState(data);

    useEffect(() => {
        if (layoutData && layoutData?.type == 'сonnections:action' && layoutData?.data?.reload) {
            (async () => {
                if (layoutData?.data?.object?.initiator == pageData?.cover_block?.profile?.id || layoutData?.data?.object?.content == pageData?.cover_block?.profile?.id || !layoutData?.data?.object?.content) {
                    const sResponse = await getPageData(pageData.url);
                    if (sResponse.data != pageData) {

                        setPageData(sResponse.data);
                    }
                }
            })();
        }
    }, [layoutData?.data?.time]);

    useEffect(() => {
        if (pageData?.ts !== data?.ts) setPageData(data);
    }, [data?.ts]);

    if (!pageData.menu.items) {
        pageData.menu.items = [];
    }

    const menu = useMemo(() => {
        const base = pageData.menu?.items?.length ? cloneObject(pageData.menu) : { items: [] };
        const isNamePresent = base.items.some(item => item.link === pageData.url);
        if (!isNamePresent) {
            base.items.push({ id: -1, name: uri, title: '', link: pageData.url, hideInTop: true });
        }
        if (!base.config) {
            base.title = base.title ?? '';
            base.config = '{add:[]}';
        }
        return base;

    }, [pageData.ts, uri, pageData.url]);

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
