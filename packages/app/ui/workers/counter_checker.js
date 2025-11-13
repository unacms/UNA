import { useEffect } from 'react';
import { useCurrentUser } from 'app/context/user';
import useDaemon from 'app/lib/hooks/daemon'

export default function (oProps) {
    const { currentUser, setCurrentUser } = useCurrentUser();
    const isActive = currentUser?.id > 0 && currentUser?.membership != 2;
    const { daemonData, error } = useDaemon("/api.php?r=system/profile_info/TemplServiceProfiles", false, isActive, 10000);
    useEffect(() => {
        if (currentUser) {
            if (daemonData != null && currentUser?.membership != 2) {// disabled for account profile
                setCurrentUser(daemonData);
            }
        }
    }, [daemonData, currentUser?.id]);
}

