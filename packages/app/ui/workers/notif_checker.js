import { useEffect } from 'react';
import { useCurrentUser } from 'app/context/user';
import useDaemon from 'app/lib/hooks/daemon'
export default function (oProps) {

    let { currentUser, setCurrentUser } = useCurrentUser();

    if (currentUser) {
        const { daemonData, error } = useDaemon("/api.php?r=bx_notifications/get_unread_notifications_num&params[]=", false, true, 10000);
        useEffect(() => {
            if (daemonData != null) {
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

