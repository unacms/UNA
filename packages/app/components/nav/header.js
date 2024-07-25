import { View, Pressable, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Icon } from 'app/ui/atoms/icon';
import { Theme } from 'app/design/theme';
import { useRouter } from "expo-router";
import { useColorScheme } from 'react-native';
import { FeedbackHaptics } from 'app/lib/util';
import { useCurrentUser } from 'app/context/user';
import { appStatic } from 'app/lib/app-static';

function SvgLogoNative() {
    const scheme = useColorScheme();
    const logo = scheme === 'dark' ? 'logo_nativedark' : 'logo_native';

    return <View className='w-32 h-10'>{appStatic(logo)}</View>;
};

export default function ({ backButtonPresented, pagePath, rightComponents, header }) {
    const type = typeof header;
    let text = type === 'string' ? header : '';

    const { currentUser } = useCurrentUser();
    const routerExpo = useRouter();
    const { colors } = Theme();
    const isHome = pagePath === '/home';

    if (isHome && currentUser) {
        text = '';
    }
    
    text = text.replace('__notification__', '');

    return (
        <Row style={{ backgroundColor: colors.barsBackground }} className="w-full justify-between items-center h-12 px-3">
            <Row>
                {(isHome && currentUser) && <SvgLogoNative />}
                {backButtonPresented && (
                    <Pressable className="mr-3 rounded-full justify-center items-center" onPress={() => { 
                        FeedbackHaptics('Medium'); 
                        routerExpo.back(); 
                    }}>
                        <Icon icon="ArrowLeft" width={24} height={24} color={colors.barsColor} />
                    </Pressable>
                )}
                {text && (
                    <View>
                        <Text className="font-bold text-neutral-800 dark:text-neutral-200 text-3xl tracking-tighter">
                            {text}
                        </Text>
                    </View>
                )}
            </Row>
            {type !== 'string' && <View className="flex-auto">{header}</View>}
            {rightComponents && <Row className="ml-2 gap-x-2">{rightComponents}</Row>}
        </Row>
    );
}
