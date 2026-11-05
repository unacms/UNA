import { View, ScrollView, Row } from 'app/design/view'
import { Text, H1 } from 'app/design/typography'
import { Modal, NeoButton, NeoButtonLink } from 'app/design/controls'
import Link from 'app/ui/atoms/link'
import { Icon } from 'app/ui/atoms/icon'
import Card from 'app/ui/molecules/page/card'
import { useFetch } from 'app/lib/hooks/use-fetch'
import { useEffect, useState } from 'react'
import React from 'react'
import { Animated } from 'react-native'
import { useTranslation } from 'react-i18next'
import { tp } from 'app/lib/util'
import ProfilesList from 'app/ui/molecules/profile/profile-list'
import { Platform } from 'react-native'
import SvgFile from 'app/ui/molecules/content/svg-file'
import Logo from 'app/ui/atoms/logo'
import Illustration from 'app/ui/molecules/content/illustration'
import { PageFooter } from 'app/components/nav/menu-footer'
import { landingText } from 'app/lib/landing-text'
const isWeb = Platform.OS === 'web'

// Illustration, title and text: one stack with gap-6, no margins or padding of their own
// (`isfirst` / `islast` turn off the H1's prose spacing). The same stack as the join page.
const SplashTextComponent = ({ texts }) => {
    const { t, i18n } = useTranslation()
    return (
        <View className="items-center lg:items-start gap-6 my-auto flex-auto w-full">
            <View className="h-48 w-48">
                <Illustration name="splash" />
            </View>
            <H1 isfirst islast className="text-center lg:text-start" fontFamily="font-title">
                {landingText(t, i18n, 'splash_page_title', texts?.title, 'Connect. Share. Create.')}
            </H1>
            <Text
                accessible={true}
                accessibilityRole="text"
                className="max-w-3xl text-secondary-foreground text-center lg:text-start text-base sm:text-lg text-pretty"
            >
                {landingText(t, i18n, 'splash_page_text', texts?.text, 'Join our community now to connect with like-minded people, share exciting news and create inspiring content.')}
            </Text>
        </View>
    )
}



/**
 * The built-in splash text, so the splash can tell a project's own `splash_text` (static.js) from it:
 * a project's own text wins over UNA's splash code (ui/molecules/sections/splash.tsx).
 */
export const SplashTextBuiltIn = SplashTextComponent

const JoinTextComponent = (props) => {
    return (
        <View className="h-48 w-48">
            <Illustration name="join" />
        </View>
    )
}

const ComponentsCommentsEmpty = () => {
    const { t } = useTranslation()
    return (
        <>
            <View className="p-6 border-t border-border/40">
                <Row className=" gap-2 mx-auto my-auto  py-4 px-6 rounded-2xl bg-muted/50 ">
                    <View className="flex-col mx-auto text-muted-foreground  ">
                        <Icon icon="MessageCircle" width={28} height={28} />
                    </View>
                    <View className="flex-col gap-1">
                    <Text className="text-lg text-muted-foreground font-semibold ">
                        {t('No comments yet')}
                    </Text>
                    <Text className="text-sm text-muted-foreground ">
                        {t('Be the first to share what you think')}
                    </Text>
                    </View>
                </Row>
            </View>
        </>
    )
}

const ComponentsCommentsLogin = () => {
    const { t } = useTranslation()
    return (
        <View className="py-2">
            <View className="flex-col gap-y-2 items-center opacity-80 justify-center  mx-auto my-auto  py-4 px-8 rounded-2xl  bg-muted-foreground/10 ">
                <Text className="text-center text-base text-secondary-foreground  ">
                    <Link className="text-primary" href="/login">
                        <Text className="text-primary">{t('Login')}</Text>
                    </Link>{' '}
                    {t('comments_login_or')}{' '}
                    <Link className="text-primary" href="/create-account">
                        <Text className="text-primary">{t('create an account')}</Text>
                    </Link>{' '}
                    {t('comments_login_to_comment')}
                </Text>
            </View>
        </View>
    )
}

const ComponentsContentEmpty = () => {
    const { t } = useTranslation()
    return (
        <>
            <View className="p-2">
                <View className="gap-y-2 items-center opacity-80 justify-center mx-auto my-auto mb-auto py-4 px-8 web:h-full rounded-2xl  bg-muted-foreground/10 ">
                    <View className="mx-auto m-4 text-secondary-foreground">
                        <Icon icon="Binoculars" width={32} height={32} />
                    </View>
                    {/* One calm message for every empty list, as UNA's `_Empty`: not an error to retry. */}
                    <Text className="text-center text-lg text-secondary-foreground  lg:text-xl font-semibold  ">
                        {t('Nothing here yet')}
                    </Text>
                </View>
            </View>
        </>
    )
}

