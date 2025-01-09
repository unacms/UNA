import { useState, } from 'react';
import useSWR from "swr";
import { fetcher } from 'app/lib/fetcher';
import Form from 'app/components/elements/form';
import SimpleList from 'app/components/elements/simple_list';
import { View } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Platform } from 'react-native'
import Msg from 'app/components/elements/msg';
import Redirect from 'app/components/elements/redirect';

export function BlockByData(props) {
    return <BlockContentObjectDataArray data={props.block.content} type={props.block.type} {...props} />
}

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

    const components = {
        'simple_list': SimpleList,
        'form': Form,
        'msg': Msg,
        'redirect': Redirect
    };
    
    if (realData && !Array.isArray(realData)){
        realData = [realData];
    }

    // display each block element from static data or from dynamic data
    return (
        <View className={(Platform.OS == 'web' ? '' : '') + " relative"}>
            {realData && realData?.map(a => {
                //const type = !dynamicData ? props.block.content[0].type : a?.type;
                const type = a?.type;
                if (!type)
                    return <></>
                const Component = components[type];
                return <Component key={a.id + a?.type} type={a?.type} onSubmittig={postData && !dynamicData} onFormSubmit={onFormSubmit} {...a} exProps={props.exProps}/>
            }
            )}
        </View>
    );
}
