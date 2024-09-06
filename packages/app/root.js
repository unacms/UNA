"use client"

import React, { useEffect, useCallback } from 'react';
import { useCurrentUser } from 'app/context/user';
import { Platform } from 'react-native'
import { storageClear, decodeText, getDataFromCache, storageSet } from 'app/lib/util';
import { remoteSettings } from 'app/settings-remote';
import { subscribe } from 'app/ui/atoms/socket';
import { getRemoteSettings } from 'app/config';
//import dynamic from 'next/dynamic'
import { fetcher } from 'app/lib/fetcher';

import { appSetting } from 'app/lib/util'
let Layouts;

if (Platform.OS === 'web') {
    const dynamic = require('next/dynamic').default;
    Layouts = dynamic(() => import('app/components/layouts'), { ssr: false });
    //const Layouts = React.lazy(() => import('app/components/layouts'));
} else {
    Layouts = require('app/components/layouts').default;
}

//const Layouts = dynamic(() => import('app/components/layouts'), { ssr: false, })


const metaAdder = (queryProperty, value) => {
    let element = document.querySelector(`meta[${queryProperty}]`);
    if (element) {
        element.setAttribute("content", value);
    } else {
        element = `<meta ${queryProperty} content="${value}" />`;
        document.head.insertAdjacentHTML("beforeend", element);
    }
};

export function Root(props) {
    //return <></>
    let { currentUser, setCurrentUser } = useCurrentUser();
    let data = props?.data;
    const isWeb = Platform.OS == 'web'

    useEffect(() => {
        if (isWeb) {
            if (data?.title) {

                if (appSetting('layout', 'add_notifications_count_in_title')) {
                    if (currentUser?.notifications > 0) {
                        document.title = decodeText('(' + currentUser?.notifications + ') ' + data?.title);
                    }
                    else {
                        document.title = decodeText(data?.title);
                    }
                }
                else {
                    document.title = decodeText(data?.title);
                }

            }
            metaAdder('property="og:title"', decodeText(data?.title))
        }
        if (props.settings)
            remoteSettings.data = props.settings;

    }, [currentUser?.notifications]);

    useEffect(() => {
        subscribe('sys_api_0', 'config_changed', onUpdateSettings);
    }, [])

    useEffect(() => {
        if(currentUser?.id){
            subscribe('sys_connections_'+currentUser.id, 'changed', onUpdateConnections);
        }
    }, [currentUser])

    useEffect(() => {
        if(currentUser?.id){
            subscribe('bx_timeline_0', 'edited', onItemEdited);
        }
    }, []);



    const onUpdateSettings = useCallback(async () => {
        remoteSettings.data = await getRemoteSettings();
    }, []);

    const onUpdateConnections = useCallback(async (data) => {
        storageClear()
        const request_url = '/api.php?r=system/get_page_by_request/TemplServicePages&params[]=home';
        const sResponse = await fetcher(request_url);
        setCurrentUser(sResponse.data.user);
    }, []);

    const onItemEdited = useCallback(async (strData) => {
        const data = JSON.parse(strData);
        const sKey = 'feed_' + data.id;
        const dataCache = getDataFromCache('li:data', sKey)
        if (dataCache){     
            const result = await fetcher(
                '/api.php?r='+appSetting("urls", "feed_item")+'{"params":{"browse":"id","value":' + data.id + '}}'
            )
            if (result.data)
                storageSet('li:data', sKey, { data: result.data, ts: Date.now() });
        }
    }, []);

    useEffect(() => {
        if (data?.user) {
            if (currentUser?.id != data.user.id) {
                let b = Object.assign({}, data.user)

                setCurrentUser(b);
                storageClear();
            }
            if (currentUser && currentUser?.informer != data.user.informer) {
                setCurrentUser(prevUser => ({
                    ...prevUser,
                    informer: data.user.informer,
                }));
            }
        }
        else {
            // if (currentUser != null){
            setCurrentUser(false);
            storageClear();
            //}
        }

    }, [data?.user]);
    

    if (props.code == 404 && !data?.page_status) {
        data.page_status = 404
    }

    return (
        <Layouts path={props?.path} data={data} uri={data?.uri} url={data?.url} />
    );
}
