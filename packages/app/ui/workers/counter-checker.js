import { useEffect, useRef } from 'react';
import { useCurrentUser } from 'app/context/user';
import useDaemon from 'app/lib/hooks/use-daemon';
import { useSound } from 'app/lib/hooks/use-sound';
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
let inflight = null;
let lastUserId = null;

function fetchProfileOnce(userId) {
    if (lastUserId === userId && inflight) return inflight;

    lastUserId = userId;
    inflight = fetcher(PROFILE_URL)
        .then((r) => r?.data)
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
    const playSound = useSound('notif');
    const { daemonData } = useDaemon(PROFILE_URL, true, isActive, 60000);

    useEffect(() => {
        if (!currentUser?.id || !daemonData || currentUser.membership === 2) return;
        if (daemonData.id != null && daemonData.id !== currentUser.id) return;
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
            playSound();
            onNotificationsArrived();
        }

        prevNotRef.current = currentNot;
    }, [currentUser?.notifications]);
}

export function CounterCheckerSingle() {
    const { currentUser, setCurrentUser } = useCurrentUser();
    const prevNotRef = useRef(null);
    const playSound = useSound('notif');

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
            playSound();
            onNotificationsArrived();
        }

        prevNotRef.current = currentNot;
    }, [currentUser?.notifications]);

    return null;
}
