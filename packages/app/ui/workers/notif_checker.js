import { useState, useEffect, useRef, useContext } from 'react';
import { useCurrentUser } from 'app/context/user';
import useDaemon from 'app/lib/hooks/daemon'
import { fetcher } from 'app/lib/fetcher'

export default function (oProps) {
   
    let { currentUser, setCurrentUser } = useCurrentUser();
    const { daemonData, error } = useDaemon("/api.php?r=bx_notifications/get_unread_notifications_num&params[]=", false, true, 1000);

    useEffect(() => {
        console.log('NotifChecker', daemonData, currentUser.notifications);
        if (daemonData && daemonData != currentUser.notifications) {
            currentUser.notifications = daemonData;
            setCurrentUser({ ...currentUser });
        }
        
    }, [daemonData]);
}

export function ClearNotif () {
    let { currentUser, setCurrentUser } = useCurrentUser();
    
    if (currentUser.notifications > 0){
        currentUser.notifications = 0;
        setCurrentUser({ ...currentUser });
        fetcher('/api.php?r=bx_notifications/mark_as_read/')
    }
    return <></>
}
