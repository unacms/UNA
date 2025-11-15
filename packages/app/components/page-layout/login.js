import { View, Row } from 'app/design/view'
import { BlockByName, BlockByData } from 'app/components/block'
import { Text, H2 } from 'app/design/typography'
import {
    Card,
    CardHeader,
    CardDescription,
    CardContent,
    CardFooter,
    CardTitle,
} from 'app/ui/molecules/card'
import { Platform } from 'react-native'
import { appStatic } from 'app/lib/app-static'
import AuthPanel from 'app/ui/molecules/auth'
import { appSetting, getPageWidth } from 'app/lib/util'
import ScrollList from 'app/ui/molecules/scroll_list'
import { useRef } from 'react'
import MenuFooter from 'app/components/nav/menu-footer'
import AnimatedView from 'app/ui/atoms/animated-view'
import { useTranslation } from 'react-i18next'
import Link from 'app/ui/atoms/link'

import { BlockDataByName } from 'app/lib/util'
const TABLET_MODE_FROM = appSetting('layout', 'tablet_mode_from')

function PageContent({ children, isLoginPage, title }) {
    const { t } = useTranslation()

    if (!isLoginPage) {
        return (
            <AnimatedView direction="up" delay={300}>
                <Card padding="p-6 max-w-xl w-full mx-auto">
                    <CardHeader>
                        <CardTitle>{title}</CardTitle>
                    </CardHeader>
                    <CardContent className="gap-4">{children}</CardContent>
                </Card>
            </AnimatedView>
        )
    }

    return (
        <View className="w-full justify-center p-4 sm:p-8 md:p-12 p-6 ">

            <AnimatedView className="gap-4" direction="up" delay={200}>
            <Card padding="p-6 max-w-xl w-full mx-auto">
                    <CardHeader>
                            <CardTitle>
                            {t('login_modal_title')}
                            </CardTitle> 
                        
                        <CardDescription>{t('splash_page_login')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {children}
                        <Row className="text-center text-sm items-center text-muted-foreground">
                            <Link
                                className="mx-auto"
                                variant="plain"
                                size="sm"
                                href="/forgot-password"
                                haptics="Medium"
                            >
                                {t('Forgot password?')}
                            </Link>
                        </Row>
                        <AuthPanel showSeparator={true} />
                    </CardContent>
                </Card>

                <Row className=" mx-auto gap-1 justify-center items-center text-center">
                    <Text className="text-base text-secondary-foreground">
                        {t('splash_page_login2')}
                    </Text>
                    <Link
                        variant="accent"
                        size="md"
                        href="/create-account"
                        haptics="Medium"
                    >
                        {t('splash_page_new_account')}
                    </Link>
                </Row>
            </AnimatedView>
        </View>
    )
}

export default function PageLayout(props) {
    const isWeb = Platform.OS === 'web'
    const refer = useRef()
    const isLoginPage = props.uri === 'login'

    const content = isWeb ? (
        <View
            className={`flex-col justify-center pt-16 ${TABLET_MODE_FROM}:pt-0 mx-auto w-full web:min-h-[calc(100vh-20rem)] ${getPageWidth(
                props.uri,
                props.data?.config
            )}`}
        >
            <View className="w-full lg:flex-row max-w-7xl mx-auto my-auto">
                {isLoginPage ? appStatic('components_logincontent') : null}
                <View className="max-w-xl w-full mx-auto">
                    <AnimatedView>
                        <PageContent
                            isLoginPage={isLoginPage}
                            title={props.data.title}
                        >
                            {props.children}
                        </PageContent>
                    </AnimatedView>
                </View>
            </View>
            <MenuFooter
                cntClasses="flex w-full items-center border-t border-border/60 justify-center flex-row flex-wrap gap-2 p-3 mt-3"
                variant="ghost"
                size="sm"
                itemClassName="text-sm p-1"
            />
        </View>
    ) : (
        <View className="w-full flex-col lg:flex-row gap-y-4 mx-auto ">
            <PageContent isLoginPage={true}>{props.children}</PageContent>
            <MenuFooter
                cntClasses="flex w-full items-center border-t border-border/40 justify-center flex-row flex-wrap gap-4 p-4"
                variant="ghost"
                size="sm"
                itemClassName=""
            />
        </View>
    )

    return (
        <ScrollList
            refer={refer}
            content={content}
            pageData={props.data}
            headerHeight={isWeb ? 0 : 48}
            contentType="ScrollList"
        />
    )
}
