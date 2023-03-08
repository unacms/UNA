import Unit from '../unit';
import { useState, useContext } from 'react';
import { View, ScrollView  } from 'app/design/view'
import {StyleSheet, useWindowDimensions} from 'react-native';
import { Platform, PlatformIOSStatic } from 'react-native'
import { Text, H1 ,TextLink} from 'app/design/typography'
import { StyledButton } from 'app/design/controls'
import { fetcher } from '../../lib/util';
import InView from 'react-native-component-inview'

export default function ElementBrowse(props) {
    let data = props.data;
    const {height, width, scale, fontScale} = useWindowDimensions(); 
    
    

    let defParams = data.params;
    
    if (defParams){
        defParams.moduleName = data.module ? data.module : '';
        
        defParams.loadedAll = data.data.length > 0 ? false : true;
    }
    const [browseParams, setbrowseParams] = useState(defParams);

    const updateBrowseParams =  (params) => {
        setbrowseParams(Object.assign({}, browseParams, params));
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
    let classes = '';
    if (data.unit != 'feed' && data.unit != 'comments')
        classes = 'u-card-list';
    if (data.unit == 'feed')
        classes = 'flex-auto flex-col space-y-2 w-full  max-w-3xl mx-auto';

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
        
        
    function prepareUrl (params) {
        if (data.unit != 'comments'){
            let params = Object.assign({}, browseParams)
            params.start = parseInt(browseParams.start) + parseInt(browseParams.per_page);
            if(data.unit != 'feed')
                return "/api.php?r=" + browseParams.moduleName + "/browse/&params[]=" + JSON.stringify({'params': params});
            else
                return "/api.php?r=bx_timeline/get_posts/&params[]=" + JSON.stringify({'params': params});
        }
    }    

    const [isInView, setIsInView] = useState(false);

    const checkVisible = (isVisible) => {
        console.log(5);
        if (isInView != isVisible && isVisible){
            handleMore();
        }
        if (isVisible){
            setIsInView(isVisible)
        } else {
            setIsInView(isVisible)
        }
    }
    
    let stylesScroll = StyleSheet.create({
       /* view: {
          top: -500,
        },*/
      });

    return (
        <View><View className={classes} style={styles.cardList}>
            {data.data.map(a => <Unit key={a.id ? a.id : Object.keys(a)[0]} unit={data.unit ? data.unit : ''} module={data.module ? data.module : ''} object_id={data.object_id ? data.object_id : ''} {...props} data={a} />)}
            </View>
        { (!props.disablescroll && data.data.length > 0 && browseParams && browseParams.loadedAll == false) && <View style={stylesScroll.view}><InView removeClippedSubviews={false} onChange={(isVisible) => checkVisible(isVisible)}><Text>Loading, please wait</Text><View /></InView></View> }
        </View>
        
    );
}
