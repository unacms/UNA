import { View, ScrollView, FlashList, Row } from 'app/design/view';
import {BlockByName, DataByName} from 'app/components/block';
import { Text } from 'app/design/typography'

import { useState, useContext, useRef, useEffect } from 'react';
import UnitComments from 'app/components/units/comments';
import { Button, Modal } from 'app/design/controls'
import useSWR from "swr";
import { fetcher } from '../../lib/fetcher';
import Loading from 'app/ui/atoms/loading'
import Form from '../elements/form';
import { stripTags } from '../../lib/util';
import { useTheme } from '@react-navigation/native';
import { Platform, Keyboard } from 'react-native'
import Dropdown from 'app/ui/atoms/dropdown'
import { parseData } from 'app/lib/comments-helpers'
import { KeyboardAvoidingView } from 'react-native';
import { Dimensions } from 'react-native';
import { useNavigation, useRouter} from "expo-router";
import { updateCenterHeader } from 'app/lib/native-handlers'

function CommentsBrowse({browse, requestUrl, module, handleReply, addData, addItems}) {
    let dataOut = [];
    let viewMode = browse.data.view;

    const [commentData, setCommentData] = useState({
        parentId: 0, 
        startFrom: browse.data.start, 
        perView: browse.data.per_view,
        last_count: browse.data.count,
        moduleName: module, 
        orderWay: browse.data.order,
        view: browse.data.view,
        objectId: browse.data.object_id,
        formText: '',
        formAuthor: '',
        postData: null,
        num: 0,
        listData: browse,
        total_count: browse.data.total_count
    });

    const addCommentData =  (params) => {
        if (!params.postData)
            params.postData = null;
        setCommentData(Object.assign({}, commentData, params));
    } 
    function prepareUrl (params) {
        let def = {'module': commentData.moduleName, 'object_id': commentData.objectId, 'start_from': commentData.startFrom, 'order_way': commentData.orderWay};
        return requestUrl + JSON.stringify({...def, ...params});
    }

    useEffect(() => {
        if (addData && addData?.data?.browse && addData?.data?.browse?.insert){
            let browse = parseData(commentData.listData, addData);
            addCommentData({ listData: browse,total_count: commentData.total_count + 1 })
        }
    }, [addData]);

    function DataForList(items, level, last_child_in, lvls){
        Object.keys(items).forEach(function (k) { 
            let ilen = Object.keys(items[k]).length
            let item = null;
            if (ilen == 1){
                item= items[k][Object.keys(items[k])[0]];
            }
            else{
                item = items[k]
            }
            
            let childs = Object.keys(item.items);
            let last_child = 0;
            if (childs.length > 0){
                last_child = item.items[childs[childs.length-1]].id;
            }
           
            item.level = level;
            item.last_child = last_child_in;
            lvls[level] = (last_child_in != item.id ? true: false);
            item.lvls = lvls.slice();

            dataOut.push(item)
            if (item.items && viewMode != 'flat'){
                DataForList(item.items, level + 1, last_child, lvls.slice());
            }
        })
    }

    const handleMore = async () => {
        if (commentData.last_count == commentData.perView){
            const sRequest = prepareUrl({'is_form' : false}) ;
            const sResponse = await fetcher(sRequest);
            if(sResponse && sResponse.data != undefined){
                let browse = parseData(commentData.listData, sResponse);
                let iCount = sResponse.data.browse.data.count;
                if (sResponse.data.browse.data.start == 0)
                    iCount = 0;
                addCommentData({startFrom: sResponse.data.browse.data.start, last_count: iCount, listData: browse })
            }
        }
    }

    const handleOrder =  async (orderWay) => { 
        const sRequest = prepareUrl({'start_from': 0, 'is_form' : false, 'order_way': orderWay});
        const sResponse = await fetcher(sRequest);
        if(sResponse && sResponse.data != undefined){
            browse.data.data = [];
            browse = parseData(browse, sResponse);
            addCommentData({startFrom: 0, orderWay: orderWay, startFrom: sResponse.data.browse.data.start, last_count: sResponse.data.browse.data.count, postData:null}) 
        }
    }
    const hOffset = 160
    const [viewHeight, setViewHeight] = useState(Dimensions.get('window').height - hOffset);

    const handleWindowSizeChange = () => {
        setViewHeight(Dimensions.get('window').height - hOffset);
    };

    useEffect(() => {
        Dimensions.addEventListener('change', handleWindowSizeChange);
      
        return () => {
          Dimensions.removeEventListener('change', handleWindowSizeChange);
        };
      }, []);

    const flashListRef = useRef(null);


    DataForList(commentData.listData.data.data, 0, 0, []);

    let sortItems = [
        {label: 'Newest first', value: 'desc'},
        {label: 'Oldest first', value: 'asc'}
    ];

    let header = (
        <Row className='m-4 items-center justify-between '>
        <Text className='text-sm font-bold text-gray-900 dark:text-gray-50'>Comments ({commentData.total_count})</Text>
            <View className='w-40'>
                <Dropdown
                    labelField="label"
                    valueField="value"
                    onChange={handleOrder}
                    value={commentData.orderWay}
                    data={sortItems}
                />
            </View>
        </Row>);

    let h = dataOut.find(item => item.id === 'block_header') 
    console.log('---------------------', h)
    if (!h)
        dataOut = [ ...addItems, {id:'block_header', data: header}, ...dataOut];
 
    return (
        <View  style={{ height: viewHeight }} >
            <FlashList
                ref={flashListRef}
                data={dataOut}
                renderItem={({item}) => {

                    if (item.id.toString().includes('block')){
                        return item.data;
                    }
                    return (
                    <View className='mx-4'>
                        <UnitComments {...item} view={viewMode}  handleReply={handleReply} />
                    </View>
                )}}
                
                keyExtractor={item => item.id}
                estimatedItemSize={200}
                onEndReached = {handleMore} 
                ListFooterComponent={
                    (commentData.last_count == commentData.perView) ? (
                        <View className='m-2'><Loading/></View>
                    ) : null
                  }
            >
            </FlashList>
        </View>
    )
}

