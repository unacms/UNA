
import { Theme } from 'app/design/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CurrentUserProvider } from 'app/context/user';
import Tabs from 'app/components/nav/tabs';
import React, { useMemo } from 'react';

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

    return (
        <SafeAreaView edges={['left', 'right', 'bottom']} style={containerStyle}>
            <CurrentUserProvider>
                <Tabs />
            </CurrentUserProvider>
        </SafeAreaView>
    );
});

export default AppLayout;
