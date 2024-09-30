import { Conductor } from 'app/ui/molecules/conductor';
import { useState, useEffect, useMemo } from 'react';
import Cover, { CoverSmall } from 'app/components/elements/cover';
import { getHeaderSettings, getBlocksFromData, cloneObject, getPageData } from 'app/lib/util';
import { useWindowDimensions } from 'react-native';
import { useLayoutData } from 'app/context/layout';
import { processBlocks } from 'app/lib/conductor-helpers';

export default function PageLayout({layoutName, data, uri, blocks}) {
    const { width: windowWidth } = useWindowDimensions();
    const { layoutData } = useLayoutData();
    const [ pageData, setPageData ] = useState(data);
    const isAltView = layoutName === 'profile-alt';

    useEffect(() => {
        if (layoutData && layoutData?.type == 'сonnections:action' && layoutData?.data?.reload) {
            (async () => {
                const sResponse = await getPageData(pageData.url);
                if (sResponse.data != pageData)
                    setPageData(sResponse.data);
            })();

        }
    }, [layoutData?.data?.time]);

    if (!pageData.menu.items) {
        pageData.menu.items = [];
    }

    const menu = useMemo(() => {
        const clonedMenu = cloneObject(pageData.menu || { items: [] });

        const isNamePresent = clonedMenu.items.some(item => item.name === uri);
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

    const headerSettings = useMemo(() => getHeaderSettings(uri, windowWidth, 'profile'), [uri, windowWidth]);

    const header = useMemo(() => {
        if (windowWidth > 768 && isAltView) {
            return null;
        }
        return <Cover data={pageData.cover_block} mode={headerSettings.cover} uri={uri} />;
    }, [windowWidth, pageData.cover_block, headerSettings.cover, uri]);

    const smallHeader = useMemo(() => (windowWidth > 768 && isAltView ? null : <CoverSmall data={pageData.cover_block} />), [windowWidth, pageData.cover_block]);

    const renderedBlocks = useMemo(() => {
        const initialBlocks = blocks || getBlocksFromData(pageData);
        return processBlocks(initialBlocks);
    }, [blocks, pageData]);

    return (
        <Conductor
            layoutName={layoutName}
            header={header}
            smallHeader={smallHeader}
            minHeaderHeight={60}
            offsetTop={300}
            isHideDefaultHeader={true}
            menu={menu}
            data={pageData}
            blocks={renderedBlocks.mainBlocks}
            cover={headerSettings.cover}
            leftSideBar={isAltView}
            leftSideBarWidth={isAltView  ? 'w-96' : ''}
            leftSideBarBlocks={isAltView? renderedBlocks.leftBlocks: null}

        />
    )
}
