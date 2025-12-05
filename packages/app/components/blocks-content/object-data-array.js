import { useState, useEffect } from 'react';
import useFetchForm from 'app/lib/hooks/fetch'
import Element from 'app/components/element';
import { Text } from 'app/design/typography'
import { isObjectsEqual } from 'app/lib/util'
import { BlockWrapper } from 'app/components/block-wrapper'

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

    const [realData, setRealData] = useState(props.data);

    useEffect(() => {
        if (dynamicData) {
             
             if (dynamicData.data?.length >0){
             setRealData(prev => {
                if (!isObjectsEqual(prev, dynamicData.data)) {
                    return dynamicData.data.map(item => ({
                        ...item,
                        data: item.type !== 'form' ? item.data : {
                            ...item.data,
                            updated: Date.now()
                        }
                    }));
                }
                return prev;
            });
            }
            else{
                 setRealData(dynamicData.data);
            }
        } else {
            setRealData(props.data);
        }
    }, [dynamicData, props.data]);

    if (dynamicData && dynamicData.data?.length == 0) {

        if (props.onFormEmpty) {
            props.onFormEmpty();
        }
    }

    if (!realData) {
        return null;
    }

    const items = Array.isArray(realData) ? realData : [realData];
    const handleFormSubmit = props.onFormSubmit ||onFormSubmit;

    const content = items.map(a => (
        <Element
            key={a.id + a.type}
            type={a.type}
            {...props}
            saveOnChanges={props.saveOnChanges}
            onFormSubmit={handleFormSubmit}
            {...a}
        />
    ));

    if (items.length > 1) {
        return <BlockWrapper {...props.blockWrapperProps}>{content}</BlockWrapper>;
    }

    return content;
}
