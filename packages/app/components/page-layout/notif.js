import {BlockByName} from 'app/components/block';
import { clearNotif } from 'app/lib/util'
import React, { useEffect, useRef, useState } from "react";
import { useCurrentUser } from 'app/context/user'
import { View } from 'app/design/view'
import Toaster from 'app/ui/atoms/toaster';


export default function PageLayout(props) {
    const toasterRef2 = useRef();
    const { currentUser, setCurrentUser } = useCurrentUser();
    const [timeStamp, setTimeStamp] = useState({ts:Date.now(), nts: currentUser.notificationsTs});
   
    useEffect(() => {
        clearNotif();
        setCurrentUser({
            notifications: 0,
            notificationsTs:Date.now()
        });
    }, [])

    if (currentUser.notificationsTs != timeStamp.nts){
        setTimeStamp({ts:Date.now(), nts: currentUser.notificationsTs});   
    }

    useEffect(() => {
        if (currentUser){
            if(currentUser.notifications > 0){
                setToaster2Visible(true);
            }
            else{
                setToaster2Visible(false);
            }
        }
    }, [currentUser.notifications])


    const setToaster2Visible = (val) => {
        const current = toasterRef2.current;
        if (current) {
            current.setVisible(val);
        }
    }

    const showNewContent2 = async () => {
        setTimeStamp({ts:Date.now(), nts: currentUser.notificationsTs});   
        clearNotif();
        setCurrentUser({
            notifications: 0,
            notificationsTs:Date.now()
        });
        setToaster2Visible(false);
    }

    return (  
        <View className='sm:p-2  items-center'>
            <View className='w-full max-w-4xl'>
            <Toaster ref={toasterRef2} onPress={showNewContent2} variant="primary" title="New notifications" size="sm" />
            <BlockByName exProps={{ scrollProps: { pageData: props.data, headerHeight: 64 } }} data={props.data} key={timeStamp.ts} cachePrefix={timeStamp.ts} name={props.blocks.browse} />
            </View>
        </View>
    )
}
