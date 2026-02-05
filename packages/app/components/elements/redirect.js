import { useRouter, redirectTo } from 'app/lib/hooks/router'
import { useEffect } from 'react';
import { BlockWrapper } from 'app/components/block-wrapper'

export default function ElementRedirect({data, blockWrapperProps}) {
    const router = useRouter();
    const uri = data?.uri === '/' || !data?.uri ? '/home' : data.uri;
    const timeout = data?.timeout;
    useEffect(() => {
        if (timeout) {
            setTimeout(() => redirectTo(router, uri), timeout);
        } else {
            redirectTo(router, uri);
        }
    }, [uri, timeout]);

    return timeout ? null : null;
}