import {BlockByName} from 'app/components/block';
import { clearNotif } from 'app/lib/util'
import React, { useEffect } from "react";
import { useCurrentUser } from 'app/context/user'
import { View } from 'app/design/view'

export default function PageLayout(props) {
    const { currentUser, setCurrentUser } = useCurrentUser();
    useEffect(() => {
        clearNotif(currentUser, setCurrentUser);
    }, [])
    return (  <View className='px-1'><BlockByName data={props.data} name={props.blocks.browse} /></View>)
}
