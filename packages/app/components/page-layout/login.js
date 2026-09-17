import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Platform } from 'react-native'
import { appStatic } from 'app/lib/app-static'
import AuthPanel from 'app/ui/molecules/auth/auth'
import Page from 'app/ui/molecules/page/page'
import MenuFooter from 'app/components/nav/menu-footer'
import { useTranslation } from 'react-i18next'
import Link from 'app/ui/atoms/link'
import { getPageContentWidth } from 'app/lib/util'
function PageContent({ children }) {
    const { t } = useTranslation()

    return (
        <View className="w-full justify-center  mx-auto">
            <View className="gap-4">
                {children}
                <AuthPanel showSeparator={true} forgotPasswordLink={true} />

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
            </View>
        </View>
    )
}

export default function PageLayout({ data, children, pageClasses }) {
    const { padding, gap } = pageClasses ?? {};
    const contentWidth = getPageContentWidth(data?.layout, data?.uri)
    const isWeb = Platform.OS === 'web'
    const showLoginAside = data?.layout === 'layout_1_column_half'

    return (
        <Page data={data}>
            <View className={`${contentWidth} ${padding} ${gap} mx-auto my-auto`}>
                    {showLoginAside && isWeb
                        ? appStatic('components_logincontent')
                        : null}
                    <View className={`w-full mx-auto ${contentWidth}`}>
                        <PageContent>{children}</PageContent>
                    </View>
            </View>
            <MenuFooter />
        </Page>
    )
}
