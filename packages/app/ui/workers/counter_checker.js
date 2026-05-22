import { useEffect, useRef } from 'react';
import { useCurrentUser } from 'app/context/user';
import useDaemon from 'app/lib/hooks/daemon'
import { useSound } from 'app/lib/hooks/useSound';
import { useAppState } from 'app/lib/hooks/useAppState';

export default function CounterChecker({ }) {
    const { currentUser, setCurrentUser } = useCurrentUser();
    const isAppActive = useAppState();
    const isActive = (!!currentUser &&currentUser?.membership != 2) && isAppActive;
    const prevNotRef = useRef(currentUser?.notifications ?? 0);
    const playSound = useSound('notif');
    const { daemonData, error } = useDaemon("/api.php?r=system/profile_info/TemplServiceProfiles", true, isActive, 60000);

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