function CommentsForm({form, requestUrl, module, browse, formData, handleForm}) {

    const [commentData, setCommentData] = useState({
        parentId: 0, 
        startFrom: browse.data.start, 
        perView: browse.data.per_view,
        last_count: browse.data.count,
        moduleName: module, 
        orderWay: browse.data.order,
        view: browse.data.view,
        objectId: browse.data.object_id,
        formText: '',
        formAuthor: '',
        postData: null,
        num: 0,
        listData: null,
        total_count: browse.data.total_count
    });

    const addCommentData =  (params) => {
        setCommentData(Object.assign({}, commentData, params));
    } 

    useEffect(() => {
        form.data.inputs.cmt_parent_id.value = formData.parent_id;
        form.data.reset = true;
        addCommentData({formText:formData.text, formAuthor:formData.author, parentId:formData.parent_id})
    }, [formData.parent_id]);

    const [commentForm, setCommentForm] = useState();

    let immutable = form? form.request.immutable : false;
    let { data: dynamicData, error } = useSWR(
        commentForm ? [prepareUrl(), '', commentForm] : null,
            fetcher,
            !immutable ? undefined : {
                revalidateIfStale: false,
                revalidateOnFocus: false,
                revalidateOnReconnect: false
            }
        );

    useEffect(() => {
        
        if (dynamicData?.data?.browse){
            handleForm(dynamicData);
            handleCancel()
        }
    }, [dynamicData]);

    const handleCancel =  async () => {
        form.data.inputs.cmt_parent_id.value = 0;
        form.data.reset = true;
        addCommentData({formText:'', formAuthor:'', parentId:0})
    }    
        
    function prepareUrl (params) {
        let def = {'module': module, 'object_id': commentData.objectId, 'start_from': commentData.startFrom, 'order_way': commentData.orderWay};
        return requestUrl + JSON.stringify({...def, ...params});
    }    

    const onFormSubmit = (formData, d) => {
        setCommentForm(formData);
        Keyboard.dismiss();
    }


    const { colors } = useTheme();    

    return ( 
        <View className="w-full bottom-0 border-t  border-neoborder dark:border-neoborder-dark" style={{backgroundColor: colors.barsBackground, paddingTop:8, paddingBottom:8}}>
            {
                form.data.inputs.cmt_parent_id.value >0 && (<View className='bg-neocard dark:bg-neocard-dark rounded-sm border-l-2 border-primary/50  py-1 pl-2 mx-3 mb-2'>
                    <Row className='items-start justify-between max-w-full relative'>

                        <View className=' flex-auto pr-4'>
                            <Row className='max-w-full '>
                                <Text className='text-xs text-gray-900 dark:text-gray-50'>Reply to: {form.data.inputs.cmt_parent_id.value}</Text>
                                <Text className='font-semibold text-xs text-gray-900 dark:text-gray-50'>{ commentData.formAuthor}</Text>
                            </Row>
                            
                                <Text className='text-sm overflow-hidden text-gray-900 dark:text-gray-50' numberOfLines={3}>{form.data.inputs.cmt_parent_id.value == 0 ? '' : '' + commentData.formText}</Text>
                                
                
                        </View>
                        <View className=" right-0 t-0">
                            <Button align="start"  rounded startDecorator="X" size ="xs" variant="outline" onPress={() => handleCancel()} />
                        </View>
                    </Row>
                </View>)
            }
            <Form {...form} classContainerName="flex-row flex-wrap px-2 w-full  items-start justify-between" onFormSubmit={onFormSubmit}  />
        </View> 
    )
}

