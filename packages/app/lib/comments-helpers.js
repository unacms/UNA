import { appSetting } from 'app/lib/util';
import { Pressable, View, Row } from 'app/design/view';
import UniList from 'app/ui/atoms/unilist'
import { Text } from 'app/design/typography'

import { useState, useContext, useRef, useEffect } from 'react';
import UnitComments from 'app/components/units/comments';
import { Button, Modal } from 'app/design/controls'
import useSWR from "swr";
import { fetcher } from 'app/lib/fetcher';
import Loading from 'app/ui/atoms/loading'
import Form from 'app/components/elements/form';
import { useTheme } from '@react-navigation/native';
import { Keyboard } from 'react-native'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { subscribe } from 'app/ui/atoms/socket'; 
import { Platform } from 'react-native'
import { useCurrentUser } from 'app/context/user';

export function findParent (data, c, o, insert) {
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

export function parseData (browse, dynamicData) {
    
    dynamicData.data.browse.data.data.map(function(c, kc){
        let o = c[Object.keys(c)[0]];
        // add in root
        if(o.data.cmt_vparent_id == 0){
            let bPresent = false;
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
    return browse;
}

export function CommentsBrowse({browse, requestUrl, module, handleReply, addData, addItems}) {

    const flashListRef = useRef(null);
    let { currentUser, setCurrentUser } = useCurrentUser();

    let dataOut = [];
    let viewMode = browse?.data?.view;

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
        lastInserted:0,
        total_count: browse.data.total_count
    });


    const addCommentData =  (params) => {
        if (!params.postData)
            params.postData = null;
        if (!params.lastInserted)
            params.lastInserted = 0;   
        setCommentData(Object.assign({}, commentData, params));
    } 


    function prepareUrl (params) {
        let def = {'module': commentData.moduleName, 'object_id': commentData.objectId, 'start_from': commentData.startFrom, 'order_way': commentData.orderWay};
        return requestUrl + JSON.stringify({...def, ...params});
    }

    useEffect(() => {
        if (addData && addData?.data?.browse && addData?.data?.browse?.insert){
            let browse = parseData(commentData.listData, addData);
            
            let i = Object.keys(addData?.data?.browse.data.data[0])[0].replace('i', '');
            addCommentData({ listData: browse,total_count: commentData.total_count + 1, lastInserted:i })
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

    const handleMore = async (force = false) => {
        if (commentData.last_count == commentData.perView){
            handleMoreInner();
        }
    }

    const handleMoreInner = async () => {
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

    const handleMoreNew = async () => {
        const sRequest = prepareUrl({'is_form' : false, comment_id: dataArrayRef.current.join(',')}) ;
        const sResponse = await fetcher(sRequest);
        if(sResponse && sResponse.data != undefined){
            let browse = parseData(commentData.listData, sResponse);
            let iCount = sResponse.data.browse.data.count;
            let i = Object.keys(sResponse.data.browse.data.data[0])[0].replace('i', '');
            addCommentData({ last_count: iCount, listData: browse, total_count: commentData.total_count + iCount, lastInserted:i })
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

    DataForList(commentData.listData.data.data, 0, 0, []);

    useEffect(() => {
        
        if (commentData.lastInserted > 0){
            let itemIndex = dataOut.findIndex(obj => obj.id == commentData.lastInserted);
            //TODO
            flashListRef.current.scrollToIndex({ animated: true, index: itemIndex });
        }
    }, [commentData.lastInserted]);

    const dataArrayRef = useRef([]);

    const cb = (data) => {
        if (currentUser && currentUser.id != data.author_id){
            let k = JSON.parse(data);
            if (!dataArrayRef.current.includes(k.id)) {
                dataArrayRef.current.push(k.id);
            }
            cb2('flex');
        }
    }

    
    const showNewContent = () => {
        console.log(dataArrayRef);
        cb2('none'); 
        handleMoreNew();
        dataArrayRef.current=[];
    }

    const cb2 = (val) => {
        const current = textRef.current;
        if (current) {
            current.setNativeProps({ style: { display: val } });
        }
    }
    useEffect(() => {
        if (currentUser){
            console.log(999);
            subscribe(commentData.moduleName + '_' + commentData.objectId, 'comment_added', cb);
        }
    }, [currentUser])

    const buttonRef = useRef();
    let header = commentData.total_count > 0 ? (
        <Row className='flex-row jusity-between items-center m-4'>
            <Text className='flex-auto text-base font-bold text-neutral-900 dark:text-neutral-50'>{appSetting('lang_keys', 'comment_list_title')} ({commentData.total_count})</Text>
            <View className="ml-4">
                <Pressable className="flex-auto" onPress={(event) => {event.preventDefault()}}>
                    <DropdownMenu items={[
                        {id: 'newest', name: 'desc', title: appSetting('lang_keys', 'comment_sorting_desc')}, 
                        {id: 'oldest', name: 'asc', title: appSetting('lang_keys', 'comment_sorting_asc')}
                    ]} onSelect={(oItem) => {handleOrder(oItem.name)}}>
                        <Button title={appSetting('lang_keys', 'comment_sorting_' + commentData.orderWay)} variant="outline" startDecorator="SortAscending" size="xs" />
                    </DropdownMenu>
                </Pressable>
            </View>
        </Row>)  : <Text>&nbsp;</Text>;
    
    if (dataOut.length > 0){
        let actionsItemIndex = addItems.findIndex(item => item.id === 'block_comments-empty');
        addItems.splice(actionsItemIndex, 1);
    }
    let h = dataOut.find(item => item.id === 'block_header') 
    if (!h)
        dataOut = [ ...addItems, {id:'block_header', data: header}, ...dataOut];
    
    //dataOut = dataOut.filter(item => (!item.id.toString().includes('block') || typeof item.data?.props?.children !== 'undefined') );
    let sClassName = 'absolute top-0 w-full items-center';
    if (Platform.OS === 'web')
        sClassName = 'fixed top-16 left-0 w-full items-center';

    const textRef = useRef();

    return (
        <> 
            <UniList
                useWindowScroll
                data={dataOut}
                refer = {flashListRef}
                //onScrollToIndex={handleScrollToIndex}
                renderItem={({item, index }) => {

                    if (item.id.toString().includes('block')){
                        return item.data;
                    }
                    return (
                    <View className='mx-4' key={index}>
                        <UnitComments {...item} view={viewMode}  handleReply={handleReply} />
                    </View>
                )}}
                

                onEndReached = {handleMore} 
                ListFooterComponent={
                    (commentData.last_count == commentData.perView) ? (
                        <View className='m-2'><Loading/></View>
                    ) : null
                  }
            />
            <View className={sClassName} ref={textRef} style={{display:'none'}}>
                <View className='w-1/2 items-center'>
                    <Button variant="primary" title="New comment" size="sm" onPress={() => {showNewContent() }} />
                </View>
            </View>
        </>
  
    )
}

export function CommentsForm({form, requestUrl, module, browse, formData, handleForm}) {
    if (!form)
        return <></>
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
        if(formData.parent_id > 0){
            form.data.inputs.cmt_parent_id.value = formData.parent_id;
            form.data.reset = true;
            addCommentData({formText:formData.text, formAuthor:formData.author, parentId:formData.parent_id})
        }
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
        formData.parent_id = 0;
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
        <View className={"w-full bg-neocard dark:bg-neocard-dark  border-t  border-neoborder dark:border-neoborder-dark"} style={{backgroundColor: colors.barsBackground, paddingTop:8, paddingBottom:8}}>
            {
                form.data.inputs.cmt_parent_id.value >0 && (<View className='bg-neocard dark:bg-neocard-dark rounded-sm border-l-2 border-primary/50  py-1 pl-2 mx-3 mb-2'>
                    <Row className='items-start justify-between max-w-full relative'>
                        <View className=' flex-auto pr-4'>
                            <Row className='max-w-full '>
                                <Text className='text-xs text-neutral-900 dark:text-neutral-50'>Reply to:</Text>
                                <Text className='font-semibold text-xs text-neutral-900 dark:text-neutral-50'>{ commentData.formAuthor}</Text>
                            </Row>
                            <Text className='text-sm overflow-hidden text-neutral-900 dark:text-neutral-50' numberOfLines={3}>{form.data.inputs.cmt_parent_id.value == 0 ? '' : '' + commentData.formText}</Text>
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

