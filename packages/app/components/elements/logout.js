import { useRouter } from 'app/lib/hooks/router'
import { useEffect, useRef } from 'react';
import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import { useTranslation } from 'react-i18next'
import { useCurrentUser } from 'app/context/user'
import { clearClientSessionState, resetNavigationAfterSignOut } from 'app/lib/session-cleanup'

export default function ElementLogout({ data }) {
    const { t } = useTranslation();
    const router = useRouter();
    const { setCurrentUser } = useCurrentUser();
    const didCleanupRef = useRef(false);
    const uri = data?.uri === '/' || !data?.uri ? '/home' : data.uri;
    const timeout = data?.timeout;

    useEffect(() => {
        if (didCleanupRef.current) return;
        didCleanupRef.current = true;

        // Drop auth + all client caches before rewriting routes so the next
        // account cannot inherit page/query/tab state from the previous one.
        setCurrentUser(false);
        clearClientSessionState();

        const go = () => resetNavigationAfterSignOut(router, { url: uri });

        if (timeout) {
            const timeoutId = setTimeout(go, timeout);
            return () => clearTimeout(timeoutId);
        }
        go();
    }, [uri, timeout, router, setCurrentUser]);

    return (
        <View className="flex-1 items-center justify-center">
            <Text className="text-center text-foreground">{t('Logging out...')}</Text>
        </View>
    );
}
