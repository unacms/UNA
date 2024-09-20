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
        if (currentUser?.id) {
            subscribe('sys_connections_' + currentUser.id, 'changed', onUpdateConnections);
            subscribe('bx_timeline_0', 'edited', onItemEdited);
        }

        //if (currentUser?.account_id)
        //    subscribe('sys_account_' + currentUser.account_id, 'confirmed', onUpdateAccount);

    }, [currentUser?.id])

    const onUpdateAccount = useCallback((data) => {
        console.log('onUpdateAccount----------------------', data);
        setCurrentUser({
            confirmed: true,
        });
    }, []);

    const onUpdateSettings = useCallback(async () => {
        remoteSettings.data = await getRemoteSettings();
    }, []);

    const onUpdateConnections = useCallback(async (data) => {
        storageClear();
        const oData = JSON.parse(data);
        setCurrentUser(oData.user);
    }, []);

    const onItemEdited = useCallback(async (strData) => {
        const data = JSON.parse(strData);
        const sKey = 'feed_' + data.id;
        const dataCache = getDataFromCache('li:data', sKey)
        if (dataCache) {
            const result = await fetcher(
                '/api.php?r=' + appSetting("urls", "feed_item") + '{"params":{"browse":"id","value":' + data.id + '}}'
            )
            if (result.data)
                storageSet('li:data', sKey, { data: result.data, ts: Date.now() });
        }
    }, []);

    return <></>
}