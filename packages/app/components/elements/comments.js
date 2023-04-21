import { useState, useContext, useRef } from 'react';
import Browse from '../elements/browse';
import Form from '../elements/form';
import useSWR from "swr";
import { fetcher } from '../../lib/fetcher';
import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { useWindowDimensions, Dimensions  } from 'react-native';
import { stripTags } from '../../lib/util';
import { Button } from 'app/design/controls'
import { Platform, Keyboard } from 'react-native'
import Dropdown from 'app/ui/atoms/dropdown'
import { useTheme } from '@react-navigation/native';
import { LayoutData } from 'app/context/layout';

export default function ElementComments(props) {

    let browse = props.browse;
    let form = props.form;
    let requestUrl = props.url;

    const [commentData, setCommentData] = useState({
        parentId: 0, 
        startFrom: browse.data.start, 
        perView: browse.data.per_view,
        last_count: browse.data.count,
        moduleName: browse.data.module, 
        orderWay: browse.data.order,
        view: browse.data.view,
        objectId: browse.data.object_id,
        formText: '',
        formAuthor: '',
        postData: null,
        num: 0,
        total_count: browse.data.total_count
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
        return requestUrl + JSON.stringify({...def, ...params});
    }
    
    // add new values to state
    const addCommentData =  (params) => {
        if (!params.postData)
            params.postData = null;
        setCommentData(Object.assign({}, commentData, params));
    } 
    
    const onFormSubmit = (formData, d) => {
        addCommentData({postData: formData, total_count: commentData.total_count + 1, num: commentData.num + 1});
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
            addCommentData({startFrom: 0, orderWay: orderWay, startFrom: sResponse.data.browse.data.start, last_count: sResponse.data.browse.data.count, postData:null})
            
           
        }
    }

    // handle more button
    const handleMore =  async () => {
        const sRequest = prepareUrl({'is_form' : false}) ;
        const sResponse = await fetcher(sRequest);
        if(sResponse && sResponse.data != undefined){
            browse = parseData(browse, sResponse);
            let iCount = sResponse.data.browse.data.count;
            if (sResponse.data.browse.data.start == 0)
                iCount = 0;
            addCommentData({startFrom: sResponse.data.browse.data.start, last_count: iCount, postData:null})
        }
    }

    const handleReply =  async (id, author, text) => {
        text = stripTags(text);
        form.data.inputs.cmt_parent_id.value = id;
        form.data.reset = true;
        if(Platform.OS == 'web')
            document.getElementsByClassName("form-control-cmt_text")[0].getElementsByTagName("textarea")[0].focus();
        addCommentData({parentId:id, formAuthor: author, formText: text,  num: commentData.num + 1});
    }

    const handleCancel =  async () => {
        handleReply(0, '', '')
    }

    let sortItems = [
        {label: 'Newest first', value: 'desc'},
        {label: 'Oldest first', value: 'asc'}
    ];

    let cmtsBrs = <View className="px-4"><Browse {...browse} handleReply={handleReply}  /></View> 
    let cmtsMore = (commentData.last_count == commentData.perView ) && <View className='ml-2 mb-2'><Button align="start" title={"Show more comments"} size ="sm" variant="link" onPress={() => handleMore()} /></View>
    let cmtsHeader = <Row className='mb-4 mx-4 items-center justify-between '>
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
    </Row>  

    const { colors } = useTheme();

    let cmtForm = null;

    if (form){ 
        cmtForm = <View className="w-full bottom-0 border-t  border-neoborder dark:border-neoborder-dark" style={{backgroundColor: colors.barsBackground, paddingTop:8, paddingBottom:8}}>
            {
                form.data.inputs.cmt_parent_id.value != 0 && (<View className='bg-neocard dark:bg-neocard-dark rounded-sm border-l-2 border-primary/50  py-1 pl-2 mx-3 mb-2'>
                    <Row className='items-start justify-between max-w-full relative'>

                        <View className=' flex-auto pr-4'>
                            <Row className='max-w-full '>
                                <Text className='text-xs text-gray-900 dark:text-gray-50'>Reply to: </Text>
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
        </View> }

    const { layoutData, setLayoutData } = useContext(LayoutData);
    if(Platform.OS !== 'web') {
        
        if (!layoutData || layoutData[1] != commentData.num || layoutData[2] != form.data.inputs.cmt_parent_id.value){
            setTimeout(() => {
                let a = [cmtForm, commentData.num, form.data.inputs.cmt_parent_id.value];
                setLayoutData(a)
            }, 1000);
        }
       
    }
    let cmts = null
    let styles = {};
    const {pageHeight, pageWidth, scale, fontScale} = useWindowDimensions(); 
    const [formSize, setFormSize] = useState({width: 100, pageY:0, height:0});

    const viewRef = useRef();
    const viewFormRef = useRef();
    const handleLayout = () => {
        viewFormRef.current.measure((x, y, width, height, pageX, pageY) => {
            let heightForm = height
            viewRef.current.measure((x, y, width, height, pageX, pageY) => {
                const windowHeight = Dimensions.get('window').height;
                setFormSize({width: width, pageY:pageY, height:heightForm, windowHeight: windowHeight});
            });
        });
        
    };
  

    if(Platform.OS !== 'web') {

        let heightS = pageHeight * 0.9 - 30;
        styles.browse = {height: heightS, backgroundColor:'transparent', borderTopWidth:0};
        if (commentData.total_count > 0)
            cmts = <View  className=" bg-neocard dark:bg-neocard-dark max-w-5xl mx-auto w-full pt-4 sm:rounded-b-lg overflow-hidden sm:border border-t border-neoborder dark:border-neoborder-dark">
                {cmtsHeader}
                {cmtsBrs}
                {cmtsMore}
            </View>
        else 
            cmts=<></>
    }
    else{ 
        if (commentData.total_count > 0){
            cmts = <View style={styles.browse} className=" bg-neocard dark:bg-neocard-dark max-w-5xl mx-auto w-full pt-4 sm:rounded-b-lg overflow-hidden sm:border border-t border-neoborder dark:border-neoborder-dark">
                <View style={styles.list} className=' w-full '>
                    {cmtsHeader}
                    {cmtsBrs}
                    {cmtsMore}
                    <View className='relative' ref={viewRef} onLayout={handleLayout} style={{marginTopx:((formSize.windowHeight < formSize.pageY) ? formSize.height : 0)}}>
                        <View ref={viewFormRef}  className={((formSize.windowHeight < formSize.pageY) ? 'absolutex' : '') + ' mt-4 bottom-0 z-50 w-full bg-neocard dark:bg-neocard-dark'} style={{width:formSize.width}}>
                            {cmtForm}
                        </View>
                    </View>
                </View>
            </View>;
        }
        else{
            cmts = <View style={styles.browse} className="bg-neocard dark:bg-neocard-dark max-w-5xl mx-auto w-full sm:rounded-b-lg overflow-hidden sm:border-x sm:border-b border-neoborder dark:border-neoborder-dark">
            <View style={styles.list} className=' w-full '>
                <View className='relative ' ref={viewRef} onLayout={handleLayout} style={{marginTopx:((formSize.windowHeight < formSize.pageY) ? formSize.height : 0)}}>
                    <View ref={viewFormRef}  className={((formSize.windowHeight < formSize.pageY) ? 'absolutex' : '') + ' bottom-0 z-50 w-full bg-neocard dark:bg-neocard-dark'} style={{width:formSize.width}}>
                        {cmtForm}
                    </View>
                </View>
            </View>
        </View>
        }
    }


    return cmts;
}
