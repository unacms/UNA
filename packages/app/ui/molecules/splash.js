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
import { appSetting, FeedbackHaptics } from 'app/lib/util'
import { Platform } from 'react-native'
import { useCallback } from 'react'
import { useSound } from 'app/lib/hooks/useSound'
import { appStatic } from 'app/lib/app-static'
import AuthPanel from 'app/ui/molecules/auth'
import { BlockByName } from 'app/components/block'
import MenuFooter from 'app/components/nav/menu-footer'
import { useTranslation } from 'react-i18next'
import Link from 'app/ui/atoms/link'
import Page from 'app/ui/molecules/page'
import { Icon } from 'app/ui/atoms/icon'
import KbAvoidingView from 'app/ui/atoms/kb-avoiding-view';
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
                    className="sm:py-6 gap-4 sm:gap-6 max-w-md w-full mx-auto"
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
                        <KbAvoidingView>
                        <BlockByName
                            name="system:login_form"
                            contentOnly={true}
                            data={data}
                            formProps={{
                                hide_errors: true,
                                button_full_width: true,
                            }}
                        />
                        </KbAvoidingView>
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
    const playClick = useSound('click')
    /** Native: `useSound('click')` + expo selection haptic. Web: [web-haptics](https://github.com/lochie/web-haptics) `selection` + synth audio when `layout.sounds` and `layout.web_haptics_sounds` are on (see `feedback-haptics.web.js`); skip `useSound` on web to avoid doubling. */
    const onSplashTabChange = useCallback(() => {
        if (!isWeb) {
            playClick()
        }
        FeedbackHaptics('Select')
    }, [isWeb, playClick])

    return (
        <Page processKeyboard={false}>
            <View className="flex-1 gap-6 w-full mx-auto">
                <View className="w-full border-b border-border/60 lg:flex-row">
                    <View className={`flex-1 lg:flex-row gap-6 lg:p-6 p-4 w-full mx-auto ${appSetting( 'layout', 'max_width_content')}`}>
                        <View className="flex-1 gap-6 items-center lg:items-start">
                            {appStatic('splash_text')}
                            
                        </View>
                        <PageContent {...props} />
                    </View>
                </View>
                
                <View className={`flex-1 lg:p-6 p-4 gap-12 w-full mx-auto ${appSetting( 'layout', 'max_width_content')}`}>
                    {appStatic('splash_node_flow')}
                   
                    {appStatic('splash_tabs', { onTabChange: onSplashTabChange })}
                </View>
            </View>
            
            
            
                <MenuFooter
                cntClasses='flex w-full items-center border-t border-border/60 justify-center flex-row flex-wrap gap-3 p-4 min-h-14'
            />
        </Page>
    )
}
