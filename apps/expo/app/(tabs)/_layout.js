
import { Theme } from 'app/design/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CurrentUserProvider } from 'app/context/user';
import Tabs from 'app/components/nav/tabs';

export default function AppLayout() {
    const { colors } = Theme();

    return (
        <SafeAreaView edges={['left', 'right', 'bottom']} style={{
            width: '100%',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '100%',
            backgroundColor: colors.barsBackground,
        }}>
             <CurrentUserProvider>
                <Tabs/>
             </CurrentUserProvider>
        </SafeAreaView>
    );
}
