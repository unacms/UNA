import { Conductor } from 'app/ui/molecules/conductor';
import { useContext, useState, useEffect } from 'react';
import Cover, { CoverSmall } from 'app/components/elements/cover';
import { getHeaderSettings, getBlocksFromData, cloneObject } from 'app/lib/util';
import { useWindowDimensions } from 'react-native';
import { useLayoutData } from 'app/context/layout';
import { fetcher } from 'app/lib/fetcher';
import { BlockByName } from 'app/components/block';
import { processBlocks } from 'app/lib/conductor-helpers';

export default function PageLayout(props) {
    const windowDimen = useWindowDimensions();
    const { layoutData } = useLayoutData();
    const [pageData, setPageData] = useState(props.data);
    let ts = 0;

    useEffect(() => {
        if (layoutData && layoutData?.type == 'сonnections:action') {
            (async () => {
                const sResponse = await fetcher('/api.php?r=system/get_page_by_request/TemplServicePages&params[]=' + pageData.url);
                if (sResponse.data != pageData)
                    setPageData(sResponse.data);
            })();

        }
    }, [layoutData?.data?.time]);

    if (!props.data.menu.items) {
        props.data.menu.items = [];
    }
    let menu = cloneObject(props.data.menu);
    let blocks = props.blocks;

    if (!menu.items)
        menu.items = [];

    const isNamePresent = menu.items.some(item => item.name === props.uri);
    const isNamePresent2 = props.data.menu.items.some(item => item.name === props.uri);

    if (!isNamePresent) {
        menu.items.push({ id: -1, name: props.uri, title: '', link: props.data.url, hideInTop: true });
    }

    const windowWidth = windowDimen.width;
    let headerSettings = getHeaderSettings(props.uri, windowWidth, 'profile');
    let cover = headerSettings.cover;

    let header = <Cover data={props.data.cover_block} mode={cover} uri={props.uri} />
    let smallHeader = <CoverSmall data={props.data.cover_block} />
    const leftSideBar = true

    if (!blocks) {
        blocks = getBlocksFromData(props.data)
    }
    blocks = processBlocks(blocks);

    if (windowDimen.width > 768) {
        header = <></>;
        smallHeader = null;
    }

    return (
        <Conductor
            layoutName={props.layoutName}
            header={header}
            smallHeader={smallHeader}
            minHeaderHeight={104}
            offsetTop={300}
            isHideDefaultHeader={true}
            menu={menu}
            data={pageData}
            blocks={blocks.mainBlocks}
            cover={cover}
            ts={ts}
            leftSideBar={leftSideBar}
            leftSideBarWidth='w-96'
            leftSideBarBlocks={blocks.leftBlocks}

        />
    )

}
