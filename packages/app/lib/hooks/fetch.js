import { useState, useEffect } from 'react';
import { fetcher } from 'app/lib/fetcher';

export default function useFetchForm(url, postData) {
    const [data, setData] = useState(null);
    const error = null;

    useEffect(() => {
        if (!postData) return; // Skip request when there is no data

        const fetchData = async () => {
            const response = await fetcher([url, '', postData]);
            setData(response);

        };

        fetchData();
    }, [postData]);

    return { data, error };
};