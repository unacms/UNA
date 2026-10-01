"use client"

import React, { useEffect, useCallback } from 'react';
import { useCurrentUser } from 'app/context/user';
import { storageClear } from 'app/lib/util';
import { subscribe } from 'app/ui/atoms/socket';
import emitter, { EVENTS } from 'app/context/emitter'
import { checkActionsOnConnectionsChanged } from 'app/customization/functions';

// Debounce: UNA often sends several connection events for one join/leave.
let connectionsReloadTimer = null;

export default function Subscriber() {
    const { currentUser, setCurrentUser } = useCurrentUser();
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

    const onUpdateProfile = useCallback(async (data) => {
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
            emitter.emit(EVENTS.connections, {
                action: 'changed',
                object: oData,
                reload: true,
            });
            connectionsReloadTimer = null;
        }, 400);
    }, []);

    return <></>
}