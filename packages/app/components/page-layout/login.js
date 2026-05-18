import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import {
    Card,
    CardHeader,
    CardDescription,
    CardContent,
    CardFooter,
    CardTitle,
    CardIcon,
} from 'app/ui/molecules/card'
import { Platform } from 'react-native'
import { appStatic } from 'app/lib/app-static'
import AuthPanel from 'app/ui/molecules/auth'
import Page from 'app/ui/molecules/page'
import MenuFooter from 'app/components/nav/menu-footer'
import { useTranslation } from 'react-i18next'
import Link from 'app/ui/atoms/link'
import { Icon } from 'app/ui/atoms/icon'


function PageContent({ children, isLoginPage, title }) {
    const { t } = useTranslation()
    if (!isLoginPage) {
        return (
            <View>
               {children}
            </View>
        )
    }

    return (
        <View className="w-full justify-center max-w-lg p-4 mx-auto">
            <View className="gap-4">
                <Card role="form"
                    titleId="login-page-title"
                    aria-describedby="login-card-description"
                    className="sm:py-6 gap-4 sm:gap-6 max-w-sm w-full mx-auto"
                >
                    <CardHeader className="items-center sm:px-6">
                        <CardIcon id="login-card-icon">
                            <Icon icon="UserRound" width={32} height={32} className="w-6 h-6 sm:w-8 sm:h-8" />
                        </CardIcon>
                        <CardTitle className="text-center lg:text-start">
                            {t('login_page_title')}
                        </CardTitle>

                        <CardDescription id="login-card-description">{t('login_page_text')}</CardDescription>
                    </CardHeader>
                    <CardContent className="sm:px-6 gap-4">

                        {children}
                        <AuthPanel showSeparator={true} forgotPasswordLink={true} />

                    </CardContent>
                    <CardFooter className="sm:px-6">
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
                    </CardFooter>
                </Card>
            </View>
        </View>
    )
}

export default function PageLayout({ data, children }) {
    const isWeb = Platform.OS === 'web'
    const isLoginPage = data.uri === 'login'

    return (
        <Page data={data}>
            {isWeb ? (
                    <View className="w-full lg:flex-row max-w-7xl p-4 lg:p-6 mx-auto my-auto">
                        {isLoginPage ? appStatic('components_logincontent') : null}
                        <View className="w-full lg:w-1/2 mx-auto">
                            
                                <PageContent
                                    isLoginPage={isLoginPage}
                                    title={data.title}
                                >
                                    {children}
                                </PageContent>
                           
                        </View>
                    </View>
            ) : (
                <View className="flex-1">
                    <PageContent isLoginPage={true}>{children}</PageContent>
                </View>
            )}
            <MenuFooter />
        </Page>
    )
}
