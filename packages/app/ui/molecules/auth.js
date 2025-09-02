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

export default function AuthPanel({
    googleButton,
    className,
    showSeparator = false,
    forgotPasswordLink = false,
    createAccountLink = false,
    loginLink = false,
}) {
    if (appSetting('auth', 'enabled') !== true) return null
    const { t } = useTranslation()
    return (
        <View className="w-full gap-4">
            {forgotPasswordLink && (
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
            )}
            {createAccountLink && (
                <Row className="text-center flex-none mx-auto text-sm items-center text-muted-foreground">
                    {' '}
                    {t('splash_page_login2')}{' '}
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
                <Link href="/login" haptics="Medium">
                    <Button
                        title={t('Continue with email')}
                        variant="default"
                        fullWidth
                        size="base"
                        startDecorator="UserRoundPlus"
                    />
                </Link>
            )}

            {showSeparator && (
                <View className="flex-row items-center justify-center w-full">
                    <View className="flex-1 h-px w-full bg-border/50" />
                    <Text className="mx-4 text-xs text-muted-foreground">
                        {t('splash_page_login3')}
                    </Text>
                    <View className="flex-1 h-px w-full bg-border/50" />
                </View>
            )}
            <View className="web:flex-row web:flex-wrap gap-x-2 gap-y-2 w-full">
                {appSetting('auth', 'google') && <AuthGoogle />}
                {appSetting('auth', 'github') && (
                    <AuthGitHub button={googleButton} />
                )}
                {appSetting('auth', 'linkedin') && (
                    <AuthLinkedIn button={googleButton} />
                )}
                {appSetting('auth', 'x') && <AuthX button={googleButton} />}
                {appSetting('auth', 'passkey') && (
                    <AuthPasskey button={googleButton} />
                )}
                {appSetting('auth', 'saml') && (
                    <AuthSAML button={googleButton} />
                )}
            </View>
        </View>
    )
}
