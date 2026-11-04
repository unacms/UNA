"use client"

import React, { useEffect, useCallback } from 'react';
import { useCurrentUser } from 'app/context/user';
import { storageClear } from 'app/lib/util';
import { fetcher } from 'app/lib/fetcher';
import { subscribe } from 'app/ui/atoms/socket';
import emitter, { EVENTS } from 'app/context/emitter'
import { checkActionsOnConnectionsChanged } from 'app/customization/functions';

// Socket channels are public, so UNA's events only say what changed: the signed-in
// profile is reloaded through the API, with the viewer's session.
const PROFILE_URL = '/api.php?r=system/profile_info/TemplServiceProfiles';

// Debounce: UNA often sends several connection events for one join/leave.
let connectionsReloadTimer = null;
let connectionsPending = { update_user: false, reload_page: false };

export default function Subscriber() {
    const { currentUser, setCurrentUser } = useCurrentUser();

    const onUpdateAccount = useCallback((data) => {
        setCurrentUser({
            confirmed: true,
        });
    }, []);

    // isActive() turns false once the subscription for userId is cleaned up (the viewer
    // switched profile or signed out), so a late reply can't write the old profile back.
    const reloadCurrentUser = useCallback(async (userId, isActive) => {
        const data = (await fetcher(PROFILE_URL))?.data;
        if (!isActive()) return;
        // A reply for another profile means the viewer switched while it was on its way.
        if (data?.id != null && data.id == userId) {
            setCurrentUser(data);
        }
    }, [setCurrentUser]);

    // Fires when this user's connections change on the server (join/leave, friends, etc.).
    const onUpdateConnections = useCallback((data, userId, isActive) => {
        storageClear();
        const oData = JSON.parse(data);
        const oActions = checkActionsOnConnectionsChanged(oData);
        if (!oActions?.update_user && !oActions?.reload_page) return;

        connectionsPending = {
            update_user: connectionsPending.update_user || !!oActions.update_user,
            reload_page: connectionsPending.reload_page || !!oActions.reload_page,
        };
        clearTimeout(connectionsReloadTimer);
        connectionsReloadTimer = setTimeout(() => {
            const pending = connectionsPending;
            connectionsPending = { update_user: false, reload_page: false };
            connectionsReloadTimer = null;

            if (pending.update_user) {
                reloadCurrentUser(userId, isActive).catch(console.error);
            }
            if (pending.reload_page) {
                emitter.emit(EVENTS.connections, {
                    action: 'changed',
                    object: oData,
                    reload: true,
                });
            }
        }, 400);
    }, [reloadCurrentUser]);

    useEffect(() => {
        if (!currentUser?.id) return

        const userId = currentUser.id;
        let active = true;
        const isActive = () => active;
        const sub1 = subscribe('sys_connections_' + userId, 'changed', (data) => onUpdateConnections(data, userId, isActive));
        const sub3 = subscribe('profile_' + userId, 'changed', () => {
            reloadCurrentUser(userId, isActive).catch(console.error);
        });

        return () => {
            active = false;
            sub1();
            sub3();
            clearTimeout(connectionsReloadTimer);
            connectionsReloadTimer = null;
            connectionsPending = { update_user: false, reload_page: false };
        };

    }, [currentUser?.id, onUpdateConnections, reloadCurrentUser])

    return <></>
}
