import Unit from '../unit';
import { useState, useContext } from 'react';
import { View, ScrollView  } from 'app/design/view'
import {StyleSheet, useWindowDimensions} from 'react-native';
import { Platform, PlatformIOSStatic } from 'react-native'
import { Text} from 'app/design/typography'
import { fetcher } from '../../lib/fetcher';
import InView from 'react-native-component-inview'
import { Dropdown } from 'app/design/controls'

export default function ElementBrowse(props) {
    let data = props.data;
    const {height, width, scale, fontScale} = useWindowDimensions(); 
    let defParams = data.params;

    /* unit mode & change unit mode */
    const [unitMode, setUnitMode] = useState('');
    
    if (defParams){
        defParams.moduleName = data.module ? data.module : '';
        defParams.loadedAll = data.data.length > 0 ? false : true;
    }

    /* browse params & change browse params */
    const [browseParams, setbrowseParams] = useState(defParams);
    const updateBrowseParams =  (params) => {
        setbrowseParams(Object.assign({}, browseParams, params));
    } 

     /* show more button & load data */
    const [isInView, setIsInView] = useState(false);
    const checkVisible = (isVisible) => {
        if (isInView != isVisible && isVisible){
            handleMore();
        }
        if (isVisible){
            setIsInView(isVisible)
        } else {
            setIsInView(isVisible)
        }
    }

    const handleMore =  async () => {
        const sRequest = prepareUrl() ;
        const sResponse = await fetcher(sRequest);
        
        if(sResponse && sResponse.data != undefined){
            data.data = data.data.concat(sResponse.data[0].data.data);
            
            updateBrowseParams({
                start: sResponse.data[0].data.params.start, 
                per_page: sResponse.data[0].data.params.per_page, 
                loadedAll: sResponse.data[0].data.data.length > 0 ? false : true
            }) 
        }
    } 
    
    let styles = StyleSheet.create({});
    if (Platform.OS != 'web'){
        styles = StyleSheet.create({
            cardList: {
                flexWrap: 'wrap',
                flexDirection:'row',
                flexShrink:1 
            },
        });
    }

    let stylesScroll = StyleSheet.create({
        view: {
          top: -50,
        },
    });

    let classes = '';
    if (data.unit.startsWith('general-')){
        if (data.module == 'bx_posts')
            classes = 'u-card-list';
        else
            classes = ' flex-wrap flex-row w-full justify-center u-card-list4 w-full';
    }
    if (data.unit == 'feed'){
        if (unitMode == '')
            classes = 'flex-auto flex-col space-y-2 sm:space-y-4 w-full max-w-3xl mx-auto';
        else
            classes = 'flex-auto flex-col w-full  max-w-3xl mx-auto';
    }

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
        <View className='w-full '>
            { (data.unit == 'feed') && <View className='h-12 items-end z-50'><Dropdown 
                labelField="label"
                valueField="value"
                onChange={item => {
                    setUnitMode(item.value);
                }}
                value={unitMode}
                data={modeItems}
            /></View>}
            <View className={classes} style={styles.cardList}>
                {data.data.map(a => <Unit key={a.id ? a.id : Object.keys(a)[0]} unit={data.unit ? data.unit : ''} mode={unitMode} module={data.module ? data.module : ''} object_id={data.object_id ? data.object_id : ''} {...props} data={a} />)}
                <View className="u-card-4 flex-1"></View>
                <View className="u-card-4 flex-1"></View>
                <View className="u-card-4 flex-1"></View>
                <View className="u-card-4 flex-1"></View>
            </View>
        { (!props.disablescroll && data.data.length > 0 && browseParams && browseParams.loadedAll == false) && <View className='text-center ' style={stylesScroll.view}><InView removeClippedSubviews={false} onChange={(isVisible) => checkVisible(isVisible)}><Text>Loading, please wait</Text><View /></InView></View> }
        </View>
        
    );
}
