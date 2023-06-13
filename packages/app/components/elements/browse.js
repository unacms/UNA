

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

    /* unit mode & change unit mode */
    const [unitMode, setUnitMode] = useState(appSetting('feed', 'default_view'));
    
    if (defParams){
        defParams.moduleName = data.module ? data.module : '';
        defParams.loadedAll = data.data.length > 0 ? false : true;
        defParams.loading = false ;
        defParams.loading = false ;
    }
    if (isFirstMount?.current){
        if (appSetting('cache', 'list')){
            let defParams1 = storageGet('ls-d', storageKeyValue);
        
            if (defParams1){
                defParams = defParams1.params;
                data.data = defParams1.data;
            }
        }
    }

    const [browseParams, setbrowseParams] = useState(defParams);
    
    const exitingFunction = () => {
        if (appSetting('cache', 'list')){
            storageSet('ls-d', storageKeyValue, {data:data.data, params:browseParams})
        }
    };
    
    const updateBrowseParams =  (params) => {
        setbrowseParams(Object.assign({}, browseParams, params));
    } 

    const isLoading = useRef(false);


    const handleEndReached = () => { 
        if (isLoading.current) 
            return;

        isLoading.current = true;    

        if (browseParams?.loadedAll == false && !props.disablescroll && data.data.length > 0) {
            handleMore();
        }
        
        isLoading.current = false;
    };

    const handleMore =  async () => {
        const sRequest = prepareUrl() ;

        const sResponse = await fetcher(sRequest);
        if(sResponse && sResponse.data != undefined){
            data.data = data.data.concat(sResponse.data[0].data.data);
            updateBrowseParams({
                start: sResponse.data[0].data.params.start, 
                per_page: sResponse.data[0].data.params.per_page, 
                loadedAll: sResponse.data[0].data.data.length > 0 ? false : true,
                loading:false
            }) 
        }
    } 

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

        const containerHeight = event.nativeEvent.layout.height;
        if (getNumCols(containerWidth) != numColumns)
            setNumColumns(getNumCols(containerWidth));
    };

    function prepareUrl (params) {
        let sUrl = undefined;

        switch(data.unit) {
            case 'notifications':
                sUrl = data.request_url + JSON.stringify({'params': browseParams});
                break;
                
            default:
                let params = Object.assign({}, browseParams)
                params.start = parseInt(browseParams.start) + parseInt(browseParams.per_page);
                sUrl = data.request_url + JSON.stringify({'params': params});
        }

        return sUrl;
    }    

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

    let styles = {height: (defParams?.height ? defParams.height : windowHeight - hOffset)}

    if (Platform.OS === 'web')
        styles={};

    const dataItems = data.data;
    return (
        (data.data.length > 0) && <View className='w-full h-full mb-4' ><CurRouter exitingFunction={exitingFunction}  />
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
                    refer={uniRef}
                    no_scroll={props.no_scroll}
                    renderItem={({item, index}) => <View key={'item' + item.id} className={numColumns > 1 ? 'w-full mb-2 pr-2 pl-2' : '  ' + (data.unit != 'feed' ? '   w-full': '  ') + '  '}><Unit  unit={data.unit ? data.unit : ''} mode={unitMode} module={data.module ? data.module : ''} object_id={data.object_id ? data.object_id : ''} view={data.view ? data.view : ''}  {...props} data={item}  /></View>}
                    onEndReached = {handleEndReached} 
                    ListFooterComponent={
                        (browseParams?.loadedAll == false) ? (
                        <View className='m-2'><Loading/></View>
                        ) : null
                    }
                />
            </View>
            }
        </View> 
    );


}

