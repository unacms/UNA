import Unit from 'app/components/unit';
import { useState,useEffect, useRef, useContext   } from 'react';
import { View } from 'app/design/view'
import { useWindowDimensions} from 'react-native';
import { Platform } from 'react-native'
import UniList from 'app/ui/atoms/unilist'
import { fetcher } from 'app/lib/fetcher';
import { appSetting, storageKey, storageGet, getDataFromCache,storageSet } from 'app/lib/util'
import { Dimensions } from 'react-native';
import { Text } from 'app/design/typography'
import { useInfiniteQuery, useQueryClient, QueryClient  } from  '@tanstack/react-query'
import { getSkeleton } from 'app/lib/skeleton-helpers';
import { useTranslation } from 'react-i18next';
import useDaemon from 'app/lib/hooks/daemon'
import Toster from 'app/ui/atoms/toster';
import  { LayoutData } from 'app/context/layout';

export default function ElementBrowse(props) {
    const { layoutData, setLayoutData } = useContext(LayoutData);
    const [maxId, setMaxId] = useState(0);
    const tosterRef = useRef();
    const { t } = useTranslation();
    let storageKeyValue = storageKey(props.uri + ':' + props.data.request_url + ':' +  props.data.params?.type + ':' +  props.data.params?.category)
    let uniRef = useRef();

    const [cachedData, setCachedData] = useState({state: getDataFromCache('ul:state', storageKeyValue), data: getDataFromCache('ul:data', storageKeyValue)});
    
    let data = props.data;
    if (data.unit == 'mixed'){
        data.unit = 'general-profile-list';
    }

    let defParams = data.params;

    if(props?.params)
        defParams = {...defParams, ...props.params};

    if (defParams)
        defParams.moduleName = data.module ? data.module : '';
    //const [browseParams, setbrowseParams] = useState(defParams);
    const browseParams = defParams;
    /* unit mode & change unit mode */
    const unitMode = props.unitMode ? props.unitMode: appSetting('feed', 'default_view');

    const getNumCols = (width) => {
        if (props.perLine)
            return props.perLine;
        
        if (data.unit.startsWith('general-') || data.unit.startsWith('search-')){
            return width > 600 ? 4 : 1
        }
        return 1
    };

    const windowWidth = useWindowDimensions().width;
    const windowHeight = Dimensions.get('window').height;
    const [numColumns, setNumColumns] = useState(getNumCols(windowWidth));
   
    const handleLayout = (event) => {
        const containerWidth = event.nativeEvent.layout.width;
        if (getNumCols(containerWidth) != numColumns)
            setNumColumns(getNumCols(containerWidth));
    };

    let hOffset = 0;

    if(Platform.OS === 'web') {
        if (Dimensions.get('window').width < 1024){
            hOffset = 126;
        }
        else{
            hOffset = 64;
        }
    }
    else{
        hOffset = 106;
    }

    let styles = Platform.OS === 'web' ? {} : {height: (defParams?.height ? defParams.height : windowHeight - hOffset)}

    const fetchData = async ({ }) => {
        let sResponse =  await fetcher(prepareUrl());
        return sResponse.data[0].data
    };

    const {
        status,
        data: newData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
    } = useInfiniteQuery([data.request_url + browseParams?.type + defParams?.category], fetchData, {
        getNextPageParam: lastPage => {
            if (lastPage.data.length == 0)
                return;
            if (props?.maxItems && lastPage.data.length >= props?.maxItems)
                return;

            return lastPage.params;
        },
        enabled: Platform.OS === 'web' ? false : false, // on native no cashed data
    });
   
    function prepareUrl (isUseDefault = false) {
        const params = getCurrentParams(isUseDefault);
        return data.request_url + JSON.stringify({'params': params});
    } 

    const getCurrentParams = (isUseDefault = false) => { 
        if (newData?.pages.length > 0){
            let ld = newData.pages[newData.pages.length - 1].params;
            let params = Object.assign({}, browseParams, ld)
            if (data.unit != 'notifications') 
                params.start = parseInt(ld.start) + parseInt(ld.per_page);
            if (isUseDefault){
                params.start = 0;
            }

            return params;
        }
        return browseParams;
    }

    const handleEndReached = (lastItemIndex) => { 

        if(props.only_one_page == true)
            return;
        
        if (isFetchingNextPage) 
            return;
        if (lastItemIndex == false)
            return;

        fetchNextPage();
    };
    let sSkeleton = data.module? data.module : data.unit
    if (props?.skeleton)
        sSkeleton = props?.skeleton;
    const Preload = getSkeleton(sSkeleton, numColumns)
    
    let dataItems = {
        data: [
            ...(appSetting('cache', 'list') && cachedData?.data?.data ? cachedData.data?.data: []),
            ...(newData?.pages ? newData.pages.map(page => page.data).flat() : [])
        ]
    };

    /* DAEMON PART */
    const setTosterVisible = (val) => {
        const current = tosterRef.current;
        if (current) {
            current.setVisible(val);
        }
    }
    
    let maxIdLocal = 0;
    const bUseDaemon =  (props.data.unit == 'feed');
    const { daemonData, error } = useDaemon('/api.php?r=bx_timeline/get_live_update&params[]='+JSON.stringify({'params': getCurrentParams(true)})+'&params[]=0&params[]=0', false, bUseDaemon);
    if (bUseDaemon){
        maxIdLocal = dataItems?.data.length > 0 
            ? dataItems?.data.reduce((max, item) => {
                const idNumber = parseFloat(item.id);
                return (typeof idNumber === 'number' && Number.isFinite(idNumber) && idNumber > max) ? idNumber : max;
            }, parseFloat(dataItems?.data[0].id) || 0)
            : 0;
        console.log("maxIdmaxId", daemonData, maxId)
        if (daemonData && maxId > 0 && maxId < daemonData){
            setTimeout(() => {
                setTosterVisible(true);
            }, 100);
           
        }
    }

    useEffect(() => {
        if (maxIdLocal >0 && maxIdLocal != maxId){
           setMaxId(maxIdLocal)
        }
      }, [maxIdLocal]);
   

    const showNewContent = async () => {
        setTosterVisible(false); 
        let sResponse =  await fetcher(prepareUrl(true));
        maxIdLocal = sResponse.data[0].data.data.length > 0 ? sResponse.data[0].data.data.reduce((max, item) => item.id > max ? item.id : max, sResponse.data[0].data.data[0].id) : 0;
        setLayoutData(sResponse.data[0].data.data);
        setMaxId(maxIdLocal);
        uniRef.current.scrollToIndex({ animated: true, index: -1 });
   
    }
    /* DAEMON PART */

    useEffect(() => {
        if (dataItems.data.length > 0){
            storageSet('ul:data', storageKeyValue, dataItems);
        }
    },[dataItems]);

    useEffect(() => {
        if (dataItems.data.length == 0)
            refetch();
    }, [storageKeyValue]);
    if (status === 'loading' && dataItems.data.length == 0)
        return Preload 

    if (props.sidebar){
        return dataItems.data.map((item, index) => (
            <View key={'item' + index} className={numColumns > 1 ? 'w-full pb-2 ' : '  ' + (data.unit != 'feed' ? '   w-full': '  ') + '  '}><Unit  unit={data.unit ? data.unit : ''} mode={unitMode} module={data.module ? data.module : ''} sidebar={props.sidebar} object_id={data.object_id ? data.object_id : ''} view={data.view ? data.view : ''}  {...props} data={item}  /></View>
        ));
    }

    return (
        <View className='w-full h-full' >
            <Toster ref={tosterRef} onPress={showNewContent} variant="primary" title="New content" size="sm" />
            { <View className='w-full ' onLayout={handleLayout}  style = {styles}>
            {dataItems.data.length > 0 ? <>{props.showTitleInside ? <View className='p-3'><Text className="text-lg font-bold text-neutral-800 dark:text-neutral-200 ">{t(props.block.title)}</Text></View> : <></>}
            
            <UniList 
            
                    numColumns={numColumns} 
                    data={dataItems.data}
                    viewParams={getCurrentParams()}
                    listState = {cachedData?.state?.state}
                    unit={data.unit}
                    storagekey={storageKeyValue}
                    useWindowScroll
                    height={props?.height}
                    contentContainerStyle={props?.contentContainerStyle}
                    refer={uniRef}
                    no_scroll={props.no_scroll}
                    renderItem={({item, index}) => <View key={'item' + item.id} className={numColumns > 1 ? 'w-full pb-2 ' : '  ' + (data.unit != 'feed' ? '   w-full': '  ') + '  '}><Unit  unit={data.unit ? data.unit : ''} mode={unitMode} module={data.module ? data.module : ''} sidebar={props.sidebar} object_id={data.object_id ? data.object_id : ''} view={data.view ? data.view : ''}  {...props} data={item}  /></View>}
                    onEndReached = {handleEndReached} 
                    ListFooterComponent={
                        ((hasNextPage && isFetchingNextPage) ) ? (
                            Preload
                        ) : null
                    }
                /></> : <></>}
            </View>
            }
        </View> 
    );


}

