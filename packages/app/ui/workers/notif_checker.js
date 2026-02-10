import { useEffect } from 'react';
import { useCurrentUser } from 'app/context/user';
import useDaemon from 'app/lib/hooks/daemon'
export default function (oProps) {

    const { currentUser, setCurrentUser } = useCurrentUser();
    const { daemonData, error } = useDaemon("/api.php?r=bx_notifications/get_unread_notifications_num&params[]=", false, currentUser?.id > 0, 10000);
    useEffect(() => {
        if (currentUser) {
            if (daemonData != null) {
                const newNotifs = Number(daemonData);
                setCurrentUser({
                    notifications: newNotifs,
                });
            }
        }
    }, [daemonData, currentUser?.id]);


}

