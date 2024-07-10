
import { Theme } from 'app/design/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CurrentUserProvider } from 'app/context/user';
import Tabs from 'app/components/nav/tabs';
import React, { useMemo } from 'react';
import * as Notifications from 'expo-notifications';

const AppLayout = React.memo(() => {
    const { colors } = Theme();

    const containerStyle = useMemo(() => ({
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '100%',
        backgroundColor: colors.barsBackground,
    }), [colors.barsBackground]);

    useEffect(() => {
        async function registerForPushNotificationsAsync() {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                alert('Failed to get push token for push notification!');
                return;
            }
        }
        registerForPushNotificationsAsync();

        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: true,
            }),
        });

    }, []);

    return (
        <SafeAreaView edges={['left', 'right', 'bottom']} style={containerStyle}>
            <CurrentUserProvider>
                <Tabs />
            </CurrentUserProvider>
        </SafeAreaView>
    );
});

export default AppLayout;
