import { View, ScrollView } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls'
import Card from 'app/components/card'
import { appSetting } from 'app/lib/util'
import { Platform } from 'react-native'
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view'
import { appStatic } from 'app/lib/app-static'
import AuthPanel from 'app/ui/molecules/auth'
import { useRef } from 'react';
import { BlockByName } from 'app/components/block'
import MenuFooter from 'app/components/nav/menu-footer';
import AnimatedView from 'app/ui/atoms/animated-view';
import { useTranslation } from 'react-i18next'
import ScrollList from 'app/ui/molecules/scroll_list'
import Animated from 'react-native-reanimated';
/**
 * Renders the login splash screen with adaptive layouts for web and mobile platforms.
 *
 * Displays an illustration, splash text, and a login form with options for password recovery and account creation. Layout and styling adjust based on platform and theme. Footer content is included at the bottom of the screen.
 *
 * @param {object} props - Component properties, including optional login form data.
 */

const TABLET_MODE_FROM = appSetting('layout', 'tablet_mode_from');

function PageContent(props) {
    const { t } = useTranslation()
    return (<Card rounded="rounded-3xl" margin="p-4 sm:p-6" addClassName="border border-white overflow-hidden dark:border-bdrcard-d gap-y-6">
        <View className="flex-col flex-auto gap-y-2 justify-center ">
            <Text className="text-xl sm:text-2xl text-center lg:text-left leading-none tracking-tight font-semibold text-neutral-800 dark:text-neutral-200">
                {t("splash_page_login")}
            </Text>
            <Text className="text-sm sm: text-base text-center lg:text-left text-neutral-500">
                {t("splash_page_login2")}
            </Text>
        </View>
        <BlockByName
            name="system:login_form"
            data={props.data}
            formProps={{ auto_focus: true, hide_errors: true, button_full_width: true }}
        />
        <AuthPanel loginLink={false} />
    </Card>);
}

export default function Splash(props) {
    const isWeb = Platform.OS == 'web'
    const refer = useRef();
    const content = !isWeb ? (
        <Animated.ScrollView ref={refer} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <View className="w-full flex-col lg:flex-row gap-y-8 mx-auto p-3">
                {appStatic('splash_text')}
                <PageContent {...props} />
            </View>
            <MenuFooter cntClasses="w-full flex-row flex-wrap opacity-80 h-16 items-center justify-center" />
        </Animated.ScrollView>

    ) : (
        <View className={`flex-col justify-center pt-16 ${TABLET_MODE_FROM}:pt-0 min-h-[100vh] w-full`}>
            <View className="w-full lg:flex-row mx-auto my-auto max-w-8xl ">
                {appStatic('splash_text')}
                <View className="flex-col-reverse lg:flex-col max-w-xl w-full flex-auto mx-auto p-4 sm:p-8 my-auto">
                    <AnimatedView direction="up">
                        <View>
                            <View className="absolute top-4 flex shadow rounded-3xl w-full h-full bg-neutral-500 dark:bg-black blur-lg opacity-20 dark:opacity-50"></View>
                            <PageContent {...props} />
                        </View>
                    </AnimatedView>
                </View>
            </View>
            <MenuFooter cntClasses="w-full flex-row flex-wrap opacity-80 h-16 items-center justify-center" />
        </View>
    )

    return <ScrollList
        refer={refer}
        content={content}
        pageData={props.data}
        headerHeight={isWeb ? 0 : 70}
        contentType="ScrollList"
    />
}