import React, { useState, Suspense } from 'react';
//import use-SWR from "swr";
import useFetchForm from 'app/lib/hooks/fetch'
import { Text } from 'app/design/typography'
import { Loading } from 'app/loading'
import Form from 'app/components/elements/form';

export function BlockByData(props) {
    return <BlockContentObjectDataArrayInt data={props.block.content} type={props.block.type} {...props} />
}

export default function BlockContentObjectDataArrayInt(props) {

    const [postData, setPostData] = useState(null);
    // check if any element in a block has request URL
    let immutable = false;
    let requestUrl = null;
    props.data?.every(a => {
        immutable = a.request?.immutable || false;
        requestUrl = a.request?.url || null;
        return a.request ? false : true;
    });

    // get data from URL if needed
   /* let { data: dynamicData, error } = useSWR(
        postData ? [requestUrl, '', postData] : null,
        fetcher,
        !immutable ? undefined : {
            revalidateIfStale: false,
            revalidateOnFocus: false,
            revalidateOnReconnect: false
        }
    );*/
    const { data: dynamicData, error } = useFetchForm(requestUrl, postData);

    // update state when form is submitted
    const onFormSubmit = (formData, d) => {
        setPostData(formData);
    }

    // handle errors and loading 
    if (error || dynamicData?.error) return <Text className="text-black dark:text-white">An error has occurred: {error ? error : dynamicData?.error}</Text>;
    //if (postData && !dynamicData) return <Text className="text-black dark:text-white">&nbsp;</Text>;


    const setInputValueByName = (data, inputName, newValue) => {
        for (const item of data) {
            if (item.type === "form" && item.data.inputs[inputName]) {
                item.data.inputs[inputName].value = newValue;
                return true;  // Value was set successfully
            }
        }
        return false;  // Input with the given name was not found
    };

    if (postData && Array.isArray(postData) && !dynamicData) {
        postData.forEach((value, key) => {
            setInputValueByName(props.data, key, value);
        });
    }

    let realData = props.data;
    if (dynamicData) {
        realData = dynamicData.data;
    }

    if (dynamicData && dynamicData.data?.length == 0) {

        if (props.onFormEmpty) {
            props.onFormEmpty();
        }
    }

    /* MAY BE NEED TO REWORK FOR NATIVE like
    const components = {
    'simple_list': require('app/components/elements/simple_list').default,
    'form': require('app/components/elements/form').default,
    'grid': require('app/components/elements/grid').default,
    'msg': require('app/components/elements/msg').default,
    'redirect': require('app/components/elements/redirect').default
};
*/

    const components = {
        'form': Form,
        'simple_list': React.lazy(() => import('app/components/elements/simple_list')),
        //'form': React.lazy(() => import('app/components/elements/form')),
        'grid': React.lazy(() => import('app/components/elements/grid')),
        'msg': React.lazy(() => import('app/components/elements/msg')),
        'redirect': React.lazy(() => import('app/components/elements/redirect'))
    };
    
    if (realData && !Array.isArray(realData)){
        realData = [realData];
    }

    // display each block element from static data or from dynamic data
    return realData && realData?.map(a => {
        //const type = !dynamicData ? props.block.content[0].type : a?.type;
        const type = a?.type;
        if (!type)
            return <></>
        const Component = components[type];
        return (
        <Suspense fallback={<Loading />} key={a.id + a?.type}>
            <Component key={a.id + a?.type} type={a?.type} onSubmittig={postData && !dynamicData} onFormSubmit={onFormSubmit} {...a} exProps={props.exProps}/>
        </Suspense>
        )
    }
    )
}
