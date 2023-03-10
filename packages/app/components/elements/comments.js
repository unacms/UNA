import { useState, useEffect } from 'react';
import Browse from '../elements/browse';
import Form from '../elements/form';
import useSWR from "swr";
import { fetcher } from '../../lib/util';
import { View, ScrollView } from 'app/design/view'
import { Text, H1 ,TextLink } from 'app/design/typography'
import { StyleSheet, useWindowDimensions } from 'react-native';

import { Button } from 'app/design/controls'
import { Platform, PlatformIOSStatic, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from 'react-native'
import { ScrollView as ScrollViewNative } from 'react-native-gesture-handler';


export default function ElementComments(props) {

    let browse = props.browse;
    let form = props.form;
    let requestUrl = props.url;
    let count = browse.data.count;
    const [ref, setRef] = useState(null);
    const [postData, setPostData] = useState(null);
    const [commentData, setCommentData] = useState({
        parentId: 0, 
        startFrom: browse.data.start, 
        perView: browse.data.per_view,
        moduleName: browse.data.module, 
        orderWay: browse.data.order,
        objectId: browse.data.object_id
    });

    // check if any element in a block has request URL
    let immutable = false;props.form.request.immutable;

    let { data: dynamicData, error } = useSWR(
        postData ? [prepareUrl(), '', postData] : null,
        fetcher,
        !immutable ? undefined : {
            revalidateIfStale: false,
            revalidateOnFocus: false,
            revalidateOnReconnect: false
        }
    ); 
    function prepareUrl (params) {
        let def = {'module': commentData.moduleName, 'object_id': commentData.objectId, 'start_from': commentData.startFrom, 'per_view': commentData.perView, 'order_way': commentData.orderWay};
        console.log("prepare" + requestUrl + JSON.stringify({...def, ...params}))
        return requestUrl + JSON.stringify({...def, ...params});
    }
    

    // add new values to state
    const addCommentData =  (params) => {
        //scrollHandler();
        setCommentData(Object.assign({}, commentData, params));
        if (params.parentId)
            setPostData(null);
    } 
    
    const onFormSubmit = (formData, d) => {
        setPostData(formData);
        addCommentData({parentId:0});
    }

    // handle errors and loading 
    if (error || dynamicData?.error) return "An error has occurred:${error ? error : data?.error}";
    if (postData && !dynamicData) {
        form = null
    }
    if (dynamicData && dynamicData.data.form){
        let parentId = dynamicData.data.form.data.inputs.cmt_parent_id.value;
        form = dynamicData.data.form;
    }

    if (dynamicData && dynamicData.data.browse && dynamicData.data.browse.insert){
        browse = parseData(browse, dynamicData);
        count = dynamicData.data.browse.data.count;
    }
    
    function parseData (browse, dynamicData) {
        dynamicData.data.browse.data.data.map(function(c, kc){
            let o = c[Object.keys(c)[0]];
            // add in root
            if(o.data.cmt_vparent_id == 0){
                let key1 = Object.keys(dynamicData.data.browse.data.data[0])[0];
                let bPresent = false;
                browse.data.data.forEach(function (k) { 
                    if(Object.keys(k)[0] == key1)
                    bPresent = true;
                });

                if (!bPresent){
                    if (dynamicData.data.browse.insert == 'before'){
                        browse.data.data = [c].concat(browse.data.data);
                    }
                    else{
                        browse.data.data = browse.data.data.concat([c]);
                    }
                }
            }
            else{
                browse.data.data = findParent(browse.data.data, c, o, dynamicData.data.browse.insert);
            }
        });
        return browse;
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
   /* const handleOrder =  async (orderWay) => { 
        setPostData(null);
        const sRequest = prepareUrl({'start_from': 0, 'is_form' : false, 'order_way': orderWay});
        const sResponse = await fetcher(sRequest);
        if(sResponse && sResponse.data != undefined){
            browse.data.data = [];
            browse = parseData(browse, sResponse);
            addCommentData({startFrom: 0, orderWay: orderWay, startFrom: sResponse.data.browse.data.start})
        }
    }*/

    // process form data
    const handleFormValues =  (defaultValues, setValue) => {
        if(commentData && commentData.parentId != defaultValues['cmt_parent_id'] && commentData.parentId > 0){
            setValue('cmt_parent_id', commentData.parentId);
            commentData.parentId = 0;
        }
    }
   
    // handle more button
    const handleMore =  async () => {
        setPostData(null);
        const sRequest = prepareUrl({'is_form' : false}) ;
        const sResponse = await fetcher(sRequest);
        if(sResponse && sResponse.data != undefined){
            browse = parseData(browse, sResponse);
            addCommentData({startFrom: sResponse.data.browse.data.start, perView: sResponse.data.browse.data.per_view})
        }
    }


    const [viewParams, setViewParams] = useState({
        width:0,
        height:0
    });

    const [keyboardStatus, setKeyboardStatus] = useState(false);

    useEffect(() => {
        const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
          setKeyboardStatus(true);
          setPostData(null);
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


    let cmtsBrs = <Browse {...browse} addCommentData={addCommentData}  /> 
    let cmtForm = null;
    let cmts = null
    let styles = {};
    if(Platform.OS !== 'web') {
        const {height, width, scale, fontScale} = useWindowDimensions(); 
        let heightS = height * 0.9 - 70;
        styles.browse = {height: heightS, backgroundColor:'transparent', borderTopWidth:0};
        styles.form = {marginBottom:20, paddingTop:10 };
        cmts = <ScrollViewNative className={keyboardStatus ? 'hidden w-full' : 'w-full'} >{cmtsBrs}</ScrollViewNative>
    }
    else{
        styles.form = {
            width: viewParams.width-2,
            position: 'fixed',
            bottom: 0
        };
        styles.list = {
            marginBottom: 128,
        }

        cmts = <View style={styles.list} className=' w-full'>{cmtsBrs}</View>;
    }

    if (form){ 
        cmtForm = <View style={styles.form} className=" fixed w-full bottom-0  border-bordercolor/10 dark:border-bordercolor-dark/10 bg-neo-50 dark:bg-neo-7000">
        
        <Form {...form} commentData={commentData}  onFormSubmit={onFormSubmit} handleValues={handleFormValues} />
    </View> }
   
    return (
        <View onLayout={(event) => {
            var {x, y, width, height} = event.nativeEvent.layout;
            if (viewParams.width != width){
                setViewParams({width:width})
                setPostData(null);
            }
          }}   style={styles.browse} className="bg-card dark:bg-card-dark max-w-5xl mx-auto w-full pt-4 sm:rounded-b-lg sm:border overflow-hidden sm:border border-t border-bordercolor/10 dark:border-bordercolor-dark/10">
           { /* Platform.OS !== 'web' && cmtForm */ }
           <Text className='text-center u-hidden1 mb-4'>Comments ({count})</Text>
            {commentData.perView>0 && <View className={keyboardStatus ? 'hidden mb-2' : 'mb-2'}><Button align="start" title={"Show more " + commentData.perView + " comments"} size ="xs" variant="text" onPress={handleMore}/></View>}
            {cmts}
            { /*Platform.OS === 'web' && */ cmtForm}
        </View>
    );
}
