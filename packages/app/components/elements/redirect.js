import { useRouter, redirectTo } from 'app/lib/hooks/router'
import { useEffect } from 'react';
import { Loading } from 'app/loading'
import { View } from 'app/design/view'

export default function ElementRedirect({data}) {
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

    return timeout ? <View className='w-full'><Loading /></View> : null;
}