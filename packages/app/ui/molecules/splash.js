import { View, Row } from 'app/design/view'
import { Text, H2 } from 'app/design/typography'
import {
    Card,
    CardHeader,
    CardDescription,
    CardContent,
    CardFooter,
    CardTitle,
} from 'app/ui/molecules/card'
import { appSetting } from 'app/lib/util'
import { Platform } from 'react-native'
import { appStatic } from 'app/lib/app-static'
import AuthPanel from 'app/ui/molecules/auth'
import { BlockByName } from 'app/components/block'
import MenuFooter from 'app/components/nav/menu-footer'
import AnimatedView from 'app/ui/atoms/animated-view'
import { useTranslation } from 'react-i18next'
import Link from 'app/ui/atoms/link'
import Page from 'app/ui/molecules/page'

/**
 * Renders the login splash screen with adaptive layouts for web and mobile platforms.
 *
 * Displays an illustration, splash text, and a login form with options for password recovery and account creation. Layout and styling adjust based on platform and theme. Footer content is included at the bottom of the screen.
 *
 * @param {object} props - Component properties, including optional login form data.
 */

function PageContent({data}) {
    const { t } = useTranslation()
    return (
        <View className="w-full justify-center max-w-lg p-6 sm:p-8 md:p-12 mx-auto">
            <AnimatedView className="gap-4" direction="up" delay={200}>
                <Card
                    padding="p-0 gap-5 max-w-xl w-full mx-auto "
                    role="form"
                    titleId="login-card-title"
                    aria-describedby="login-card-description"
                >
                    <CardHeader className="px-6 pt-5">
                        <CardTitle id="login-card-title" className="text-center lg:text-start">
                            {t('login_modal_title')} 
                        </CardTitle>
                        <CardDescription id="login-card-description" className="text-center lg:text-start">
                            {t('splash_page_login')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-6">
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
                    <CardFooter>
                        <Row
                            className="mx-auto gap-1 justify-center items-center text-center"
                            accessibilityRole="text"
                            accessibilityLabel={`${t('splash_page_login2')} ${t(
                                'splash_page_new_account'
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
            </AnimatedView>
        </View>
    )
}

export default function Splash(props) {
    const isWeb = Platform.OS == 'web'
    const content = isWeb ? (
        <View className="flex-col justify-center lg:pt-0 w-full ">
            <View
                className={`justify-center w-full mx-auto lg:flex-row ${appSetting(
                    'layout',
                    'max_width_content'
                )}`}
            >
                {appStatic('splash_text')}
                <PageContent {...props} />
            </View>
            <MenuFooter
                cntClasses="flex w-full items-center border-t border-border/60 justify-center flex-row flex-wrap gap-3 p-3"
                variant="ghost"
                size="sm"
                itemClassName=""
            />
        </View>
    ) : (
        <View className=" w-full ">
            <View
                className={`w-full lg:flex-row ${appSetting(
                    'layout',
                    'max_width_content'
                )}`}
            >
                {appStatic('splash_text')}
                <PageContent {...props} />
            </View>
            <MenuFooter
                cntClasses="flex w-full items-center border-t border-border/40 justify-center flex-row flex-wrap gap-4 p-4"
                variant="ghost"
                size="sm"
                itemClassName=""
            />
        </View>
    )

    return (
        <Page>
            {content}
        </Page>
    )
}
