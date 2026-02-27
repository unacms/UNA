import { useEffect, useRef } from 'react';
import { useCurrentUser } from 'app/context/user';
import useDaemon from 'app/lib/hooks/daemon'
import { useSound } from 'app/lib/hooks/useSound';

export default function CounterChecker({ }) {
    const { currentUser, setCurrentUser } = useCurrentUser();
    const isActive = currentUser?.membership != 2;
    const prevNotRef = useRef(currentUser?.notifications ?? 0);
    const playSound = useSound('notif');
    const { daemonData, error } = useDaemon("/api.php?r=system/profile_info/TemplServiceProfiles", true, isActive, 60000);
    useEffect(() => {
        if (currentUser) {
            if (daemonData != null && currentUser?.membership != 2) {// disabled for account profile
                setCurrentUser(daemonData);
            }
        }
    }, [daemonData, currentUser?.id]);

    useEffect(() => {
        if (currentUser && daemonData != null && currentUser?.membership != 2) {
            setCurrentUser(daemonData);
        }
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

