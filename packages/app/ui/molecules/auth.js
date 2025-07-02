import { View, Row } from 'app/design/view';
import AuthGoogle from 'app/ui/atoms/auth/google';
import AuthGitHub from 'app/ui/atoms/auth/AuthGitHub';
import AuthLinkedIn from 'app/ui/atoms/auth/AuthLinkedIn';
import AuthX from 'app/ui/atoms/auth/AuthX';
import AuthPasskey from 'app/ui/atoms/auth/AuthPasskey';
import AuthSAML from 'app/ui/atoms/auth/AuthSAML';
import { appSetting } from 'app/lib/util'
import Link from 'app/ui/atoms/link'
import { Button } from 'app/design/controls'
import { Text } from 'app/design/typography'
import { useTranslation } from 'react-i18next'

export default function AuthPanel({ googleButton, className, showSeparator = true, forgotPasswordLink = true, createAccountLink = true, loginLink = true }) {
    if (appSetting('auth', 'enabled') !== true) return null;
    const { t } = useTranslation()
    return (
        <View className='w-full gap-y-6'>
            {showSeparator && <View className="flex-row items-center justify-center w-full">
                <View className="flex-1 h-px w-full bg-neutral-200 dark:bg-neutral-500" />
                <Text className="mx-4 text-xs text-neutral-500 dark:text-neutral-400 font-normal">{t("splash_page_login3")}</Text>
                <View className="flex-1 h-px w-full bg-neutral-200 dark:bg-neutral-500" />
            </View>}
            <View className="gap-y-2 w-full">
                {loginLink && <Link className="flex-1 min-w-200" href="/login" haptics="Medium">
                    <Button
                        title={t("Login with email")}
                        variant="default"
                        fullWidth
                        size="base"
                        startDecorator="UserRoundPlus"
                        ring="rounded-xl bg-neutral-300 dark:bg-neutral-950 shadow-sm hover:shadow-none"
                    />
                </Link>}
                {forgotPasswordLink && <Link className="flex-1 min-w-200" href="/forgot-password" haptics="Medium">
                    <Button
                        title={t('Reset password')}
                        variant="default"
                        startDecorator="RotateCcw"
                        fullWidth
                        size="base"
                        ring="rounded-xl bg-neutral-300 dark:bg-neutral-950 shadow-sm hover:shadow-none"
                    />
                </Link>}
                {createAccountLink && <Link className="flex-1 min-w-200" href="/create-account" haptics="Medium">
                    <Button
                        title={t("splash_page_new_account")}
                        variant="default"
                        fullWidth
                        size="base"
                        startDecorator="UserRoundPlus"
                        ring="rounded-xl bg-neutral-300 dark:bg-neutral-950 shadow-sm hover:shadow-none"
                    />
                </Link>}
                <View className='web:flex-row web:flex-wrap gap-x-2 gap-y-2 w-full'>
                {appSetting('auth', 'google') && <AuthGoogle />}
                {appSetting('auth', 'github') && <AuthGitHub button={googleButton} />}
                {appSetting('auth', 'linkedin') && <AuthLinkedIn button={googleButton} />}
                {appSetting('auth', 'x') && <AuthX button={googleButton} />}
                {appSetting('auth', 'passkey') && <AuthPasskey button={googleButton} />}
                {appSetting('auth', 'saml') && <AuthSAML button={googleButton} />}
                </View>
            </View>
        </View>
    );
}