export default function PageLayout(props) {

    const [formData, setFormData] = useState({});
    const [addData, setAddData] = useState({});

    const handleReply =  async (id, author, text) => {
        setFormData({text:stripTags(text), parent_id:id, author:author})
        if(Platform.OS == 'web')
            document.getElementsByClassName("form-control-cmt_text")[0].getElementsByTagName("textarea")[0].focus();
    }

    const handleForm =  async (data) => {
        setAddData(data)
    }
    
    const commentsData = DataByName(props.data, props.blocks.comments);
    if (Platform.OS == 'web'){
        let aItems = [
            {id:'block_author', data: <View className='pt-4 px-4'><BlockByName data={props.data} name={props.blocks.author}/></View>},
            {id:'block_text', data: <BlockByName data={props.data} name={props.blocks.text}/>},
            {id:'block_actions', data: <View className='border-b border-neoborder dark:border-neoborder-dark'><BlockByName data={props.data} name={props.blocks.actions}/></View>}
        ];
    return ( 
        <View  className=" mt-4 bg-neocard dark:bg-neocard-dark max-w-5xl mx-auto w-full sm:rounded-lg overflow-hidden sm:border border-t border-neoborder dark:border-neoborder-dark ">
            <CommentsBrowse addItems = {aItems} handleReply={handleReply} browse={commentsData.content[0].browse} addData={addData} module={commentsData.module} requestUrl={commentsData.content[0].url} />
            <CommentsForm handleForm={handleForm} browse={commentsData.content[0].browse} module={commentsData.module} form={commentsData.content[0].form} formData={formData} requestUrl={commentsData.content[0].url} />    
        </View>  
    )
}
else{
    let aItems = [
        {id:'block_text', data: <BlockByName data={props.data} name={props.blocks.text}/>},
        {id:'block_actions', data: <View className='border-b border-neoborder dark:border-neoborder-dark'><BlockByName data={props.data} name={props.blocks.actions}/></View>}
    ];

    const routerExpo = useRouter();
    const navigation = useNavigation();
    const { colors } = useTheme();   
    
    setTimeout(() => {
        updateCenterHeader(null, <View style={{width:360}} className=' items-center  '><BlockByName data={props.data} name={props.blocks.author}/></View>, true, navigation, routerExpo, colors, null);
      }, 100);

    return (
        <View className='flex-1  w-full h-full'>
            <CommentsBrowse  addItems = {aItems} handleReply={handleReply} browse={commentsData.content[0].browse} addData={addData} module={commentsData.module} requestUrl={commentsData.content[0].url} />
            <KeyboardAvoidingView keyboardVerticalOffset={92} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} >
                <CommentsForm handleForm={handleForm} browse={commentsData.content[0].browse} module={commentsData.module} form={commentsData.content[0].form} formData={formData} requestUrl={commentsData.content[0].url} />         
            </KeyboardAvoidingView>
        </View>
    )
}
}
