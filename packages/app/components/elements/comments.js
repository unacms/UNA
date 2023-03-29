import { useState, useContext} from 'react';
import Browse from '../elements/browse';
import Form from '../elements/form';
import useSWR from "swr";
import { fetcher } from '../../lib/fetcher';
import { View, ScrollView, Row } from 'app/design/view'
import { Text, H1 ,TextLink } from 'app/design/typography'
import { StyleSheet, useWindowDimensions } from 'react-native';
import { stripTags } from '../../lib/util';
import { Button, Select } from 'app/design/controls'
import { Platform, PlatformIOSStatic, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from 'react-native'
import { ScrollView as ScrollViewNative } from 'react-native-gesture-handler';
import Dropdown from 'app/ui/atoms/dropdown'
import { useTheme } from '@react-navigation/native';
import { LayoutData } from 'app/context/layout';

export default function ElementComments(props) {

    let browse = props.browse;
    let form = props.form;
    let requestUrl = props.url;
    let count = browse.data.total_count;

    //const [postData, setPostData] = useState(null);
    const [commentData, setCommentData] = useState({
        parentId: 0, 
        startFrom: browse.data.start, 
        perView: browse.data.per_view,
        count: browse.data.count,
        moduleName: browse.data.module, 
        orderWay: browse.data.order,
        view: browse.data.view,
        objectId: browse.data.object_id,
        formText: '',
        formAuthor: '',
        postData: null,
        num:0
    });


    let immutable = props.form? props.form.request.immutable : false;
  
    let { data: dynamicData, error } = useSWR(
        commentData.postData ? [prepareUrl(), '', commentData.postData] : null,
        fetcher,
        !immutable ? undefined : {
            revalidateIfStale: false,
            revalidateOnFocus: false,
            revalidateOnReconnect: false
        }
    ); 

    function prepareUrl (params) {
        let def = {'module': commentData.moduleName, 'object_id': commentData.objectId, 'start_from': commentData.startFrom, 'order_way': commentData.orderWay};
        //console.log("prepare:" + requestUrl + JSON.stringify({...def, ...params}))
        return requestUrl + JSON.stringify({...def, ...params});
    }
    

    // add new values to state
    const addCommentData =  (params) => {
        if (!params.postData)
            params.postData = null;
            //, {num:commentData.num+1}
        setCommentData(Object.assign({}, commentData, params, {num:commentData.num+1}));
    } 
    
    const onFormSubmit = (formData, d) => {
        Keyboard.dismiss();
        addCommentData({postData: formData});
    }

    // handle errors and loading 
    if (error || dynamicData?.error) return "An error has occurred:${error ? error : data?.error}";

    if(form){
        form.data.inputs.cmt_parent_id.value = commentData.parentId;
        form.data.reset = true;
    }
    if (dynamicData && dynamicData.data.form){
        form = dynamicData.data.form;
        form.data.reset = true;
    }

    if (dynamicData && dynamicData.data.browse && dynamicData.data.browse.insert){
        browse = parseData(browse, dynamicData);
        count = dynamicData.data.browse.data.total_count;
    }
    
    function parseData (browse, dynamicData) {
        dynamicData.data.browse.data.data.map(function(c, kc){
            let o = c[Object.keys(c)[0]];
            // add in root
            if(o.data.cmt_vparent_id == 0){
                let bPresent = false;
                //tofix
                browse.data.data.forEach(function (k) { 
                    if(Object.keys(k)[0] == Object.keys(c)[0])
                    bPresent = true;
                });

                if (!bPresent){
                    if (dynamicData.data.browse.insert == 'before'){
                        browse.data.data = browse.data.data.concat([c]);
                    }
                    else{
                        browse.data.data = [c].concat(browse.data.data);
                    }
                }
            }
            else{
                browse.data.data = findParent(browse.data.data, c, o, dynamicData.data.browse.insert);
            }
        });
       // browse.data.data.sort( sortComments );
        return browse;
    }

    function sortComments( a, b ) {

        if (a[Object.keys(a)[0]].data.cmt_time < b[Object.keys(b)[0]].data.cmt_time){
            return commentData.orderWay == 'asc' ? -1 : 1;
        }
        if (a[Object.keys(a)[0]].data.cmt_time > b[Object.keys(b)[0]].data.cmt_time){
            return commentData.orderWay == 'asc' ? 1 : -1;
        }
        return 0;
      }

    function findParent (data, c, o, insert) {
        if (Array.isArray(data)){
            //for first level
            data.map(function(d, k){ 
                if (o.data.cmt_vparent_id == d[Object.keys(d)[0]].id){
                    if (insert == 'before')
                        data[k][Object.keys(data[k])[0]].items = {...c, ...data[k][Object.keys(data[k])[0]].items};
                    else
                        data[k][Object.keys(data[k])[0]].items = {...data[k][Object.keys(data[k])[0]].items, ...c};
                    
                }
                data[k][Object.keys(data[k])[0]].items = findParent(data[k][Object.keys(data[k])[0]].items, c, o, insert)
            }) 
        }
        else{
            //for another levels
            Object.keys(data).forEach(function (k) { 
                if (o.data.cmt_vparent_id == data[k].id){
                    if (insert == 'before')
                        data[k].items = {...c, ...data[k].items};
                    else
                    data[k].items = {...data[k].items, ...c};
                }
                data[k].items = findParent(data[k].items, c, o)
            });

        }
        return data;
    }
    
    // handle change order
    const handleOrder =  async (orderWay) => { 
       
        const sRequest = prepareUrl({'start_from': 0, 'is_form' : false, 'order_way': orderWay});
        const sResponse = await fetcher(sRequest);
        if(sResponse && sResponse.data != undefined){
            browse.data.data = [];
            browse = parseData(browse, sResponse);
            addCommentData({startFrom: 0, orderWay: orderWay, startFrom: sResponse.data.browse.data.start,count: sResponse.data.browse.data.count, postData:null})
            
           
        }
    }

    // handle more button
    const handleMore =  async () => {
        const sRequest = prepareUrl({'is_form' : false}) ;
        const sResponse = await fetcher(sRequest);
        if(sResponse && sResponse.data != undefined){
            browse = parseData(browse, sResponse);
            addCommentData({startFrom: sResponse.data.browse.data.start, count: sResponse.data.browse.data.count, postData:null})
        }
    }

    const handleReply =  async (id, author, text) => {
        text = stripTags(text);
        form.data.inputs.cmt_parent_id.value = id;
        form.data.reset = true;
        addCommentData({parentId:id, formAuthor: author, formText: text});
    }

    const handleCancel =  async () => {
        handleReply(0, '', '')
    }
    /*

    const [keyboardStatus, setKeyboardStatus] = useState(false);

    useEffect(() => {
        const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
          setKeyboardStatus(true);
         // setPostData(null);
        });
        const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
          setKeyboardStatus(false);
         // setPostData(null);
        });
    
        return () => {
          showSubscription.remove();
          hideSubscription.remove();
        };
      }, []);
*/
    let sortItems = [
        {label: 'Newest first', value: 'desc'},
        {label: 'Oldest first', value: 'asc'}
    ];
  
    let cmtsBrs = <View className="px-4"><Browse {...browse} handleReply={handleReply}  /></View> 
    let cmtsMore = (commentData.count == commentData.perView ) && <View className='ml-2 mb-2'><Button align="start" title={"Show more comments"} size ="sm" variant="link" onPress={() => handleMore()} /></View>
    let cmtsHeader = <Row className='mb-4 mx-4 items-center justify-between '>
        <Text className='text-sm font-bold text-neogray-900 dark:text-neogray-50'>Comments ({count})</Text>
       
           
            <View className='w-40'>
            <Dropdown className='w-40'
                labelField="label"
                valueField="value"
                onChange={item => {
                    handleOrder(item.value);
                }}
                value={commentData.orderWay}
                data={sortItems}
            />
            </View>
    </Row>  

    const { colors } = useTheme();

    let cmtForm = null;

    if (form){ 
        cmtForm = <View className=" w-full bottom-0 border-t  border-neoborder/30 dark:border-neoborder-dark/30" style={{backgroundColor: colors.barsBackground, paddingTop:5, paddingBottom:5}}>
            {
                form.data.inputs.cmt_parent_id.value != 0 && (<View className='bg-neoitem dark:bg-neoitem-dark rounded-lg   px-1 mx-2 mb-1'>
                    <Row className=' justify-between items-center'>
                        <View>
                            <Row className='mx-2'>
                                <Text className='text-sm text-neogray-900 dark:text-neogray-50'>Reply to: </Text>
                                <Text className='font-bold text-sm text-neogray-900 dark:text-neogray-50'>{ commentData.formAuthor}</Text>
                            </Row>
                            <Text className='mx-2 text-sm max-h-10 overflow-hidden text-neogray-900 dark:text-neogray-50'>{form.data.inputs.cmt_parent_id.value == 0 ? '' : '' + commentData.formText}</Text>
                        </View>
                        <Button align="start" title={"Cancel"} size ="sm" variant="link" onPress={() => handleCancel()} />
                    </Row>
                </View>)
            }
            <Form {...form} classContainerName="flex-row px-4 w-full px-2 items-end " onFormSubmit={onFormSubmit}  />
        </View> }

    const { layoutData, setLayoutData } = useContext(LayoutData);
    if(Platform.OS !== 'web') {
        
        if (!layoutData || layoutData[1] != commentData.num){
            setTimeout(() => {
                let a = [cmtForm,commentData.num];
                setLayoutData(a)
            }, 1000);
        }
       
    }
    let cmts = null
    let styles = {};
    const {height, width, scale, fontScale} = useWindowDimensions(); 
    if(Platform.OS !== 'web') {
       
        let heightS = height * 0.9 - 30;
        styles.browse = {height: heightS, backgroundColor:'transparent', borderTopWidth:0};
/*className={keyboardStatus ? 'hidden w-full' : 'w-full'}*/
        cmts = <View  className=" bg-neocard dark:bg-neocard-dark max-w-5xl mx-auto w-full pt-4 sm:rounded-b-lg overflow-hidden sm:border border-t border-neoborder/30 dark:border-neoborder-dark/30">
            {cmtsHeader}
            {cmtsBrs}
            {cmtsMore}
           </View>
    }
    else{
        cmts = <View style={styles.browse} className=" bg-neocard dark:bg-neocard-dark max-w-5xl mx-auto w-full pt-4 sm:rounded-b-lg overflow-hidden sm:border border-t border-neoborder/30 dark:border-neoborder-dark/30">
            <View style={styles.list} className=' w-full max-h-screen'>
            {cmtsHeader}
            <ScrollView className='mt-4' style={{maxHeight:height-250}}>
            {cmtsBrs}
            {cmtsMore}
            </ScrollView>
            <View className='mt-4'>
            {cmtForm}
            </View>
        </View></View>;
    }
    

    return cmts;
}
