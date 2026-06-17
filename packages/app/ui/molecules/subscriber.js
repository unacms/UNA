"use client"

import React, { useEffect, useCallback } from 'react';
import { useCurrentUser } from 'app/context/user';
import { useLayoutData } from 'app/context/layout';
import { storageClear, getAlert, getDataFromCache, storageSet } from 'app/lib/util';
import { remoteSettings } from 'app/settings/remote';
import { subscribe } from 'app/ui/atoms/socket';
import { getRemoteSettings } from 'app/config';
import { fetcher } from 'app/lib/fetcher';
import { appSetting } from 'app/lib/util'
import emitter from 'app/context/emitter'

export default function Subscriber() {
    const { currentUser, setCurrentUser } = useCurrentUser();
    const { setLayoutData } = useLayoutData()
    useEffect(() => {
        const sub1 = subscribe('sys_api_0', 'config_changed', onUpdateSettings);
        return () => {
            sub1();
        };
    }, [])

    useEffect(() => {
        if (!currentUser?.id) return 

        const sub1 = subscribe('sys_connections_' + currentUser?.id, 'changed', onUpdateConnections);
        const sub2 = subscribe('bx_timeline_0', 'edited', onItemEdited);
        const sub3 = subscribe('profile_' + currentUser?.id, 'changed', onUpdateProfile);

        return () => {
            sub1();
            sub2();
            sub3();
        };

    }, [currentUser?.id])

    const onUpdateAccount = useCallback((data) => {
        setCurrentUser({
            confirmed: true,
        });
    }, []);

    const onUpdateSettings = useCallback(async () => {
        remoteSettings.data = await getRemoteSettings();
    }, []);

    const onUpdateProfile = useCallback(async (data) => {
        emitter.emit('profile', { action: 'changed', data: data });
        setCurrentUser(JSON.parse(data));
    }, []);

    const onUpdateConnections = useCallback(async (data) => {
        emitter.emit('connections', { action: 'changed' });
        storageClear();
        const oData = JSON.parse(data);
        if (oData?.user){
            setCurrentUser(oData.user);
            setLayoutData(getAlert('connections:action', { object: oData, time: Date.now(), reload: true }));
        }
    }, []);

    const onItemEdited = useCallback(async (strData) => {
        const data = JSON.parse(strData);
        const dataId = data?.id;
        if (dataId){
            const sKey = 'feed_' + dataId;
            const dataCache = getDataFromCache('li:data', sKey)
            if (dataCache) {
                const result = await fetcher(
                    '/api.php?r=' + appSetting("urls", "feed_item") + '{"params":{"browse":"id","value":' + dataId + '}}'
                )
                if (result.data)
                    storageSet('li:data', sKey, { data: result.data, ts: Date.now() });
            }
        }
    }, []);

    return <></>
}