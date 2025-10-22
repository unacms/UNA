"use client"
import React, { useEffect } from 'react';
import { useCurrentUser } from 'app/context/user';
import { storageClear } from 'app/lib/util';
import { remoteSettings } from 'app/settings-remote';
import { Platform } from 'react-native';


//import Layouts from 'app/components/layouts';
let Layouts;

if (Platform.OS === 'web') {
    const dynamic = require('next/dynamic').default;
    Layouts = dynamic(() => import('app/components/layouts'), { ssr: false });
} else {
    Layouts = require('app/components/layouts').default;
}

//const Layouts = React.lazy(() => import('app/components/layouts'));
//import Layouts from 'app/components/layouts';
// ################## OLD CODE FOR WEB VERSION
//const dynamic = require('next/dynamic').default;
//const Layouts = dynamic(() => import('app/components/layouts'), { ssr: false });
// ################## OLD CODE FOR NATIVE VERSION
//import Layouts from 'app/components/layouts';


export function Root(props) {
    const { currentUser, setCurrentUser } = useCurrentUser();
    const data = props?.data;
    // ################## CODE FOR NATIVE VERSION
    /*useEffect(() => {
        
        if (props.settings)
            remoteSettings.data = props.settings;

    }, [currentUser?.notifications]);*/

    useEffect(() => {
        if (data?.user) {
            if (currentUser?.id != data.user.id) {
                setCurrentUser(data.user);
                storageClear();
            }
            if (currentUser && currentUser?.informer != data.user.informer) {
                setCurrentUser({
                    informer: data.user.informer,
                });
            }
        }
        else {
            setCurrentUser(false);
            storageClear();
        }

    }, [data?.user]);

    if (props.code == 404 && !data?.page_status) {
        data.page_status = 404
    }
    return (
        <><Layouts path={props?.path} data={data} uri={data?.uri} url={data?.url} /><div class='h-1 w-full hidden'>{JSON.stringify(data)}</div></>
    );
}
