

import Unit from '../unit';
import { useState, useEffect } from 'react';
import { View, FlatList, FlashList } from 'app/design/view'

import { useWindowDimensions} from 'react-native';
import { Platform } from 'react-native'

import { fetcher } from '../../lib/fetcher';
import Dropdown from 'app/ui/atoms/dropdown'
import { appSetting } from 'app/lib/util'
import { ActivityIndicator } from 'react-native';
import { Dimensions } from 'react-native';
import { Theme } from 'app/design/theme';

export default function ElementBrowse(props) {
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
    }

    const [browseParams, setbrowseParams] = useState(defParams);
    const updateBrowseParams =  (params) => {
        setbrowseParams(Object.assign({}, browseParams, params));
    } 

    const handleEndReached = () => {  
        if (browseParams?.loadedAll == false && !props.disablescroll && data.data.length > 0) {
            handleMore();
        }
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

        const containerHeight = event.nativeEvent.layout.height;
        if (getNumCols(containerWidth) != numColumns)
            setNumColumns(getNumCols(containerWidth));
    };

    const { colors } = Theme();

    function prepareUrl (params) {
        let sUrl = undefined;

        switch(data.unit) {
            case 'comments':
                break;

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

    let styles = {};
    if(Platform.OS === 'web') {
        styles = {height: (defParams?.height ? defParams.height : windowHeight - 64)}
    }

    console.log(55555, data.data.length);
    return (
        (data.data.length > 0) && <View className='w-full h-full ' >
            { (data.unit == 'feed' && appSetting('feed', 'show_selector_view')) && <View className='h-12 items-end z-50'><Dropdown 
                labelField="label"
                valueField="value"
                onChange={setUnitMode}
                value={unitMode}
                data={modeItems}
            /></View>}
            { (data.unit != 'comments') && <View className='w-full h-full ' onLayout={handleLayout}  style = {styles}>
                <FlashList estimatedItemSize={200} numColumns={numColumns} horizontal={false} 
                data={data.data}
                renderItem={({item}) => <View key={'item' + item.id} className={numColumns > 1 ? 'w-full mb-2 pr-2 pl-2' : '  ' + (data.unit != 'feed' ? '   w-full': '  ') + '  '}><Unit  unit={data.unit ? data.unit : ''} mode={unitMode} module={data.module ? data.module : ''} object_id={data.object_id ? data.object_id : ''} view={data.view ? data.view : ''}  {...props} data={item}  /></View>}
                keyExtractor={item => item.id}
                key={numColumns} 
                onEndReached ={handleEndReached} 
 
                ListFooterComponent={
                    (browseParams?.loadedAll == false) ? (
                      <View className='m-2'><ActivityIndicator  accessibilityRole="progressbar" accessibilityLabel="Loading" size="large" color={colors.primary}  /></View>
                    ) : null
                  }
            /></View>
            }
            { (data.unit == 'comments') && <View  style={styles.cardList}>
                {data.data.map(a => <Unit key={a.id ? a.id : Object.keys(a)[0]} unit={data.unit ? data.unit : ''} mode={unitMode} module={data.module ? data.module : ''} object_id={data.object_id ? data.object_id : ''} view={data.view ? data.view : ''}  {...props} data={a} />)}
                <View className="u-card-4 flex-1"></View>
                <View className="u-card-4 flex-1"></View>
                <View className="u-card-4 flex-1"></View>
                <View className="u-card-4 flex-1"></View>
            </View>
            }
            
        </View> 
    );


}

