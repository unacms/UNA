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
import { getUnaPageLayoutClasses } from 'app/lib/util'

const LOGIN_FULL_WIDTH = {
    shell: 'w-full max-w-8xl p-4 mx-auto my-auto',
    content: 'w-full mx-auto',
}

function PageContent({ children }) {
    const { t } = useTranslation()

    return (
        <View className="w-full justify-center max-w-md mx-auto">
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

export default function PageLayout({ data, children, columnLayout = '' }) {
    const isWeb = Platform.OS === 'web'
    const unaLayout = getUnaPageLayoutClasses(columnLayout) ?? LOGIN_FULL_WIDTH
    const showLoginAside = columnLayout === 'layout_1_column_half'

    return (
        <Page data={data}>
            {isWeb ? (
                <View className={unaLayout.shell}>
                    {showLoginAside
                        ? appStatic('components_logincontent')
                        : null}
                    <View className={unaLayout.content}>
                        <PageContent>{children}</PageContent>
                    </View>
                </View>
            ) : (
                <View className="flex-1">
                    <PageContent>{children}</PageContent>
                </View>
            )}
            <MenuFooter />
        </Page>
    )
}
