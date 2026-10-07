import { useState, useEffect, useEffectEvent, useRef } from 'react';
import { fetcher } from 'app/lib/fetcher';

/** POST `postData` to `url` whenever it changes; aborts on endpoint change / unmount. */
export default function useFetchForm(url: string | null | undefined, postData: BodyInit | null | undefined) {
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<unknown>(null);
    const request = useRef<AbortController | null>(null);

    const submit = useEffectEvent(async (body: BodyInit, signal: AbortSignal) => {
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
