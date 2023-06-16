import Unit from '../unit';
import { useState,useEffect, useRef } from 'react';
import { View } from 'app/design/view'
import { useWindowDimensions} from 'react-native';
import { Platform } from 'react-native'

import UniList from 'app/ui/atoms/unilist'
import { fetcher } from '../../lib/fetcher';
import { appSetting, storageKey, storageSet, storageGet } from 'app/lib/util'
import { Dimensions } from 'react-native';
import Loading from 'app/ui/atoms/loading'
import  CurRouter from "app/ui/atoms/router";
import { useInfiniteQuery } from  '@tanstack/react-query'
import { getSkeleton } from 'app/lib/hooks/skeleton';

export default function ElementBrowse(props) {

    let storageKeyValue = storageKey(props.data.request_url)
    const isFirstMount = useRef(true);
    let uniRef = useRef();

    useEffect(() => {
        if (isFirstMount.current)
            isFirstMount.current = false;
    });

    let data = props.data;

    let defParams = data.params;
    if(props?.params)
        defParams = {...defParams, ...props.params};

    if (defParams)
        defParams.moduleName = data.module ? data.module : '';

    /* unit mode & change unit mode */
    const [unitMode, setUnitMode] = useState(appSetting('feed', 'default_view'));
    
    if (isFirstMount?.current){
        if (appSetting('cache', 'list')){
            let defParams1 = storageGet('ls-d', storageKeyValue);
        
            if (defParams1){
                defParams = defParams1.params;
                data.data = defParams1.data;
                console.log('----------')
            }
        }
    }

    const [browseParams, setbrowseParams] = useState(defParams);
    
    const exitingFunction = () => {
        if (appSetting('cache', 'list')){
            storageSet('ls-d', storageKeyValue, {data: getCurrentData(), params: getCurrentParams()})
        }
    };

    const getNumCols = (width) => {
        if (data.unit.startsWith('general-') || data.unit.startsWith('search-')){
            return width > 600 ? 3 : 1
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


    let modeItems = [
        {label: 'Full', value: ''},
        {label: 'Mini', value: 'small'}
    ];

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
    } = useInfiniteQuery([data.request_url], fetchData, {
        getNextPageParam: lastPage => {
            if (lastPage.data.length == 0)
                return;
            return lastPage.params;
            },
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
    const getCurrentData = () => {
        return newData 
        ? [...data.data, ...newData.pages.flatMap((dataPage) => dataPage.data)]
        : data.data;
    }

    const handleEndReached = () => { 
        if (isFetchingNextPage) 
            return;
        fetchNextPage();
    };

    const Preload = getSkeleton(data.module? data.module : data.unit, 'browse')

    let dataItems = getCurrentData();
    console.log('dataItems', dataItems)
    
    if (status === 'loading' && dataItems.length == 0)
        return Preload 

    return (
        (data.data.length > 0 || true) && <View className='w-full h-full mb-4' ><CurRouter exitingFunction={exitingFunction}  />
            { (data.unit == 'feed' && appSetting('feed', 'show_selector_view')) && <View className='h-12 items-end z-50'><Dropdown 
                labelField="label"
                valueField="value"
                onChange={setUnitMode}
                value={unitMode}
                data={modeItems}
            /></View>}
            { <View className='w-full ' onLayout={handleLayout}  style = {styles}>
                <UniList 
                    numColumns={numColumns} 
                    data={dataItems}
                    unit={data.unit}
                    storagekey={storageKeyValue}
                    useWindowScroll
                    height={props?.height}
                    refer={uniRef}
                    no_scroll={props.no_scroll}
                    renderItem={({item, index}) => <View key={'item' + item.id} className={numColumns > 1 ? 'w-full mb-2 pr-2 pl-2' : '  ' + (data.unit != 'feed' ? '   w-full': '  ') + '  '}><Unit  unit={data.unit ? data.unit : ''} mode={unitMode} module={data.module ? data.module : ''} object_id={data.object_id ? data.object_id : ''} view={data.view ? data.view : ''}  {...props} data={item}  /></View>}
                    onEndReached = {handleEndReached} 
                    ListFooterComponent={
                        (hasNextPage && isFetchingNextPage) ? (
                            Preload
                        ) : null
                    }
                />
            </View>
            }
        </View> 
    );


}

