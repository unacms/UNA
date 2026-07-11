import { useRouter, usePathname, redirectTo } from 'app/lib/hooks/router'
import { getTabKeyFromPathname } from 'app/lib/tab-history'
import { useEffect } from 'react';
import { Text } from 'app/design/typography'
import { View, Row } from 'app/design/view'
import { useTranslation } from 'react-i18next'

export default function ElementLogout({data}) {
    const { t } = useTranslation();
    const router = useRouter();
    const pathname = usePathname();
    const uri = data?.uri === '/' || !data?.uri ? '/home' : data.uri;
    const timeout = data?.timeout;
    useEffect(() => {
        const currentTab = getTabKeyFromPathname(pathname);
        if (timeout) {
            const timeoutId = setTimeout(() => redirectTo(router, uri, currentTab), timeout);
            return () => clearTimeout(timeoutId);
        }
        redirectTo(router, uri, currentTab);
    }, [uri, timeout]);

    return <View className="flex-1 items-center justify-center"><Text className="text-center text-foreground">{t('Logging out...')}</Text></View>;

}
