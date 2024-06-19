import { useState, useEffect } from 'react';
import { fetcher } from 'app/lib/fetcher';

const useDaemon = (url, isLoadOnInit = false, isActive = true, pollingInterval = 60000) => {
    const [daemonData, setDaemonData] = useState(null);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        try {
            const sResponse = await fetcher(url);
            if (daemonData !== sResponse.data)
                setDaemonData(sResponse.data);
        } catch (e) {
            setError(e);
        }
    };

    useEffect(() => {
        if (isLoadOnInit && url != '')
            fetchData();
        if (isActive) {
            const intervalId = setInterval(fetchData, pollingInterval);

            return () => clearInterval(intervalId);
        }
    }, [url, pollingInterval]);

    useEffect(() => {
        setDaemonData(null);
    }, [url]);

    return { daemonData, error, daemonUrl: url };
};

export default useDaemon;