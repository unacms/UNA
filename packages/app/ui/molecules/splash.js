import { View, Row } from 'app/design/view'
import { Text, H2 } from 'app/design/typography'
import {
    Card,
    CardHeader,
    CardDescription,
    CardContent,
    CardFooter,
    CardTitle,
    CardIcon,
} from 'app/ui/molecules/card'
import { appSetting } from 'app/lib/util'
import { Platform } from 'react-native'
import { appStatic } from 'app/lib/app-static'
import AuthPanel from 'app/ui/molecules/auth'
import { BlockByName } from 'app/components/block'
import MenuFooter from 'app/components/nav/menu-footer'
import { useTranslation } from 'react-i18next'
import Link from 'app/ui/atoms/link'
import Page from 'app/ui/molecules/page'
import { Icon } from 'app/ui/atoms/icon'
/**
 * Renders the login splash screen with adaptive layouts for web and mobile platforms.
 *
 * Displays an illustration, splash text, and a login form with options for password recovery and account creation. Layout and styling adjust based on platform and theme. Footer content is included at the bottom of the screen.
 *
 * @param {object} props - Component properties, including optional login form data.
 */

function PageContent({ data }) {
    const { t } = useTranslation()
    return (
        <View className="w-full justify-center max-w-md mx-auto">
            <View>
                <Card
                    role="form"
                    titleId="login-card-title"
                    aria-describedby="login-card-description"
                    className="py-6 gap-4 sm:gap-6"
                >
                    <CardHeader className="items-center sm:px-6">
                        <CardIcon id="login-card-icon">
                            <Icon icon="UserRoundCheck" width={32} height={32} className="w-6 h-6 sm:w-8 sm:h-8" />
                        </CardIcon>
                        <CardTitle id="login-card-title">
                            {t('login_modal_title')}
                        </CardTitle>
                        <CardDescription id="login-card-description">
                            {t('splash_page_login')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="sm:px-6 gap-4">
                        <BlockByName
                            name="system:login_form"
                            contentOnly={true}
                            data={data}
                            formProps={{
                                hide_errors: true,
                                button_full_width: true,
                            }}
                        />
                        <AuthPanel
                            forgotPasswordLink={true}
                            showSeparator={true}
                        />
                    </CardContent>
                    <CardFooter className="sm:px-6">
                        <Row
                            className="mx-auto gap-1 justify-center items-center text-center"
                            accessibilityRole="text"
                            accessibilityLabel={`${t('splash_page_login2')} ${t(
                                'splash_page_new_account',
                            )}`}
                        >
                            <Text
                                className="text-secondary-foreground text-base"
                                accessibilityRole="text"
                            >
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

export default function Splash(props) {
    const isWeb = Platform.OS == 'web'
    return (
        <Page>
            <View className={`flex-1 gap-4 p-4 justify-center w-full mx-auto lg:flex-row ${appSetting(
                    'layout',
                    'max_width_content',
                )}`}
            >
                {appStatic('splash_text')}
                <PageContent {...props} />
            </View>
            <MenuFooter
                cntClasses='flex w-full items-center border-t border-border/60 justify-center flex-row flex-wrap gap-3 p-4 min-h-14'
            />
        </Page>
    )
}
