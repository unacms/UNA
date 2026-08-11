import { useEffect, useRef } from 'react';
import { useCurrentUser } from 'app/context/user';
import useDaemon from 'app/lib/hooks/daemon';
import { useSound } from 'app/lib/hooks/useSound';
import { useAppState } from 'app/lib/hooks/useAppState';
import { fetcher } from 'app/lib/fetcher';

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
    const prevNotRef = useRef(currentUser?.notifications ?? 0);
    const playSound = useSound('notif');
    const { daemonData } = useDaemon(PROFILE_URL, true, isActive, 60000);

    useEffect(() => {
        if (!currentUser?.id || !daemonData || currentUser.membership === 2) return;
        if (daemonData.id != null && daemonData.id !== currentUser.id) return;
        setCurrentUser(daemonData);
    }, [daemonData, currentUser?.id]);

    useEffect(() => {
        const prevNot = prevNotRef.current;
        const currentNot = currentUser?.notifications ?? 0;

        if (currentNot > prevNot) {
            playSound();
        }

        prevNotRef.current = currentNot;
    }, [currentUser?.notifications]);
}

export function CounterCheckerSingle() {
    const { currentUser, setCurrentUser } = useCurrentUser();
    const prevNotRef = useRef(currentUser?.notifications ?? 0);
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
        const prevNot = prevNotRef.current;
        const currentNot = currentUser?.notifications ?? 0;

        if (currentNot > prevNot) {
            playSound();
        }

        prevNotRef.current = currentNot;
    }, [currentUser?.notifications]);

    return null;
}