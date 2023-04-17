import Unit from '../unit';
import { useState, useEffect } from 'react';

import { View, FlatList  } from 'app/design/view'
import {StyleSheet, useWindowDimensions} from 'react-native';
import { Platform, PlatformIOSStatic } from 'react-native'
import { Text} from 'app/design/typography'
import { fetcher } from '../../lib/fetcher';
import Dropdown from 'app/ui/atoms/dropdown'
import { appSetting } from 'app/lib/util'
import { ActivityIndicator } from 'react-native';
import {  Dimensions  } from 'react-native';
import { IOScrollView, InView } from 'react-native-intersection-observer'
import { LogBox } from 'react-native';

export default function ElementBrowse(props) {
    let data = props.data;
    let defParams = data.params;

    useEffect(() => {
        LogBox.ignoreLogs(['VirtualizedLists should never be nested']);
    }, [])

    /* unit mode & change unit mode */
    const [unitMode, setUnitMode] = useState(appSetting('feed', 'default_view'));
    
    if (defParams){
        defParams.moduleName = data.module ? data.module : '';
        defParams.loadedAll = data.data.length > 0 ? false : true;
        defParams.loading = false ;
    }

    const [browseParams, setbrowseParams] = useState(defParams);
    const updateBrowseParams =  (params) => {
        setbrowseParams(Object.assign({}, browseParams, params));
    } 


    const handleEndReached = (isView) => {
       // if (isView != isInView)
        //    setIsInView(isView)
        console.log('11111111111-----',isView)
        if(isView){
            if (browseParams  && browseParams.loadedAll == false && !props.disablescroll && data.data.length > 0) {
                console.log('-----',)
                handleMore();
            }
        }
    };
    console.log('11111111111-!!!!!!', )
    const handleMore =  async () => {
        const sRequest = prepareUrl() ;
        console.log('11111111111', sRequest)
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
        if (data.unit.startsWith('general-')){
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

    function prepareUrl (params) {
        if (data.unit != 'comments'){
            let params = Object.assign({}, browseParams)
            params.start = parseInt(browseParams.start) + parseInt(browseParams.per_page);
            return data.request_url + JSON.stringify({'params': params});
        }
    }    

    let modeItems = [
        {label: 'Full', value: ''},
        {label: 'Mini', value: 'small'}
    ];

    return (
        <View className='w-full ' onLayout={handleLayout}  >
            { (data.unit == 'feed' && appSetting('feed', 'show_selector_view')) && <View className='h-12 items-end z-50'><Dropdown 
                labelField="label"
                valueField="value"
                onChange={setUnitMode}
                value={unitMode}
                data={modeItems}
            /></View>}
            
            <FlatList  numColumns={numColumns}  style={{height: windowHeight - 220}}
                data={data.data}
                renderItem={({item}) => <View className={numColumns > 1 ? 'w-1/3 mb-2 mr-2 ml-2' : 'mb-2'}><Unit  unit={data.unit ? data.unit : ''} mode={unitMode} module={data.module ? data.module : ''} object_id={data.object_id ? data.object_id : ''} view={data.view ? data.view : ''}  {...props} data={item}  /></View>}
                keyExtractor={item => item.id}
                key={numColumns} 
                onEndReached ={handleEndReached}
                
            />
        </View>
        
    );/* <InView onChange={(isVisible) => handleEndReached(isVisible)}><Text>Loading</Text></InView> { (!props.disablescroll && data.data.length > 0 && browseParams && browseParams.loadedAll == false) &&  }*/


}
