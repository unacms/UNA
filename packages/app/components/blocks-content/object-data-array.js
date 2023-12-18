import { useState,  } from 'react';
import useSWR from "swr";

import { fetcher } from 'app/lib/fetcher';
import Element from 'app/components/element';

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

    if (postData && Array.isArray(postData) && !dynamicData){
        postData.forEach((value, key) => {
            setInputValueByName(props.data, key, value);
        });
    }

    let realData = props.data;
    if (dynamicData){
        realData = dynamicData.data;
    }

    if (dynamicData && dynamicData.data?.length == 0){
      
        if (props.onFormEmpty){
            props.onFormEmpty();
        }
    }

    // display each block element from static data or from dynamic data
    return (
        <View className="relative gap-y-4">
            {realData?.map(a => <Element key={a.id+a.type} type={a.type} {...props} onFormSubmit={onFormSubmit} {...a} />)}
        </View>
    );
}
