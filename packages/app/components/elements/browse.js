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

    const [browseData, setbrowseData] = useState({
        startFrom: data.paginate ? data.paginate.start : 0,
        perPage: data.paginate ? data.paginate.per_page : 10,
        moduleName: data.module, 
        mode: data.mode,
        end: false,
    });

    const updateBrowseData =  (params) => {
        setbrowseData(Object.assign({}, browseData, params));
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
        classes = 'flex-auto flex-col space-y-2  max-w-3xl mx-auto';

    const handleMore =  async () => {
        
        const sRequest = prepareUrl() ;
        const sResponse = await fetcher(sRequest);
        if(sResponse && sResponse.data != undefined){
            data.data = data.data.concat(sResponse.data[0].data.data);
            updateBrowseData({
                startFrom: sResponse.data[0].data.paginate.start, 
                perPage:sResponse.data[0].data.paginate.per_page, 
                end: sResponse.data[0].data.data.length > 0 ? false : true
            }) 
        }
    } 
        
        
    function prepareUrl (params) {
        if (data.unit != 'comments' && data.unit != 'feed'){
            let def = {'mode': browseData.mode, 'params': {'paginate': {'per_page': browseData.perPage, 'start': browseData.startFrom + browseData.perPage}}};
            return "/api.php?r=bx_posts/browse/&params[]=" + JSON.stringify(def);
        }
    }    

    const isCloseToBottom = ({layoutMeasurement, contentOffset, contentSize}) => {
        const paddingToBottom = 20;
        return layoutMeasurement.height + contentOffset.y >=
          contentSize.height - paddingToBottom;
      };


      const [isInView, setIsInView] = useState(false)

const checkVisible = (isVisible) => {
    console.log(123);
      console.log(isVisible);
    if (isInView != isVisible && isVisible){
        console.log(isVisible);
        handleMore();
    }
    if (isVisible){
      setIsInView(isVisible)
    } else {
      setIsInView(isVisible)
    }
  }
   
    return (
        <View><ScrollView className={classes} style={styles.cardList}>
            {data.data.map(a => <Unit key={a.id ? a.id : Object.keys(a)[0]} unit={data.unit ? data.unit : ''} module={data.module ? data.module : ''} object_id={data.object_id ? data.object_id : ''} {...props} data={a} />)}
            </ScrollView>
        { (data.unit != 'comments' && data.data.length > 0 && browseData.end == false) && <InView removeClippedSubviews={false} onChange={(isVisible) => checkVisible(isVisible)}><View /></InView> }
        </View>
        
    );
}
