import { Conductor } from 'app/ui/molecules/conductor';
import { useState, useEffect, useMemo } from 'react';
import { appSetting, getBlocksFromData, cloneObject, getPageData } from 'app/lib/util';
import { useLayoutData } from 'app/context/layout';
import { processBlocks } from 'app/lib/conductor-helpers';
import { useIsDesktop } from 'app/context/measure';

export default function PageLayoutProfile({ layoutName, data, uri, blocks }) {
    const { layoutData } = useLayoutData();
    const [ pageData, setPageData ] = useState(data);
    const isDesktop = useIsDesktop();
    const isAltView = layoutName === 'profile-alt' && isDesktop;
    
    useEffect(() => {
        if (layoutData && layoutData?.type == 'сonnections:action' && layoutData?.data?.reload) {
            (async () => {
                if (layoutData?.data?.object?.initiator == pageData?.cover_block?.profile?.id || layoutData?.data?.object?.content == pageData?.cover_block?.profile?.id || !layoutData?.data?.object?.content){
                    const sResponse = await getPageData(pageData.url);
                    if (sResponse.data != pageData)
                        setPageData(sResponse.data);
                }
            })();
        }
    }, [layoutData?.data?.time]);

    if (!pageData.menu.items) {
        pageData.menu.items = [];
    }

    const menu = useMemo(() => {
        let clonedMenu = { items: [] }
        if (pageData.menu && pageData.menu.items.length > 0) {
            clonedMenu = cloneObject(pageData.menu)
        }
        const isNamePresent = clonedMenu.items.some(item => item.link === pageData.url);
        if (!isNamePresent) {
            clonedMenu.items.push({
                id: -1,
                name: uri,
                title: '',
                link: pageData.url,
                hideInTop: true
            });
        }

        return clonedMenu;
    }, [pageData.menu, uri, pageData.url]);

    const renderedBlocks = useMemo(() => {
        const initialBlocks = blocks || getBlocksFromData(pageData);
        return processBlocks(initialBlocks);
    }, [blocks, pageData]);

    if (!menu.config) {
        menu.title = '';
        menu.config = '{add:[]}';
    }
    const coverMode = appSetting('cover', 'view_by_module', pageData.cover_block.profile?.module)
    const isCoverDisabled = ((isDesktop || true) && isAltView) || coverMode == 'none';

    return (
        <Conductor
            layoutName={layoutName}

            isHideDefaultHeader={true}
            isCoverDisabled={isCoverDisabled}
            menu={menu}
            data={pageData}
            blocks={renderedBlocks.mainBlocks}
            leftSideBar={isAltView}
            leftSideBarWidth={isAltView ? ' lg:w-96' : ''}
            leftSideBarBlocks={renderedBlocks.leftBlocks}

        />
    )
}
