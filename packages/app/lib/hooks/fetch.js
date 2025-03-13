import { useState, useEffect  } from 'react';
import { fetcher } from 'app/lib/fetcher';

export default function useFetchForm (url, postData) {
    const [data, setData] = useState(null);
    const error = null;
    //const loading = false;
   // const [error, setError] = useState(null);
   // const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!postData) return; // Не делать запрос, если нет данных

        const fetchData = async () => {
            //setLoading(true);
            try {
                const response = await fetcher([url, '', postData]);
                setData(response);
            } catch (err) {
               // setError(err);
            } finally {
               // setLoading(false);
            }
        };

        fetchData();
    }, [postData]); 

    return { data, error };
};