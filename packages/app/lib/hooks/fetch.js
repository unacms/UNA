import { useState, useEffect, useEffectEvent, useRef } from 'react';
import { fetcher } from 'app/lib/fetcher';

export default function useFetchForm(url, postData) {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const request = useRef(null);

    const submit = useEffectEvent(async (body, signal) => {
        if (!url) return null;
        return fetcher([url, '', body], false, { signal });
    });

    // Changing endpoints cancels old work without replaying a submitted POST.
    useEffect(() => () => request.current?.abort(), [url]);

    useEffect(() => {
        if (!postData) return;
        const controller = new AbortController();
        request.current = controller;
        submit(postData, controller.signal).then((response) => {
            if (!controller.signal.aborted && response) {
                setError(null);
                setData(response);
            }
        }).catch((error) => {
            if (!controller.signal.aborted) setError(error);
        });
        return () => controller.abort();
    }, [postData]);

    return { data, error };
}
