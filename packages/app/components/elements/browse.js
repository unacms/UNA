import Unit from 'app/components/unit';
import { useState, useCallback, useEffect, useRef, useContext, memo } from 'react';
import { View } from 'app/design/view'
import { useWindowDimensions } from 'react-native';
import { Platform } from 'react-native'
import UniList from 'app/ui/atoms/unilist'
import { fetcher } from 'app/lib/fetcher';
import { appSetting, storageKey, getDataFromCache, storageSet, handleFeedLayoutData, cloneObject } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { useInfiniteQuery} from '@tanstack/react-query'
import { getSkeletonForList } from 'app/lib/skeleton-helpers';
import { useTranslation } from 'react-i18next';
import useDaemon from 'app/lib/hooks/daemon'
import Toaster from 'app/ui/atoms/toaster';
import { storageClear } from 'app/lib/util';
import { useLayoutData } from 'app/context/layout';

const Item = memo(({ item, index, numColumns, data, unitMode, props }) => (
    <View className={numColumns > 1 ? 'w-full pb-2 ' : '  ' + (data.unit != 'feed' ? '   w-full' : '  ') + '  '}>
        <Unit
            unit={data.unit ? data.unit : ''}
            mode={unitMode}
            module={data.module ? data.module : ''}
            sidebar={props.sidebar}
            object_id={data.object_id ? data.object_id : ''}
            view={data.view ? data.view : ''}
            {...props}
            data={item}
        />
    </View>
));

const getNumCols = (width, props, data) => {
    if (props.perLine)
        return props.perLine;

    if (data.unit.startsWith('general-') || data.unit.startsWith('search-')) {
        return width > 600 ? 4 : 1
    }
    return 1
};

