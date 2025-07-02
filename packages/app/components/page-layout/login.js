import { View, Row, ScrollView } from 'app/design/view'
import { BlockByName } from 'app/components/block'
import { Text } from 'app/design/typography'
import Card from 'app/components/card'
import { Platform } from 'react-native'
import { appStatic } from 'app/lib/app-static'
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view';
import AuthPanel from 'app/ui/molecules/auth';
import { appSetting, getPageWidth } from 'app/lib/util'
import ScrollList from 'app/ui/molecules/scroll_list'
import { useRef } from 'react'
import Animated from 'react-native-reanimated';
import MenuFooter from 'app/components/nav/menu-footer';
import AnimatedView from 'app/ui/atoms/animated-view';
import { useTranslation } from 'react-i18next'

const TABLET_MODE_FROM = appSetting('layout', 'tablet_mode_from');

function PageContent(props) {
    const { t } = useTranslation()
    return (<Card rounded="rounded-3xl" margin="p-4 sm:p-6" addClassName="border border-white overflow-hidden dark:border-bdrcard-d gap-y-6">
        <View className="flex-col flex-auto gap-y-2 justify-center ">
            <Text className="text-xl sm:text-2xl text-center lg:text-left leading-none tracking-tight font-semibold text-neutral-800 dark:text-neutral-200">
                {t('splash_page_login')}
            </Text>
            <Text className="text-sm sm: text-base text-center lg:text-left text-neutral-500">
                {t('splash_page_login2')}
            </Text>
        </View>
        <BlockByName name={props.blocks.form} data={props.data} formProps={{ auto_focus: true, hide_errors: true, button_full_width: true }} />
        <AuthPanel loginLink={false} />
    </Card>)
}

export default function PageLayout(props) {
    const isWeb = Platform.OS === 'web';
    const refer = useRef();

    const content = isWeb ? (<View className={`flex-col justify-center pt-16 ${TABLET_MODE_FROM}:pt-0 mx-auto w-full min-h-[100vh] ${getPageWidth(props.uri, props.data?.config)}`}>
        <View className="w-full lg:flex-row max-w-7xl mx-auto my-auto">
            {appStatic('components_logincontent')}
            <View className="max-w-xl w-full flex-auto mx-auto p-4 sm:p-8 my-auto gap-y-4">
                <AnimatedView>
                    <View className="absolute top-4 flex shadow rounded-3xl w-full h-full bg-neutral-500 dark:bg-black blur-lg opacity-20 dark:opacity-50"></View>
                    <PageContent {...props} />
                </AnimatedView>
            </View>
        </View>
        <MenuFooter cntClasses="w-full flex-row flex-wrap opacity-80 h-16 items-center justify-center" />
    </View>) :
        <Animated.ScrollView ref={refer} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
            <View className="w-full flex-col lg:flex-row gap-y-4 mx-auto p-3 p-3 pt-20 ">
                <PageContent {...props} />
                <MenuFooter cntClasses="w-full flex-row flex-wrap opacity-80 h-16 items-center justify-center" />
            </View>
        </Animated.ScrollView>

    return (
        <ScrollList
            refer={refer}
            content={content}
            pageData={props.data}
            headerHeight={0}
            contentType="ScrollList"
        />
    );
}