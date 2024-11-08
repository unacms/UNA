import {BlockByName} from 'app/components/block';
import { clearNotif } from 'app/lib/util'
import React, { useEffect, useRef, useState } from "react";
import { useCurrentUser } from 'app/context/user'
import { View } from 'app/design/view'
import Toaster from 'app/ui/atoms/toaster';

export default function PageLayout(props) {
    const toasterRef2 = useRef();
    const { currentUser, setCurrentUser } = useCurrentUser();
    const [timeStamp, setTimeStamp] = useState(Date.now());
    
    useEffect(() => {
        clearNotif(currentUser, setCurrentUser);
    }, [])


    useEffect(() => {
        if (currentUser && currentUser.notifications > 0){
            setToaster2Visible(true);
        }
    }, [currentUser.notifications])


    const setToaster2Visible = (val) => {
        const current = toasterRef2.current;
        if (current) {
            current.setVisible(val);
        }
    }

    const showNewContent2 = async () => {
        setTimeStamp(Date.now())
        clearNotif(currentUser, setCurrentUser);
        setToaster2Visible(false);
    }

    return (  
        <View className='sm:p-2'>
            <Toaster ref={toasterRef2} onPress={showNewContent2} variant="primary" title="New notifications" size="sm" />
            <BlockByName data={props.data} key={timeStamp} cachePrefix={timeStamp} name={props.blocks.browse} />
        </View>
    )
}
