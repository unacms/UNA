import { View, Row } from 'app/design/view'
import { BlockByName } from 'app/components/block'
import { Text } from 'app/design/typography'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from 'app/ui/molecules/card'
import { Platform } from 'react-native'
import { appStatic } from 'app/lib/app-static'
import AuthPanel from 'app/ui/molecules/auth';
import { appSetting, getPageWidth } from 'app/lib/util'
import ScrollList from 'app/ui/molecules/scroll_list'
import { useRef } from 'react'
import MenuFooter from 'app/components/nav/menu-footer';
import AnimatedView from 'app/ui/atoms/animated-view';
import { useTranslation } from 'react-i18next'
import Link from 'app/ui/atoms/link'

const TABLET_MODE_FROM = appSetting('layout', 'tablet_mode_from');

function PageContent(props) {
    const { t } = useTranslation()
    return (
        <Card padding="p-0 pb-4" className="bg-card/50">
        <AnimatedView direction="up" delay={300}>
        <Card padding="p-6  ">
            <CardHeader>
                <CardTitle>{t('login_modal_title')} {t('app_name')}</CardTitle>
                <CardDescription>
                    {t('splash_page_login')}
                
                </CardDescription>
            </CardHeader>
            <CardContent className="gap-4">
                <BlockByName
                    name="system:login_form"
                    contentOnly={true}
                    data={props.data}
                    formProps={{ hide_errors: true, button_full_width: true }}
                />
                <Row className="text-center text-sm items-center text-muted-foreground">
                    <Link
                        className="mx-auto"
                        variant="primary"
                        size="sm"
                        href="/forgot-password"
                        haptics="Medium"
                    >
                        {t('Forgot password?')}
                    </Link>
                </Row>
                <AuthPanel showSeparator={true} />
            </CardContent>
        </Card></AnimatedView>
        <CardFooter>
                <Row className="text-center flex-none mx-auto text-base items-center gap-1">
                    <Text className="text-muted-foreground text-base">{t('splash_page_login2')}</Text>
                    <Link
                        variant="primary"
                        size="md"
                        href="/create-account"
                        haptics="Medium"
                    >
                        {t('splash_page_new_account')}
                    </Link>
                </Row>
        </CardFooter>
        </Card>
        )
}

export default function PageLayout(props) {
    const isWeb = Platform.OS === 'web';
    const refer = useRef();

    const content = isWeb ? (<View className={`flex-col justify-center pt-16 ${TABLET_MODE_FROM}:pt-0 mx-auto w-full web:min-h-[calc(100vh-16rem)] ${getPageWidth(props.uri, props.data?.config)}`}>
        <View className="w-full lg:flex-row max-w-7xl mx-auto my-auto">
            {appStatic('components_logincontent')}
            <View className="max-w-xl w-full flex-auto mx-auto p-4 sm:p-8 my-auto gap-y-4">
                <AnimatedView>
                    <PageContent {...props} />
                </AnimatedView>
            </View>
        </View>
        <MenuFooter cntClasses="w-full flex-row flex-wrap opacity-80 h-16 items-center justify-center" />
    </View>) : (

        <View className="w-full flex-col lg:flex-row gap-y-4 mx-auto p-3 p-3 py-16 ">
            <PageContent {...props} />
            <MenuFooter cntClasses="w-full flex-row flex-wrap opacity-80 h-16 items-center justify-center" />
        </View>)


    return (
        <ScrollList
            refer={refer}
            content={content}
            pageData={props.data}
            headerHeight={isWeb ? 0 : 64}
            contentType="ScrollList"
        />
    );
}