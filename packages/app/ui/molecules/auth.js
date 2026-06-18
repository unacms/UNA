import { Platform } from 'react-native'
import { View, Row } from 'app/design/view'
import AuthGoogle from 'app/ui/atoms/auth/google'
import AuthGitHub from 'app/ui/atoms/auth/AuthGitHub'
import AuthLinkedIn from 'app/ui/atoms/auth/AuthLinkedIn'
import AuthX from 'app/ui/atoms/auth/AuthX'
import AuthPasskey from 'app/ui/atoms/auth/AuthPasskey'
import AuthSAML from 'app/ui/atoms/auth/AuthSAML'
import { appSetting } from 'app/lib/util'
import Link from 'app/ui/atoms/link'
import { Button } from 'app/design/controls'
import { Text } from 'app/design/typography'
import { useTranslation } from 'react-i18next'

function hasGoogleAuth() {
    const google = appSetting('auth', 'google')
    if (!google || typeof google !== 'object') return false
    return Platform.select({
        ios: google.ios_client_id,
        android: google.android_client_id,
        default: google.web_client_id,
    })
}

export default function AuthPanel({
    showSeparator = false,
    forgotPasswordLink = false,
    createAccountLink = false,
    loginLink = false,
}) {

    const { t } = useTranslation()
    return (
        <View className="w-full gap-4">
            {forgotPasswordLink && (
                <Link
                    className="mx-auto"
                    variant="accent"
                    size="sm"
                    href="/forgot-password"
                    haptics="Medium"
                >
                    {t('Forgot password?')}
                </Link>
            )}
            {createAccountLink && (
                <Row
                    className="text-center flex-none mx-auto text-sm items-center text-muted-foreground gap-1"
                >
                    <Text
                        className="text-muted-foreground"
                        accessibilityRole="text"
                    >
                        {t('splash_page_login2')}
                    </Text>
                    <Link
                        variant="primary"
                        size="sm"
                        href="/create-account"
                        haptics="Medium"

                    >
                        {t('splash_page_new_account')}
                    </Link>
                </Row>
            )}

            {loginLink && (
                <Link
                    href="/login"
                    haptics="Medium"

                >
                    <Button
                        title={t('Continue with email')}
                        variant="default"
                        fullWidth
                        size="lg"
                        startDecorator="UserRoundPlus"
                        accessibilityRole="button"
                    />
                </Link>
            )}

            {(showSeparator && (hasGoogleAuth() || appSetting('auth', 'github') || appSetting('auth', 'linkedin') || appSetting('auth', 'x') || appSetting('auth', 'passkey') || appSetting('auth', 'saml'))) && (
                <View
                    className="flex-row items-center justify-center w-full"
                    accessibilityRole="separator"
                    accessibilityLabel={t('splash_page_login3')}
                >

                    <View
                        className="flex-1 h-px w-full bg-border/70"
                        accessibilityElementsHidden={true}
                        importantForAccessibility="no"
                    />
                    <Text
                        className=" px-2 rounded-full text-xs leading-none mt-px text-muted-foreground "
                        accessibilityRole="text"
                    >
                        {t('splash_page_login3')}
                    </Text>
                    <View
                        className="flex-1 h-px w-full bg-border/70"
                        accessibilityElementsHidden={true}
                        importantForAccessibility="no"
                    />

                </View>
            )}
            <View
                className="web:flex-row web:flex-wrap gap-x-2 gap-y-2 w-full"
                accessibilityRole="group"
                accessibilityLabel="Alternative sign-in methods"
            >
                {hasGoogleAuth() && <AuthGoogle />}
                {appSetting('auth', 'github') && <AuthGitHub />}
                {appSetting('auth', 'linkedin') && <AuthLinkedIn />}
                {appSetting('auth', 'x') && <AuthX />}
                {appSetting('auth', 'passkey') && <AuthPasskey />}
                {appSetting('auth', 'saml') && <AuthSAML />}
            </View>
        </View>
    )
}