const PageNotFound = () => {
    const { t } = useTranslation()
    return (
        <>
            <View className="p-8 mx-auto">
                <View className="gap-2 items-center justify-center mx-auto my-auto py-4 px-8 h-full rounded-2xl bg-muted ">
                    <View className="mx-auto m-4 text-muted-foreground ">
                        <Icon icon="Binoculars" width={32} height={32} />
                    </View>
                    {/* The same words as UNA's 404 (_sys_request_page_not_found_cpt / _text). */}
                    <Text className="text-center text-lg text-foreground lg:text-xl font-semibold ">
                        {t('Page not found')}
                    </Text>
                    <Text className="text-center text-base text-muted-foreground ">
                        {t('The page may have moved, or the link is wrong.')}
                    </Text>
                    <NeoButtonLink href="/" style="bordered" controlSize="regular" label={t('Go to the home page')} classNames={{ root: 'self-center mt-2' }} />
                </View>
            </View>
        </>
    )
}

const PageError = ({ error, reset }) => {
    const { t } = useTranslation()
    return (
        <View className="mx-auto max-w-full px-2">
            <View className="m-8 gap-y-4 items-center justify-center mx-auto my-auto py-4 px-8 rounded-2xl bg-muted ">
                <View className=" mx-auto m-4 text-muted-foreground ">
                    <Icon icon="BugOff" width={32} height={32} />
                </View>
                <Text className="text-center text-lg text-foreground lg:text-xl font-semibold ">
                    {t('We ran into a problem')}
                </Text>
                <Text className="text-center text-base text-muted-foreground ">
                    {t(
                        'Something didn’t go as planned. Please try again or reload the page.',
                    )}
                </Text>
                <Text className="text-center text-sm text-muted-foreground ">
                    {error.digest}
                    {error.message}
                </Text>

                <NeoButton
                    onPress={() => reset()}
                    label={t('Reload page')}
                    classNames={{ root: 'self-center' }}
                />
            </View>
        </View>
    )
}

const BootstrapOffline = ({ onRetry }) => {
    const { t } = useTranslation()
    return (
        <View className="flex-1 items-center justify-center bg-background p-6 gap-4">
            <Text className="text-center text-base text-foreground">
                {t('No internet connection')}
            </Text>
            {onRetry ? <NeoButton label={t('Retry')} onPress={onRetry} classNames={{ root: 'self-center' }} /> : null}
        </View>
    )
}

const PageNotAllowed = () => {
    const { t } = useTranslation()
    return (
        <>
            <View className="p-8 mx-auto">
                <View className="gap-y-2 items-center opacity-80 justify-center  mx-auto my-auto mb-auto py-4 px-8 h-full rounded-2xl  bg-muted-foreground/10 ">
                    <View className="mx-auto m-4 text-secondary-foreground  ">
                        <Icon icon="Binoculars" width={32} height={32} />
                    </View>
                    <Text className="text-center text-lg text-card-foreground lg:text-xl font-semibold  ">
                        {t('403 - not allowed')}
                    </Text>
                    <Text className="text-center text-base text-muted-foreground ">
                        {t('Page not allowed, sorry.')}
                    </Text>
                    <NeoButtonLink href="/" style="bordered" controlSize="regular" label={t('Go to the home page')} classNames={{ root: 'self-center mt-2' }} />
                </View>
            </View>
        </>
    )
}

const AnimatedCounter = ({ value, duration }) => {
    const animatedValue = useState(new Animated.Value(1))[0]
    const [displayValue, setDisplayValue] = useState(1)

    useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: value,
            duration: duration,
            useNativeDriver: false,
        }).start()

        const listener = animatedValue.addListener(({ value }) => {
            setDisplayValue(Math.round(value))
        })

        return () => {
            animatedValue.removeListener(listener)
        }
    }, [value])

    return <Animated.Text>{displayValue}</Animated.Text>
}

export function ComponentsIntro(props) {
    const { t } = useTranslation()
    const { data: accountsCount } = useFetch('/api.php?r=q&q=accounts_count')
    const data = accountsCount ?? 1
    const { data: activePersons } = useFetch(
        '/api.php?r=bx_persons/browse/&params[]={%22params%22:{%22per_page%22:%2212%22,%22start%22:0,%22type%22:%22active%22}}',
    )
    const data2 = activePersons?.data?.[0]?.data?.data ?? []

    const CounterText = React.memo(({ data }) => {
        return (
            <View className="absolute right-0 flex-col bg-linear-to-r pl-16 from-transparent via-white to-white h-10 justify-end gap-y-0.5 items-end flex-none my-auto whitespace-nowrap nowrap ">
                <Text className="font-bold text-foreground leading-5  text-3xl">
                    <AnimatedCounter
                        value={data}
                        duration={1000}
                        startFrom={1}
                    />
                </Text>
                <Text className="  text-muted-foreground text-xs ">
                    {tp('members', data, true)}
                </Text>
            </View>
        )
    })

    return (
        <Card addClassName=" bg-red-500 flex-col gap-y-4 p-4 ">
            <View className="flex-row gap-y-2 overflow-hidden">
                <ProfilesList data={data2} showEmpty={true} maxCount={12} />
                <CounterText data={data} />
            </View>
            <Text className="text-sm  text-muted-foreground ">
                {t('Community Intro')}
            </Text>
        </Card>
    )
}

