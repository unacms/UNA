import { View } from 'app/design/view'
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
    return (<Card padding="p-4 sm:p-6">
        <CardHeader>
            <CardTitle>
                {t('splash_page_login')}
            </CardTitle>
            <CardDescription>
                {t('splash_page_login2')}{' '}
                                    <Link variant="accent" size="sm" href="/create-account">{t('splash_page_new_account')}</Link>
                                    .
            </CardDescription>
        </CardHeader> 
        <CardContent>
            <BlockByName contentOnly={true} name={props.blocks.form} data={props.data} formProps={{ auto_focus: true, hide_errors: true, button_full_width: true }} />
        </CardContent>
        <CardFooter>
            <AuthPanel loginLink={false} />
        </CardFooter>
    </Card>)
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

        <View className="w-full flex-col lg:flex-row gap-y-4 mx-auto p-3 p-3 pt-20 ">
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