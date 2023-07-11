import { useState,  } from 'react';
import useSWR from "swr";

import { fetcher } from '../../lib/fetcher';
import Element from '../element';

import { View } from 'app/design/view'
import { Text} from 'app/design/typography'

export default function BlockContentObjectDataArray(props) {

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
    let { data: dynamicData, error } = useSWR(
        postData ? [requestUrl, '', postData] : null,
        fetcher,
        !immutable ? undefined : {
            revalidateIfStale: false,
            revalidateOnFocus: false,
            revalidateOnReconnect: false
        }
    );
    // update state when form is submitted
    const onFormSubmit = (formData, d) => {
        setPostData(formData);
    }

    // handle errors and loading 
    if (error || dynamicData?.error) return <Text className="text-black dark:text-white">An error has occurred: {error ? error : dynamicData?.error}</Text>;
    if (postData && !dynamicData) return <Text className="text-black dark:text-white">&nbsp;</Text>;
    
    let realData = props.data;
    if (dynamicData){
        realData = dynamicData.data;
    }

    // display each block element from static data or from dynamic data
    return (
        <View className="grid relative">
            {realData?.map(a => <Element key={a.id} type={a.type} {...props} onFormSubmit={onFormSubmit} {...a} />)}
        </View>
    );
}
