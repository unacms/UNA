import { useRouter, usePathname, redirectTo } from 'app/lib/hooks/router'
import { useEffect } from 'react';

export default function ElementRedirect({data, blockWrapperProps}) {
    const router = useRouter();
    const pathname = usePathname();
    const uri = data?.uri === '/' || !data?.uri ? '/home' : data.uri;
    const timeout = data?.timeout;
    useEffect(() => {
        const currentTab = '/' + (pathname.split('/')[1] || 'tab0');
        if (timeout) {
            const timeoutId = setTimeout(() => redirectTo(router, uri, currentTab), timeout);
            return () => clearTimeout(timeoutId);
        }
        redirectTo(router, uri, currentTab);
    }, [uri, timeout]);

    return timeout ? null : null;
}