// The parts of the guest splash: the built-in splash (splash.tsx) draws them, and so does UNA's splash
// code (una-splash*) in place of its `<neo-slot>` placeholders (lib/splash/splash-html.ts).
import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import AuthPanel from 'app/ui/molecules/auth/auth'
import { BlockByName } from 'app/components/block'
import { useTranslation } from 'react-i18next'
import Link from 'app/ui/atoms/link'
import Logo from 'app/ui/atoms/logo'
import Illustration from 'app/ui/molecules/content/illustration'
import { BlockDataByName } from 'app/lib/util'
import type { SplashSlotName } from 'app/lib/splash/splash-html'

type SplashPartProps = { data: any }

/** "New here? Create account": shown where UNA's sign-in form block offers registration. */
export function SplashJoinLink({ data }: Readonly<SplashPartProps>) {
    const { t } = useTranslation()
    if (!BlockDataByName(data, 'system:login_form')) return null
    return (
        <View className="sm:px-6">
            <Row className="mx-auto gap-1 justify-center items-center text-center">
                <Text className="text-secondary-foreground text-base" accessibilityRole="text">
                    {t('splash_page_login2')}
                </Text>
                <Link variant="accent" size="md" href="/create-account" haptics="Medium">
                    {t('splash_page_new_account')}
                </Link>
            </Row>
        </View>
    )
}

/** The social sign-in buttons alone. */
export function SplashSocialLogin() {
    return <AuthPanel forgotPasswordLink={false} showSeparator={false} />
}

/**
 * The sign-in form as the built-in splash shows it: UNA's login form block, Forgot password, the social
 * sign-in buttons and the Sign up link.
 */
export function SplashLoginForm({ data }: Readonly<SplashPartProps>) {
    const isShowCreateAccount = BlockDataByName(data, 'system:login_form')
    return (
        <View className="w-full max-w-md gap-6">
            <BlockByName
                name={isShowCreateAccount ? 'system:login_form' : 'system:login_form_only'}
                data={data}
                formProps={{
                    hide_errors: true,
                    button_full_width: true,
                }}
            />
            <AuthPanel forgotPasswordLink={true} showSeparator={true} />
            <SplashJoinLink data={data} />
        </View>
    )
}

export function SplashIllustration() {
    return (
        <View className="h-48 w-48">
            <Illustration name="splash" />
        </View>
    )
}

export function SplashLogo() {
    return <Logo />
}

/**
 * What each placeholder of UNA's splash code draws. `site_title` is text and never reaches here: the
 * renderers keep the site name UNA put inside it.
 */
export function SplashSlotPart({ name, data }: Readonly<{ name: SplashSlotName; data: any }>) {
    switch (name) {
        case 'login_form':
            return <SplashLoginForm data={data} />
        case 'social_login':
            return <SplashSocialLogin />
        case 'join_link':
            return <SplashJoinLink data={data} />
        case 'logo':
            return <SplashLogo />
        case 'illustration':
            return <SplashIllustration />
        default:
            return null
    }
}
