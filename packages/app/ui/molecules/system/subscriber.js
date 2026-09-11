"use client"

import React, { useEffect, useCallback } from 'react';
import { useCurrentUser } from 'app/context/user';
import { storageClear } from 'app/lib/util';
import { remoteSettings } from 'app/settings/remote';
import { subscribe } from 'app/ui/atoms/socket';
import { getRemoteSettings } from 'app/config';
import emitter from 'app/context/emitter'
import { checkActionsOnConnectionsChanged } from 'app/customization/functions';

// Debounce: UNA often sends several connection events for one join/leave.
let connectionsReloadTimer = null;

export default function Subscriber() {
    const { currentUser, setCurrentUser } = useCurrentUser();
    useEffect(() => {
        const sub1 = subscribe('sys_api_0', 'config_changed', onUpdateSettings);
        return () => {
            sub1();
        };
    }, [])

    useEffect(() => {
        if (!currentUser?.id) return 

        const sub1 = subscribe('sys_connections_' + currentUser?.id, 'changed', onUpdateConnections);
        const sub3 = subscribe('profile_' + currentUser?.id, 'changed', onUpdateProfile);

        return () => {
            sub1();
            sub3();
            clearTimeout(connectionsReloadTimer);
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

    // Fires when this user's connections change on the server (join/leave, friends, etc.).
    const onUpdateConnections = useCallback(async (data) => {
        storageClear();
        const oData = JSON.parse(data);
        const oActions = checkActionsOnConnectionsChanged(oData);
        if (oData?.user && oActions?.update_user) {
            setCurrentUser(oData.user);
        }
        if (!oActions?.reload_page) return;
        clearTimeout(connectionsReloadTimer);
        connectionsReloadTimer = setTimeout(() => {
            emitter.emit('connections', {
                action: 'changed',
                object: oData,
                reload: true,
            });
            connectionsReloadTimer = null;
        }, 400);
    }, []);

    return <></>
}