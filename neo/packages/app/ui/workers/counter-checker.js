import { useEffect, useRef } from 'react';
import { useCurrentUser } from 'app/context/user';
import useDaemon from 'app/lib/hooks/use-daemon';
import { playCue } from 'app/lib/sound';
import { useAppState } from 'app/lib/hooks/use-app-state';
import { fetcher } from 'app/lib/fetcher';
import { appSetting } from 'app/lib/util';
import { clearCachedConductorState, markNotificationsConductorStale } from 'app/lib/cache/native-conductor-cache';
import emitter, { EVENTS } from 'app/context/emitter';

function onNotificationsArrived() {
    // Url-only: covers navigator / notif layout keys after normalizeConductorCacheUrl.
    clearCachedConductorState(null, appSetting('notifications', 'url'));
    markNotificationsConductorStale();
    emitter.emit(EVENTS.notifications, { action: 'arrived' });
}

const PROFILE_URL = '/api.php?r=system/profile_info/TemplServiceProfiles';
// Remounts on navigation must not refetch profile_info: one request per minute at most.
const THROTTLE_MS = 60000;
let inflight = null;
let lastUserId = null;
let lastData = null;
let lastFetchAt = 0;

function rememberProfile(userId, data) {
    lastUserId = userId;
    lastData = data;
    lastFetchAt = Date.now();
}

function fetchProfileOnce(userId) {
    if (lastUserId === userId) {
        if (inflight) return inflight;
        if (lastData && Date.now() - lastFetchAt < THROTTLE_MS) return Promise.resolve(lastData);
    }

    lastUserId = userId;
    lastData = null;
    inflight = fetcher(PROFILE_URL)
        .then((r) => {
            const data = r?.data;
            if (data && lastUserId === userId) rememberProfile(userId, data);
            return data;
        })
        .finally(() => {
            inflight = null;
        });

    return inflight;
}

export default function CounterChecker({ }) {
    const { currentUser, setCurrentUser } = useCurrentUser();
    const isAppActive = useAppState();
    const isActive = (!!currentUser && currentUser?.membership != 2) && isAppActive;
    const prevNotRef = useRef(null);
    // The first request goes through the throttle; the daemon only polls after that.
    const { daemonData } = useDaemon(PROFILE_URL, false, isActive, THROTTLE_MS);

    useEffect(() => {
        if (!isActive || !currentUser?.id) return;

        fetchProfileOnce(currentUser.id).then((data) => {
            if (!data) return;
            if (data.id != null && data.id !== currentUser.id) return;
            setCurrentUser(data);
        }).catch(console.error);
    }, [isActive, currentUser?.id, setCurrentUser]);

    useEffect(() => {
        if (!currentUser?.id || !daemonData || currentUser.membership === 2) return;
        if (daemonData.id != null && daemonData.id !== currentUser.id) return;
        rememberProfile(currentUser.id, daemonData);
        setCurrentUser(daemonData);
    }, [daemonData, currentUser?.id]);

    useEffect(() => {
        const currentNot = currentUser?.notifications ?? 0;
        if (prevNotRef.current == null) {
            prevNotRef.current = currentNot;
            return;
        }
        const prevNot = prevNotRef.current;

        if (currentNot > prevNot) {
            // One cue per poll that finds new notifications, however many arrived.
            playCue('ready');
            onNotificationsArrived();
        }

        prevNotRef.current = currentNot;
    }, [currentUser?.notifications]);
}

export function CounterCheckerSingle() {
    const { currentUser, setCurrentUser } = useCurrentUser();
    const prevNotRef = useRef(null);

    useEffect(() => {
        if (!currentUser?.id || currentUser.membership === 2) return;

        fetchProfileOnce(currentUser.id).then((data) => {
            if (!data) return;
            if (data.id != null && data.id !== currentUser.id) return;
            setCurrentUser(data);
        }).catch(console.error);
    }, [currentUser?.id, currentUser?.membership, setCurrentUser]);

    useEffect(() => {
        const currentNot = currentUser?.notifications ?? 0;
        if (prevNotRef.current == null) {
            prevNotRef.current = currentNot;
            return;
        }
        const prevNot = prevNotRef.current;

        if (currentNot > prevNot) {
            // One cue per poll that finds new notifications, however many arrived.
            playCue('ready');
            onNotificationsArrived();
        }

        prevNotRef.current = currentNot;
    }, [currentUser?.notifications]);

    return null;
}
