import Unit from '../unit';
import { useState,useEffect, useRef, useMemo  } from 'react';
import { View } from 'app/design/view'
import { useWindowDimensions} from 'react-native';
import { Platform } from 'react-native'
import UniList from 'app/ui/atoms/unilist'
import { fetcher } from '../../lib/fetcher';
import { appSetting, storageKey, storageGet, getDataFromCache } from 'app/lib/util'
import { Dimensions } from 'react-native';

import { useInfiniteQuery } from  '@tanstack/react-query'
import { getSkeleton } from 'app/lib/skeleton-helpers';

export default function ElementBrowse(props) {
    let storageKeyValue = storageKey(props.data.request_url + props.data.params?.type)

    const isFirstMount = useRef(true);
    let uniRef = useRef();

    useEffect(() => {
        if (isFirstMount.current)
            isFirstMount.current = false;
    });

    const cachedData = useMemo(() => getDataFromCache(storageKeyValue), []);
    
    let data = props.data;
    if (data.unit == 'mixed'){
        data.unit = 'general-profile-list';
    }
    let defParams = data.params;

    if(props?.params)
        defParams = {...defParams, ...props.params};

    if (defParams)
        defParams.moduleName = data.module ? data.module : '';

    /* unit mode & change unit mode */
    const unitMode = props.unitMode ? props.unitMode: appSetting('feed', 'default_view');
    

    if (isFirstMount?.current){
        if (appSetting('cache', 'list')){
            //let defParams1 = storageGet('ul', storageKeyValue);
        
            if (/*defParams1*/cachedData){
                defParams = cachedData.viewParams;
                data.data = cachedData.data;
            }
        }
    }

  
    const [browseParams, setbrowseParams] = useState(defParams);
   
    const getNumCols = (width) => {
        if (data.unit.startsWith('general-') || data.unit.startsWith('search-')){
            return width > 600 ? 3 : 1
        }
        return 1
    };

    const windowWidth = useWindowDimensions().width;
    const windowHeight = Dimensions.get('window').height;
    const [dataItems, setDataItems] = useState({data: data.data, enable:true}); 
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
        upadteDataItems(sResponse.data[0].data.data)
        return sResponse.data[0].data
    };

    const upadteDataItems = (data) => { 
        setDataItems({data: [...dataItems.data, ...data], enable:false})
    };

    const {
        status,
        data: newData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery([data.request_url + browseParams?.type], fetchData, {
        getNextPageParam: lastPage => {
            if (lastPage.data.length == 0)
                return;
            return lastPage.params;
        },
        enabled: dataItems.enable,
    });

    function prepareUrl () {
        return data.request_url + JSON.stringify({'params': getCurrentParams()});
    } 

    const getCurrentParams = () => { 
        if (newData?.pages.length > 0){
            let ld = newData.pages[newData.pages.length - 1].params;
            let params = Object.assign({}, browseParams, ld)
            if (data.unit != 'notifications') 
                params.start = parseInt(ld.start) + parseInt(ld.per_page);
            return params;
        }
        return browseParams;
    }

    const handleEndReached = () => { 
        if (isFetchingNextPage) 
            return;
        fetchNextPage();
    };
    let sSkeleton = data.module? data.module : data.unit
    if (props?.skeleton)
        sSkeleton = props?.skeleton;
    const Preload = getSkeleton(sSkeleton, 'browse')
    
    if (status === 'loading' && dataItems.length == 0)
        return Preload 

    return (
        (data.data.length > 0 || true) && <View className='w-full h-full' >
            { <View className='w-full ' onLayout={handleLayout}  style = {styles}>
            {dataItems.data.length > 0 ? <UniList 
                    numColumns={numColumns} 
                    data={dataItems.data}
                    viewParams={getCurrentParams()}
                    listState = {cachedData?.state}
                    unit={data.unit}
                    storagekey={storageKeyValue}
                    useWindowScroll
                    height={props?.height}
                    refer={uniRef}
                    no_scroll={props.no_scroll}
                    renderItem={({item, index}) => <View key={'item' + item.id} className={numColumns > 1 ? 'w-full mb-2 pr-2 pl-2' : '  ' + (data.unit != 'feed' ? '   w-full': '  ') + '  '}><Unit  unit={data.unit ? data.unit : ''} mode={unitMode} module={data.module ? data.module : ''} object_id={data.object_id ? data.object_id : ''} view={data.view ? data.view : ''}  {...props} data={item}  /></View>}
                    onEndReached = {handleEndReached} 
                    ListFooterComponent={
                        ((hasNextPage && isFetchingNextPage) ) ? (
                            Preload
                        ) : null
                    }
                /> : Preload}
            </View>
            }
        </View> 
    );


}

