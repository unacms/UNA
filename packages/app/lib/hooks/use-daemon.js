import { useState, useEffect, useRef } from 'react';
import { fetcher } from 'app/lib/fetcher';

const useDaemon = (url, isLoadOnInit = false, isActive = true, pollingInterval = 60000) => {
    const [daemonData, setDaemonData] = useState(null);
    const [error, setError] = useState(null);
    const timeoutId = useRef(null);

    useEffect(() => {
        if (!isActive || !url) return;

        let cancelled = false;

        const fetchData = async () => {
            try {
                const sResponse = await fetcher(url);
                if (!cancelled) {
                    setDaemonData(sResponse.data);
                }
            } catch (e) {
                if (!cancelled) {
                    setError(e);
                }
            }

            if (!cancelled) {
                timeoutId.current = setTimeout(fetchData, pollingInterval);
            }
        };

        if (isLoadOnInit) {
            fetchData();
        } else {
            timeoutId.current = setTimeout(fetchData, pollingInterval);
        }

        return () => {
            cancelled = true;
            if (timeoutId.current) {
                clearTimeout(timeoutId.current);
            }
        };
    }, [url, pollingInterval, isActive, isLoadOnInit]);

    useEffect(() => {
        setDaemonData(null);
    }, [url]);

    return { daemonData, error, daemonUrl: url };
};

export default useDaemon;