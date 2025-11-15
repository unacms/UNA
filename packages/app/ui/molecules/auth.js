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
                <Link
                    className="mx-auto"
                    variant="plain"
                    size="md"
                    href="/forgot-password"
                    haptics="Medium"
                >
                    {t('Forgot password?')}
                </Link>
            )}
            {createAccountLink && (
                <Row 
                    className="text-center flex-none mx-auto text-sm items-center text-muted-foreground gap-1"
                    accessibilityRole="text"
                    accessibilityLabel={`${t('splash_page_login2')} ${t('splash_page_new_account')}`}
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
                        size="base"
                        startDecorator="UserRoundPlus"
                        accessibilityRole="button"
                    />
                </Link>
            )}

            {showSeparator && (
                <View 
                    className="flex-row items-center justify-center w-full mt-px"
                    accessibilityRole="text"
                    accessibilityLabel={t('splash_page_login3')}
                >
                    <View className="flex-col rounded overflow-hidden h-0.5 flex-1 w-full">
                    <View 
                        className="flex-1 h-px w-full bg-black/5 dark:bg-black"
                        accessibilityElementsHidden={true}
                        importantForAccessibility="no"
                    />
                    <View 
                        className="flex-1 h-px w-full  bg-white dark:bg-white/5"
                        accessibilityElementsHidden={true}
                        importantForAccessibility="no"
                    />
                    </View>
                    <Text 
                        className="hidden px-2 pb-px rounded-full text-xs leading-none mt-px  text-muted-foreground "
                        accessibilityRole="text"
                    >
                        {t('splash_page_login3')}
                    </Text>
                    <View className="flex-col rounded overflow-hidden h-0.5 flex-1 w-full">
                    <View 
                        className="flex-1 h-px w-full bg-black/5 dark:bg-black"
                        accessibilityElementsHidden={true}
                        importantForAccessibility="no"
                    />
                    <View 
                        className="flex-1 h-px w-full  bg-white dark:bg-white/5"
                        accessibilityElementsHidden={true}
                        importantForAccessibility="no"
                    />
                    </View>
                </View>
            )}
            <View 
                className="web:flex-row web:flex-wrap gap-x-2 gap-y-2 w-full"
                accessibilityRole="group"
                accessibilityLabel="Alternative sign-in methods"
            >
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