const ComponentsLoginContentComponent = (props) => {
    const { t } = useTranslation()
    return (
        <View className="hidden my-auto flex-auto">
            <View className="w-[50%] max-w-80 aspect-square">
                <SvgFile
                    src_dark="login-dark.svg"
                    src_default="login-light.svg"
                    alt="Login illustration"
                />
            </View>
            <View className="flex-auto items-center lg:items-start gap-y-4 sm:gap-y-6 max-w-md sm:max-w-lg lg:max-w-3xl">
                <View className="gap-y-8 flex-auto my-4 ">
                    <H1 className="text-4xl tracking-tight font-bold text-secondary-foreground  justify-center items-center  ">
                        {t('login_page_title')}
                    </H1>
                    <View className="gap-y-4">
                        <View className="flex-row gap-x-4 ">
                            <Icon
                                className="text-secondary-foreground "
                                icon="UsersRound"
                                width={24}
                                height={24}
                            />
                            <Text className="flex-auto my-auto text-secondary-foreground  text-base font-medium">
                                {t('login_feature_meet')}
                            </Text>
                        </View>

                        <View className="flex-row gap-x-4 ">
                            <Icon
                                className="text-secondary-foreground "
                                icon="Compass"
                                width={24}
                                height={24}
                            />
                            <Text className="flex-auto my-auto text-secondary-foreground  text-base font-medium">
                                {t('login_feature_discover')}
                            </Text>
                        </View>

                        <View className="flex-row gap-x-4 ">
                            <Icon
                                className="text-secondary-foreground "
                                icon="Share"
                                width={24}
                                height={24}
                            />
                            <Text className="flex-auto my-auto text-secondary-foreground  text-base font-medium">
                                {t('login_feature_share')}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    )
}

const ComponentsFooter = () => {
    return (
        <PageFooter />
    )
}

const ComponentsPricingHeader = () => {
    return <>TODO ComponentsPricingHeader</>
}

const ComponentsPricingFooter = () => {
    return <>TODO ComponentsPricingFooter</>
}

const ComponentsFullFooter = () => {
    const { t } = useTranslation()
    // The links wrap to a second row on narrow phones, so the spacer that keeps room
    // for the fixed bar follows its measured height (h-16 is the one-row height).
    // Web only: native has no `fixed`, the bar stays in flow and the spacer stays h-16.
    // On phones the bar starts at the screen edge, not at its inset block, so the
    // centred links don't run past the right edge (wider screens keep their placement).
    const [barHeight, setBarHeight] = useState()
    return (
        <>
            <View className="w-full min-h-16" style={{ height: barHeight }}></View>
            <View
                onLayout={isWeb ? (e) => setBarHeight(e.nativeEvent.layout.height) : undefined}
                className=" w-full p-3 flex-row flex-wrap justify-center gap-2 bg-background border-t border-border/60 fixed bottom-0 max-sm:left-0 "
            >
                <NeoButtonLink
                    href="/"
                    style="borderless"
                    controlSize="small"
                    label={t('Home')}
                    classNames={{ root: 'mt-auto' }}
                />
                <NeoButtonLink
                    href="/about"
                    style="borderless"
                    controlSize="small"
                    label={t('About')}
                    classNames={{ root: 'mt-auto' }}
                />

                <NeoButtonLink
                    href="/contact"
                    style="borderless"
                    controlSize="small"
                    label={t('Contact')}
                    classNames={{ root: 'mt-auto' }}
                />
                <NeoButtonLink
                    href="/privacy"
                    style="borderless"
                    controlSize="small"
                    label={t('Privacy')}
                    classNames={{ root: 'mt-auto' }}
                />
                <NeoButtonLink
                    href="/terms"
                    style="borderless"
                    controlSize="small"
                    label={t('Terms')}
                    classNames={{ root: 'mt-auto' }}
                />
            </View>
        </>
    )
}

export { BootstrapOffline }

// Upstream static component registry. appStatic() (lib/app-static.tsx) reads it through
// customization/static.js, which re-exports this map upstream and is replaced by forks.
// Every `components_*` key is also a page override slot: the default page layout renders
// `components_<uri>` on top of the page with that URI, so don't name a non-page component
// after a real page (a UNA page at /footer would render components_footer on top).
export const staticDefault = {
    logo: Logo,
    page_not_found: PageNotFound,
    page_error: PageError,
    bootstrap_offline: BootstrapOffline,
    page_not_allowed: PageNotAllowed,
    components_comments_empty: ComponentsCommentsEmpty,
    components_content_empty: ComponentsContentEmpty,
    components_content_login: ComponentsCommentsLogin,
    components_intro: ComponentsIntro,
    components_pricing_header: ComponentsPricingHeader,
    components_pricing_footer: ComponentsPricingFooter,
    components_footer: ComponentsFooter,
    components_fullfooter: ComponentsFullFooter,
    components_logincontent: ComponentsLoginContentComponent,
    splash_text: SplashTextComponent,
    join_text: JoinTextComponent,
}
