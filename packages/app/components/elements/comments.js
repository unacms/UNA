import { useState, useContext } from 'react';
import Browse from '../elements/browse';
import Form from '../elements/form';
import useSWR from "swr";
import { fetcher } from '../../lib/util';


export default function ElementComments(props) {

    let browse = props.browse;
    let form = props.form;
    let requestUrl = props.url;
   
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

    const onFormSubmit = (formData, d) => {
        setPostData(formData);
    }
    
    // handle errors and loading 
    if (error || dynamicData?.error) return `An error has occurred:${error ? error : data?.error}`;
    if (postData && !dynamicData) {
        form = null
    }

    if (dynamicData && dynamicData.data.browse && dynamicData.data.browse.insert){
        browse = parseData(browse, dynamicData);
        if (dynamicData.data.browse.new){
            //TODO: improve hightlignt process
            setTimeout(() => {
                let el = document.getElementById('cmt-' + dynamicData.data.browse.new);
                if (el)
                    el.scrollIntoView();
                    el.classList.add('hle')
              }, "1000");
              setTimeout(() => {
                let el = document.getElementById('cmt-' + dynamicData.data.browse.new);
                if (el)
                    el.classList.remove('hle')
              }, "3000");
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

    function prepareUrl (params) {
        let def = {'module': commentData.moduleName, 'object_id': commentData.objectId, 'start_from': commentData.startFrom, 'order_way': commentData.orderWay}
        return requestUrl + JSON.stringify({...def, ...params});
    }

    // handle more button
    const handleMore =  async () => {

        const sRequest = prepareUrl({'is_form' : false}) ;
        const sResponse = await fetcher(sRequest);
        if(sResponse && sResponse.data != undefined){
            browse = parseData(browse, sResponse);
            addCommentData({startFrom: sResponse.data.browse.data.start})
        }
    }

    // handle change order
    const handleOrder =  async (orderWay) => { 
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
    // add new values to state
    const addCommentData =  (params) => {
        setCommentData(Object.assign({}, commentData, params));
    }
  
    return (
        <div className='bg-red-500'>
            <div className="p-4 m-auto">
                <button data-dropdown-toggle="cmts-order" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" type="button">Order by <svg className="w-4 h-4 ml-2"  fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg></button>
                <div id="cmts-order" className="z-10 hidden bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700">
                    <ul className="py-2 text-sm text-gray-700 dark:text-gray-200">
                    <li>
                        <a href="#" onClick={() => handleOrder('desc')} className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Newest</a>
                    </li>
                    <li>
                        <a href="#" onClick={() => handleOrder('asc')} className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Oldest</a>
                    </li>
                    </ul>
                </div>
            </div>
            <Browse {...browse} addCommentData={addCommentData} />
            { form && <Form {...form}  onFormSubmit={onFormSubmit}  handleValues={handleFormValues} /> }
            <div className="p-4 m-auto" style={{ display: commentData.startFrom > 0? "block" : "none" }}>
                <button className="text-white bg-blue-600 hover:bg-blue-700 border border-gray-900/20 dark:border-white/20 focus:ring-4 shadow-sm hover:shadow-md active:shadow-sm hover:-translate-y-0.5 active:translate-y-0 duration-200 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm @xl/cell:w-auto px-5 py-2.5 text-center dark:focus:ring-blue-800" onClick={handleMore}>Load More</button>
            </div>
        </div>
    );
}
