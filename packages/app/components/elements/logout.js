import { useRouter, usePathname, redirectTo } from 'app/lib/hooks/router'
import { useEffect } from 'react';
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'

export default function ElementLogout({data}) {
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

    return <View className="flex-1 items-center justify-center"><Text className="text-center text-foreground">Logging out...</Text></View>;

}
