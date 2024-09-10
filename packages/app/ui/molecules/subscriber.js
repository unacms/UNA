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
import { appSetting, isObjectsEqual } from 'app/lib/util'


export default function Subscriber() {
    let { currentUser, setCurrentUser } = useCurrentUser();

    useEffect(() => {
        subscribe('sys_api_0', 'config_changed', onUpdateSettings);
    }, [])

    useEffect(() => {
        if(currentUser?.id){
            //TODO need to fix
            //console.log("sys_connections_", 555)
            //subscribe('sys_connections_'+currentUser.id, 'changed', onUpdateConnections);
        }
    }, [currentUser?.id])

    useEffect(() => {
        if(currentUser?.id){
            console.log("bx_timeline_0", 555)
            subscribe('bx_timeline_0', 'edited', onItemEdited);
        }
    }, [currentUser?.id]);

    const onUpdateSettings = useCallback(async () => {
        remoteSettings.data = await getRemoteSettings();
    }, []);

    const onUpdateConnections = useCallback(async (data) => {
        storageClear()
        const request_url = '/api.php?r=system/get_page_by_request/TemplServicePages&params[]=home';
        console.log("onUpdateConnections", 555)
        const sResponse = await fetcher(request_url);
        if(!isObjectsEqual(sResponse.data.user, currentUser)){
            setCurrentUser(sResponse.data.user);
        }
       
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

    return <></>
}