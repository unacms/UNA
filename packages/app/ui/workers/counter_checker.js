import { useEffect } from 'react';
import { useCurrentUser } from 'app/context/user';
import useDaemon from 'app/lib/hooks/daemon'
export default function (oProps) {

    let { currentUser, setCurrentUser } = useCurrentUser();
        const { daemonData, error } = useDaemon("/api.php?r=system/profile_counters/TemplServiceProfiles", false, currentUser?.id > 0, 10000);
        useEffect(() => {
            if (currentUser) {
                if (daemonData != null) {
                    const newNotifs = Number(daemonData.bx_notifications);
                    setCurrentUser({
                        counters: daemonData,
                        notifications: newNotifs,// for back compability
                    });
                }
            }
        }, [daemonData, currentUser?.id]);
}

