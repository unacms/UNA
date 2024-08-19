import { View, Row } from 'app/design/view';
import { BlockByName, DataByName } from 'app/components/block';
import { useState, useRef,useEffect, useCallback, useMemo } from 'react';
import { getBackButtonWeb } from 'app/lib/conductor-helpers';
import { useWindowDimensions } from 'react-native'
import { CommentsParts } from 'app/lib/comments-helpers'
import { fetcher } from 'app/lib/fetcher'
import { parseUrl, getDataFromCache, storageSet } from 'app/lib/util';

export default function PageLayout(props) {

    //console.log
    const sKey = 'page_' + props.data.url;
    //const dataCache = getDataFromCache('pg:data', sKey)

    const windowDimensions = useWindowDimensions();
    const [sizes, setSizes] = useState({ cntHeight: 0, listHeight: 100, formHeight: 0, formWidth: windowDimensions.width<1024?windowDimensions:1024 });
    const [pageData, setPageData ] = useState(props.data)//dataCache ? dataCache.data : 
    const viewFormRef = useRef();
    const viewCntRef = useRef();
   

    useEffect(() => {
        calculateSize();
    }, [windowDimensions]);

    useEffect(() => {
       //TODO!!!!!!!!!!!!!!!!!
        (async () => {
            //if (dataCache){
            const pagePath =  parseUrl(pageData.url);
            let sAdd = "";
            if (pagePath['queryString']){
                const b = pagePath['queryString'].split('&');
                const c ={};
                b.forEach((value, key) => {
                    const d = value.split('=')
                    c[d[0]] = d[1];
                });
                let e = JSON.stringify(c);
                sAdd = '&params[]=&params[]=' + e;

            }
            const sResponse = await fetcher('/api.php?r=system/get_page_by_request/TemplServicePages&params[]=' + pagePath.path +sAdd);

            if (sResponse.data != pageData){
                setPageData(sResponse.data);
                //console.log("dataCachedataCache")
               // storageSet('pg:data', sKey, { data: sResponse.data, ts: Date.now() });
               //
            }
       // }
        })();
       
    }, []);


    /*useEffect(() => {
        if(!dataCache || (dataCache && props.data != dataCache.data)){
            console.log("dataCachedataCache", dataCache, props.data != dataCache?.data)
            storageSet('pg:data', sKey, { data: pageData, ts: Date.now() });
        }
    }, [pageData]);*/

    const calculateSize = useCallback(() => {
        if (viewFormRef.current) {
            viewFormRef.current.measure((x, y, width, height, pageX, pageY) => {
                let FormH = height;
                let offset = 100;
                let otherH = windowDimensions.height;
                if (windowDimensions.width >= 1024) {
                    otherH = otherH - FormH - offset;
                }

                viewCntRef.current.measure((x, y, width, height, pageX, pageY) => {
                    setSizes({ formHeight: FormH, formWidth: width, otherHeight: otherH, cntHeight: height });
                });
            });
        }
    }, [windowDimensions]);

    const handleLayout = useCallback(() => {
        calculateSize();
    }, [calculateSize]);

    const windowWidth = windowDimensions.width + 24;

    const aItems = Object.entries(props.blocks).filter(([key, value]) => value.forList).map(([key, value]) => ({
        id: `block_${key}`,
        data: <BlockByName data={props.data} name={value} />
}));

    let actionsItemIndex = useMemo(() => aItems.findIndex(item => item.id === 'block_actions'), [aItems]);
    if (actionsItemIndex !== -1) {
        aItems[actionsItemIndex].data = (
            <View className=''>
                {aItems[actionsItemIndex].data}
            </View>
        );
    }

    let header = useMemo(() => {
        let headerComponent = <></>;
        actionsItemIndex = aItems.findIndex(item => item.id === 'block_author');
        if (actionsItemIndex !== -1) {
            if (windowDimensions.width < 1024) {
                headerComponent = (
                    <Row className='py-2 px-3 w-full items-center fixed top-0 z-50 border-b  bg-bgrnavbar dark:bg-bgrnavbar-d backdrop-blur border-bdrnavbar dark:border-bdrnavbar-d flex-row justify-start'>
                        {getBackButtonWeb()}
                        <View style={{ width: windowWidth - 92 }}>
                            {aItems[actionsItemIndex].data}
                        </View>
                    </Row>
                );
                aItems.splice(actionsItemIndex, 1);
            } else {
                aItems[actionsItemIndex].data = (
                    <View className=''>
                        {aItems[actionsItemIndex].data}
                    </View>
                );
            }
        }
        return headerComponent;
    }, [aItems, windowDimensions, windowWidth]);
    
    //const commentsData = useMemo(() => DataByName(props.data, props.blocks.comments), [props.data, props.blocks.comments]);
    const commentsData = DataByName(pageData, props.blocks.comments);
    //console.log("commentsData", commentsData)
    const CommentsPartsData = CommentsParts(commentsData?.content[0], aItems);

    return (
        <>
            {header}
            <View className=" py-0 lg:px-4 mt-14 lg:mt-4 flex-1">
                <View ref={viewCntRef} className="max-w-5xl overflow-hidden mx-auto h-full w-full border-bdrcard dark:border-bdrcard-d group duration-500  lg:rounded-2xl bg-bgrcard dark:bg-bgrcard-d">
                    <Row className='m-4' style={{ marginBottom: sizes.formHeight + 28 }}>
                        <View  className='w-full' >
                            {CommentsPartsData[0]}
                        </View>
                    </Row>
                    <View ref={viewFormRef} style={{ width: sizes.formWidth }} onLayout={handleLayout} className='px-3 bg-bgrcard dark:bg-bgrcard-d border-t border-bdr dark:border-bdr-d fixed bottom-0 w-full' >
                        {CommentsPartsData[1]} 
                    </View>
                </View>
            </View>
        </>
    )
}
