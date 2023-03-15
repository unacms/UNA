import { useState, useEffect } from 'react';
import Browse from '../elements/browse';
import Form from '../elements/form';
import useSWR from "swr";
import { fetcher } from '../../lib/util';
import { View, ScrollView, Row } from 'app/design/view'
import { Text, H1 ,TextLink } from 'app/design/typography'
import { StyleSheet, useWindowDimensions } from 'react-native';

import { Button, Select } from 'app/design/controls'
import { Platform, PlatformIOSStatic, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from 'react-native'
import { ScrollView as ScrollViewNative } from 'react-native-gesture-handler';
import Picker  from 'app/ui/atoms/picker';

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
        objectId: browse.data.object_id,
        formText: '',
        formAuthor: '',
        postData: null
    });


    let immutable = props.form? props.form.request.immutable : false;
   
    console.log('dbgs', 'IN');
    
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
        console.log("prepare" + requestUrl + JSON.stringify({...def, ...params}))
        return requestUrl + JSON.stringify({...def, ...params});
    }
    

    // add new values to state
    const addCommentData =  (params) => {
        //scrollHandler();
        if (!params.postData)
            params.postData = null;
        setCommentData(Object.assign({}, commentData, params));

       // if (params.parentId)
        //    setPostData(null);
    } 
    
    const onFormSubmit = (formData, d) => {
        Keyboard.dismiss();
        addCommentData({postData: formData});
      //  setPostData(formData);
       // addCommentData({parentId:0});
    }

    // handle errors and loading 
    if (error || dynamicData?.error) return "An error has occurred:${error ? error : data?.error}";
    /*if (postData && !dynamicData) {
        form = null
    }*/
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
        const regex = /(<([^>]+)>)/ig;
        text = text.replace(regex, '');
        form.data.inputs.cmt_parent_id.value = id;
        form.data.reset = true;
        addCommentData({parentId:id, formAuthor: author, formText: text});
    }

    const handleCancel =  async () => {
        handleReply(0, '', '')
    }
    

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

    let sortItems = [
        {label: 'Newest', value: 'desc'},
        {label: 'Oldest', value: 'asc'}
    ];

    let cmtsBrs = <Browse {...browse} handleReply={handleReply}  /> 
    let cmtsMore = (commentData.count == commentData.perView ) && <View className='ml-2 mb-2'><Button align="start" title={"Show more comments"} size ="sm" variant="link" onPress={() => handleMore()} /></View>
    let cmtsHeader = <Row className='mb-4 mx-4 items-center justify-between z-50'>
        <Text className='text-sm font-bold'>Comments ({count})</Text>
        <Row className=' justify-end  items-center '>
            <Text className='text-sm w-40'>Sort&nbsp;by:&nbsp;</Text>
            <Picker  items={sortItems} value="desc" onSelect={(value) => {
                handleOrder(value) 
                }} /> 
            </Row>
    </Row>  

   


    let cmtForm = null;

    if (form){ 
        cmtForm = <View className=" w-full bottom-0 ">
            {
                form.data.inputs.cmt_parent_id.value != 0 && (<View className='bg-item-hover/50 dark:bg-item-hover-dark/50 rounded-lg  py-1 px-1 m-4'>
                    <Row className=' justify-between items-center'>
                    <Row className='mx-2'><Text className='text-sm'>Reply to: </Text><Text className='font-bold text-sm'>{ commentData.formAuthor}</Text></Row>
                    <Button align="start" title={"Cancel"} size ="sm" variant="link" onPress={() => handleCancel()} />
                    
                </Row>
                <Text className='mx-2 text-sm max-h-10 mb-2 overflow-hidden'>{form.data.inputs.cmt_parent_id.value == 0 ? '' : '' + commentData.formText}</Text></View>)
            }
            <Form {...form} classContainerName="flex-row px-4 w-full  px-4 items-end " onFormSubmit={onFormSubmit}  />
        </View> }

    let cmts = null
    let styles = {};
    const {height, width, scale, fontScale} = useWindowDimensions(); 
    if(Platform.OS !== 'web') {
       
        let heightS = height * 0.9 - 30;
        styles.browse = {height: heightS, backgroundColor:'transparent', borderTopWidth:0};

        cmts = <View style={styles.browse} className=" bg-card dark:bg-card-dark max-w-5xl mx-auto w-full pt-4 sm:rounded-b-lg overflow-hidden sm:border border-t border-bordercolor/10 dark:border-bordercolor-dark/10">
        {cmtsHeader}<ScrollViewNative className={keyboardStatus ? 'hidden w-full' : 'w-full'} >
            {cmtsBrs}
            {cmtsMore}
            </ScrollViewNative>{cmtForm}</View>
    }
    else{
        cmts = <View style={styles.browse} className=" bg-card dark:bg-card-dark max-w-5xl mx-auto w-full pt-4 sm:rounded-b-lg overflow-hidden sm:border border-t border-bordercolor/10 dark:border-bordercolor-dark/10">
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
