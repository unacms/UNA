import { useEffect } from 'react';
import { useCurrentUser } from 'app/context/user';
import useDaemon from 'app/lib/hooks/daemon'
import { fetcher } from 'app/lib/fetcher'

export default function (oProps) {

    let { currentUser, setCurrentUser } = useCurrentUser();
    if (currentUser) {
        const { daemonData, error } = useDaemon("/api.php?r=bx_notifications/get_unread_notifications_num&params[]=", false, true, 10000);
        useEffect(() => {

            if (!isNaN(daemonData)) {
                const newNotifs = Number(daemonData);
                if (newNotifs !== Number(currentUser?.notifications)) {
                    setCurrentUser(prevUser => ({
                        ...prevUser,
                        notifications: newNotifs,
                    }));
                }
            }
        }, [daemonData]);
    }
}

export function ClearNotif() {
    const { currentUser, setCurrentUser } = useCurrentUser();
    useEffect(() => {
        if (currentUser?.notifications > 0) {
            setCurrentUser(prevUser => ({
                ...prevUser,
                notifications: 0,
            }));
            fetcher('/api.php?r=bx_notifications/mark_as_read/')
        }
    }, []);
    return <></>
}
