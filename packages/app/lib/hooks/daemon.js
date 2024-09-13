import { useState, useEffect, useRef } from 'react';
import { fetcher } from 'app/lib/fetcher';

const useDaemon = (url, isLoadOnInit = false, isActive = true, pollingInterval = 60000) => {
    const [daemonData, setDaemonData] = useState(null);
    const [error, setError] = useState(null);
    const timeoutId = useRef(null);  // Use ref to store the timeout ID

    // Function to fetch data
    const fetchData = async () => {
        try {
            const sResponse = await fetcher(url);
            if (daemonData !== sResponse.data) {
                setDaemonData(sResponse.data);
            }
        } catch (e) {
            setError(e);
        }

        // Schedule the next fetch only if isActive is true
        if (isActive && url) {
            timeoutId.current = setTimeout(fetchData, pollingInterval);
        }
    };

    useEffect(() => {
        // If isLoadOnInit is true, fetch data immediately on mount
        if (isLoadOnInit && url && isActive) {
            fetchData();
        } else {
            // If isLoadOnInit is false, just start the timeout for the first call
            timeoutId.current = setTimeout(fetchData, pollingInterval);
        }

        // Cleanup function to clear the timeout when component unmounts or url changes
        return () => {
            if (timeoutId.current) {
                clearTimeout(timeoutId.current);
            }
        };
    }, [url, pollingInterval, isActive]);  // Re-run effect when url or pollingInterval changes

    useEffect(() => {
        setDaemonData(null);  // Reset data when URL changes
    }, [url]);

    return { daemonData, error, daemonUrl: url };
};

export default useDaemon;