export default function (props) {
    const { layoutData } = useLayoutData();
    const toasterRef2 = useRef();
    const { t } = useTranslation();
    let uniRef = useRef();

    let storageKeyValue = storageKey(props.uri + ':' + props.data.request_url + ':' + props.data.params?.type + ':' + props.data.params?.category)
    //const [cachedData, setCachedData] = useState(props.cachePrefix ? false : { state: getDataFromCache('ul:state', storageKeyValue), data: getDataFromCache('ul:data', storageKeyValue) });
    const cachedData =  { state: getDataFromCache('ul:state', storageKeyValue), data: getDataFromCache('ul:data', storageKeyValue) };
    let data = props.data;
    if (data.unit == 'mixed') {
        data.unit = 'general-profile-list';
    }

    let defParams = data.params;

    if (props?.params)
        defParams = { ...defParams, ...props.params };

    if (defParams)
        defParams.moduleName = data.module ? data.module : '';
    const browseParams = defParams;

    const [dataItems, setDataItems] = useState({ data: (appSetting('cache', 'list') && cachedData?.data ? cachedData.data : []), params: browseParams });
    /* unit mode & change unit mode */
    const unitMode = props.unitMode ? props.unitMode : appSetting('feed', 'default_view');

    const windowWidth = useWindowDimensions().width;
    const windowHeight = useWindowDimensions().height;
    const [numColumns, setNumColumns] = useState(getNumCols(windowWidth, props, data));

    const handleLayout = (event) => {
        const containerWidth = event.nativeEvent.layout.width;
        const numColumnsNew = getNumCols(containerWidth, props, data);
        if (numColumnsNew != numColumns) {
            setNumColumns(numColumnsNew);
        }
    };

    const hOffset = Platform.OS === 'web' ? (windowWidth < 1024 ? 126 : 64) : 106;
    const styles = Platform.OS === 'web' ? {} : { height: (defParams?.height ? defParams.height : windowHeight - hOffset) }

    const fetchData = useCallback(async ({ }) => {
        return (await fetcher(data.request_url + JSON.stringify({ 'params': dataItems.params }))).data[0].data;
    }, [dataItems.params]);

    const queryClientKey = [data.request_url + browseParams?.type + defParams?.category + props?.cachePrefix];
    const {
        status,
        data: newData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
    } = useInfiniteQuery(queryClientKey, fetchData, {
        getNextPageParam: lastPage => {
            if (lastPage.data.length == 0)
                return;
            if (props?.maxItems && lastPage.data.length >= props?.maxItems)
                return;

            return lastPage.params;
        },
        enabled: Platform.OS === 'web' ? false : false, // on native no cashed data
    });

    const handleEndReached = useCallback((lastItemIndex) => {
        if (!hasNextPage)
            return;
        if (props.only_one_page == true)
            return;
        if (isFetchingNextPage)
            return;
        if (lastItemIndex == false)
            return;

        fetchNextPage();
    }, [hasNextPage, props.only_one_page, isFetchingNextPage]);

    const getCurrentParams = (isUseDefault = false) => {
        if (newData?.pages.length > 0) {
            let ld = newData.pages[newData.pages.length - 1].params;
            let params = Object.assign({}, browseParams, ld)
            if (data.unit != 'notifications')
                params.start = parseInt(ld.start) + parseInt(ld.per_page);
            if (isUseDefault) {
                params.start = 0;
            }

            return params;
        }
        return browseParams;
    }

    let sSkeleton = data.module ? data.module : data.unit
    if (props?.skeleton)
        sSkeleton = props?.skeleton;

    if (props.unitType)
        sSkeleton = [sSkeleton, props.unitType];
    const Preload = getSkeletonForList(sSkeleton, numColumns)

    useEffect(() => {
        if (newData?.pages) {
            setDataItems({
                data: [
                    ...dataItems.data,
                    ...(newData?.pages ? newData.pages.map(page => page.data).flat() : [])
                ], params: getCurrentParams()
            })
        }
    }, [newData?.pages]);

    /* UPDATE CONTENT PART */

    const setToaster2Visible = (val) => {
        const current = toasterRef2.current;
        if (current) {
            current.setVisible(val);
        }
    }

    let endpointUpdateContent = '';
    let bUpdateContent = false;

    if (dataItems.data.length > 0 && props.sidebar !== true && props.no_scroll !== true) {

        const a = [...new Set(dataItems.data
            .filter(item => item.type !== 'block')
            .map(item => item.id)
        )].slice(0, 10).join(',');
        if (a) {
            endpointUpdateContent = data.request_url + JSON.stringify({
                'params': { ...getCurrentParams(), validate: a }
            });
            bUpdateContent = true;
        }
    }
    const { daemonData, daemonUrl } = useDaemon(endpointUpdateContent, true, bUpdateContent, 10000);

    useEffect(() => {
        if (daemonUrl == endpointUpdateContent) {
            const data = daemonData?.[0]?.data?.data;
            if (data && (data == 'valid' || data == 'invalid')) {
                setToaster2Visible(data !== 'valid');
            }
        }
    }, [daemonData, daemonUrl]);

    const showNewContent2 = async () => {
        storageClear('ul:data', storageKeyValue)
        storageClear('ul:state', storageKeyValue);
        setDataItems({ data: [], params: browseParams });

        setToaster2Visible(false);
    }
    /* UPDATE CONTENT PART */

    /* NEW POST TO FEED */
    useEffect(() => {
        if (data.unit === 'feed' && layoutData && layoutData.data && (layoutData?.type == 'feed:new_content' || layoutData?.type == 'feed:remove_content')) {
            let clonedData = cloneObject(dataItems.data);
            const data2 = handleFeedLayoutData(layoutData, clonedData)
            setDataItems({ data: data2, params: dataItems.params });
        }
    }, [layoutData]);
    /* NEW POST TO FEED */

    useEffect(() => {
        
        if (dataItems.data.length > 0) {
            storageSet('ul:data', storageKeyValue, dataItems.data);
        }
    }, [dataItems.data]);

    useEffect(() => {
        if (dataItems.data.length == 0 && dataItems.params == browseParams)
            refetch();
    }, [storageKeyValue, dataItems.params, props.cachePrefix]);

    if ( dataItems.data.length == 0 && ((dataItems?.params?.start === 0 && (!props.only_one_page &&  data.unit!='notifications') ) || status === 'loading'))
        return <>{Preload}</>

    if (dataItems.data.length == 0 && status === 'success' && data.unit == 'notifications' && dataItems?.params?.start > 0){
        return <View className="p-8">
            <View className="flex-col gap-y-2 items-center opacity-80 justify-center  mx-auto my-auto mb-auto py-4 px-8 h-full items-center rounded-2xl  bg-neutral-500/10 ">
                <Text className="text-center text-base text-neutral-600 dark:text-neutral-400 ">
                No notifications
                </Text>
            </View>
        </View>
    }

    if (props.sidebar) {
        return dataItems.data.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i).map((item, index) => (
            <View key={'item' + index} className={numColumns > 1 ? 'w-full pb-2 ' : '  ' + (data.unit != 'feed' ? '   w-full' : '  ') + '  '}><Unit unit={data.unit ? data.unit : ''} mode={unitMode} module={data.module ? data.module : ''} sidebar={props.sidebar} object_id={data.object_id ? data.object_id : ''} view={data.view ? data.view : ''}  {...props} data={item} /></View>
        ));
    }

    return (
        <View className='w-full h-full' >
            <View className='w-full' onLayout={handleLayout}></View>
            <Toaster ref={toasterRef2} onPress={showNewContent2} variant="primary" title="New content" size="sm" />
            <View className='w-full ' style={styles} >
                {dataItems.data.length > 0 ? <>{props.showTitleInside ? <View className='p-3'><Text className="text-lg font-bold text-neutral-800 dark:text-neutral-200 ">{t(props.block.title)}</Text></View> : <></>}
                    <UniList
                        numColumns={numColumns}
                        data={dataItems.data}
                        viewParams={getCurrentParams()}
                        listState={cachedData?.state?.state}
                        unit={data.unit}
                        storagekey={storageKeyValue}
                        useWindowScroll
                        height={props?.height}
                        url={props?.url}
                        contentContainerStyle={props?.contentContainerStyle}
                        refer={uniRef}
                        no_scroll={props.no_scroll}
                        renderItem={({ item, index }) => <Item  item={item} index={index} numColumns={numColumns} data={data} unitMode={unitMode} props={props} />}
                        onEndReached={handleEndReached}
                        ListFooterComponent={
                            ((hasNextPage && isFetchingNextPage)) ? (
                                Preload
                            ) : null
                        }
                    /></> : <></>}
            </View>
        </View>
    );

}

