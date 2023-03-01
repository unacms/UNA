import { useState, useContext } from 'react';
import Browse from '../elements/browse';
import Form from '../elements/form';
import useSWR from "swr";
import { fetcher } from '../../lib/util';
import { View, ScrollView } from 'app/design/view'
import { Text, H1 ,TextLink } from 'app/design/typography'
import { StyledButton } from 'app/design/controls'
import { StyleSheet, useWindowDimensions } from 'react-native';


export default function ElementComments(props) {

    let browse = props.browse;
    let form = props.form;
    let requestUrl = props.url;
    const [ref, setRef] = useState(null);
    const [postData, setPostData] = useState(null);
    const [commentData, setCommentData] = useState({
        parentId: 0, 
        startFrom: browse.data.start, 
        moduleName: browse.data.module, 
        orderWay: browse.data.order,
        objectId: browse.data.object_id
    });

    // check if any element in a block has request URL
    let immutable = props.form.request.immutable;
    
    // get data from URL if needed
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
        let def = {'module': commentData.moduleName, 'object_id': commentData.objectId, 'start_from': commentData.startFrom, 'order_way': commentData.orderWay};
        return requestUrl + JSON.stringify({...def, ...params});
    }
    
    const scrollHandler = () => {
    
 console.log(ref);
      ref.scrollTo({
        x: 0,
        y: 0,
        animated: true,
      });

  };

    
    function parseData (browse, dynamicData) {
        dynamicData.data.browse.data.data.map(function(c, kc){
            let o = c[Object.keys(c)[0]];
            // add in root
            if(o.data.cmt_vparent_id == 0){
                if (dynamicData.data.browse.insert == 'before')
                    browse.data.data = [c].concat(browse.data.data);
                else
                    browse.data.data = browse.data.data.concat([c]);
            }
            else{
                browse.data.data = findParent(browse.data.data, c, o, dynamicData.data.browse.insert);
            }
        });
        return browse;
    }
    
    // add new values to state
    const addCommentData =  (params) => {
        console.log(5);
        scrollHandler();
        setCommentData(Object.assign({}, commentData, params));
    } 
    
    const onFormSubmit = (formData, d) => {
        setPostData(formData);
    }

    // handle errors and loading 
    if (error || dynamicData?.error) return "An error has occurred:${error ? error : data?.error}";
    if (postData && !dynamicData) {
        form = null
    }

    if (dynamicData && dynamicData.data.browse && dynamicData.data.browse.insert){
        browse = parseData(browse, dynamicData);
        
        if (dynamicData.data.browse.new){
            //commentData = Object.assign({}, commentData, {parentId:0});
            //TODO: improve hightlignt process
            /*setTimeout(() => {
                let el = document.getElementsByClassName('cmt-' + dynamicData.data.browse.new)[0];
                if (el){
                    el.scrollIntoView();
                    el.classList.add('hle')
                }
              }, 1000);
            /*  setTimeout(() => {
                let el = document.getElementsByClassName('cmt-' + dynamicData.data.browse.new)[0];
                if (el)
                    el.classList.remove('hle')
              }, 3000);*/
        }
        
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

    

    

    // handle more button
    

    // handle change order
    const handleOrder =  async (orderWay) => { 
        setPostData(null);
        const sRequest = prepareUrl({'start_from': 0, 'is_form' : false, 'order_way': orderWay});
        const sResponse = await fetcher(sRequest);
        if(sResponse && sResponse.data != undefined){
            browse.data.data = [];
            browse = parseData(browse, sResponse);
            addCommentData({startFrom: 0, orderWay: orderWay, startFrom: sResponse.data.browse.data.start})
        }
    }

    // process form data
    const handleFormValues =  (defaultValues, setValue) => {
        if(commentData && commentData.parentId != defaultValues['cmt_parent_id'] && commentData.parentId > 0){
            setValue('cmt_parent_id', commentData.parentId);
            commentData.parentId = 0;
        }
    }
   
    
    const handleMore =  async () => {
        setPostData(null);
        const sRequest = prepareUrl({'is_form' : false}) ;
        const sResponse = await fetcher(sRequest);
        if(sResponse && sResponse.data != undefined){
            browse = parseData(browse, sResponse);
            addCommentData({startFrom: sResponse.data.browse.data.start})
        }
    }
    
    
    //style={{ display: commentData.startFrom > 0? "block" : "none" }}
    
    return (
        <View className='bg-card dark:bg-card-dark max-w-5xl mx-auto w-full pt-4 sm:rounded-b-lg sm:border overflow-hidden sm:border border-t border-bordercolor/10 dark:border-bordercolor-dark/10'>
           <ScrollView  ref={(ref) => {
            setRef(ref);
          }}>
                <Browse {...browse} addCommentData={addCommentData} /> 
                { commentData.startFrom > 0 && <View className="p-4"  ><StyledButton title="Show more" onPress={handleMore}/></View> }
            
            { form && <View className="border-t border-bordercolor/10 dark:border-bordercolor-dark/10 bg-neo-50/50 dark:bg-neo-700/50"><Form {...form} commentData={commentData} onFormSubmit={onFormSubmit} handleValues={handleFormValues} /></View>  }
            </ScrollView>
        </View>
    );
}
