import { View, ScrollView, Row } from 'app/design/view'
import { Text, H1 } from 'app/design/typography'
import { Modal, NeoButton, NeoButtonLink } from 'app/design/controls'
import Svg, { Path, Circle, Ellipse, G } from 'react-native-svg'
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
import { useThemeValue } from 'app/design/theme'
import { Platform } from 'react-native'
import SvgFile from 'app/ui/molecules/content/svg-file'
import Illustration from 'app/ui/molecules/content/illustration'
import MenuFooter from 'app/components/nav/menu-footer'
const isWeb = Platform.OS === 'web'
// The default logo is UNA's own artwork, path for path: the Artificer template's
// data/template/system/images/mark-generic.svg (the glyph) and logo-generic.svg (glyph and
// wordmark), with their fills (#18181B on light, white on dark; the -dark- files).
const LOGO_PETALS = 'M322.4 324.2c1.4-1.3 3.8-.1 3.5 1.7-1 6-2 12-3.1 18-4.3 24.7-8.7 50-9.5 81.1-.1 1.6-1.1 3.1-2.6 3.5-17.3 5.5-35.7 8.5-54.7 8.5-22.1 0-43.2-4-62.8-11.3-2.5-.9-2.4-4.4-.1-5.5 24.6-11.8 42-37.5 43.7-66.2.1-2.4 2.3-4.2 4.7-3.9 4.7.8 9.6 1.1 14.5 1.1 25.8 0 49.3-10.3 66.4-27zM420.2 193.1c1.1-2.3 4.6-2.4 5.5.1 7.3 19.6 11.3 40.7 11.3 62.8 0 70.4-40.2 131.4-98.9 161.3-2.5 1.3-5.5-.7-5.3-3.5 1.4-24.4 5-45.3 8.8-66.6 4.7-27.3 9.6-55.3 9.6-91.2 0-4.9-.3-9.8-1.1-14.5-.3-2.4 1.5-4.6 3.9-4.7 28.7-1.7 54.4-19.1 66.2-43.7zM173.9 94.7c2.5-1.3 5.5.7 5.3 3.5-1.4 24.4-5 45.3-8.8 66.6-4.7 27.3-9.6 55.3-9.6 91.2 0 4.9.3 9.8 1.1 14.5.3 2.4-1.5 4.6-3.9 4.7-28.7 1.7-54.4 19.1-66.2 43.7-1.1 2.3-4.6 2.4-5.5-.1-7.3-19.6-11.3-40.7-11.3-62.8 0-70.4 40.2-131.4 98.9-161.3zM256 75c22.1 0 43.2 4 62.8 11.3 2.5.9 2.4 4.4.1 5.5-24.6 11.8-42 37.5-43.7 66.2-.1 2.4-2.3 4.2-4.7 3.9-4.7-.8-9.6-1.1-14.5-1.1-25.8 0-49.3 10.3-66.4 27-1.4 1.3-3.8.1-3.5-1.7 1-6 2-12 3.1-18 4.3-24.7 8.7-50 9.5-81.1.1-1.6 1.1-3.1 2.6-3.5 17.3-5.5 35.7-8.5 54.7-8.5z';
const LOGO_WORDMARK_UN = 'M128.5 14C128.5 16.4853 126.485 18.5 124 18.5C121.515 18.5 119.5 16.4853 119.5 14V8.75C119.5 8.33579 119.164 8 118.75 8C118.336 8 118 8.33579 118 8.75V14C118 17.3137 120.686 20 124 20C127.314 20 130 17.3137 130 14V8.75C130 8.33579 129.664 8 129.25 8C128.836 8 128.5 8.33579 128.5 8.75V14ZM142.5 14V19.25C142.5 19.6642 142.836 20 143.25 20C143.664 20 144 19.6642 144 19.25V14C144 10.6863 141.314 8 138 8C134.686 8 132 10.6863 132 14V19.25C132 19.6642 132.336 20 132.75 20C133.164 20 133.5 19.6642 133.5 19.25V14C133.5 11.5147 135.515 9.5 138 9.5C140.485 9.5 142.5 11.5147 142.5 14Z';
const LOGO_WORDMARK_A = 'M156.5 17.9687V19.25C156.5 19.6642 156.836 20 157.25 20V20C157.664 20 158 19.6642 158 19.25V14C158 10.6863 155.314 8 152 8C148.686 8 146 10.6863 146 14C146 17.3137 148.686 20 152 20C153.792 20 155.401 19.2144 156.5 17.9687ZM156.5 14C156.5 16.4853 154.485 18.5 152 18.5C149.515 18.5 147.5 16.4853 147.5 14C147.5 11.5147 149.515 9.5 152 9.5C154.485 9.5 156.5 11.5147 156.5 14Z';
const LOGO_FILL = { light: '#18181B', dark: '#FFFFFF' };

// Glyph: four petals at 40% and two dots, in its own 362-unit box.
const LogoGlyph = ({ height, fill }) => (
    <Svg aria-hidden={true} width={height} height={height} viewBox="75 75 362 362" fill="none">
        <G fill={fill}>
            <Path d={LOGO_PETALS} fillOpacity={0.4} />
            <Circle cx="351.2" cy="160.8" r="57.1" />
            <Circle cx="160.8" cy="351.2" r="57.1" />
        </G>
    </Svg>
);

// Glyph and wordmark, 67:20, as UNA draws it at 40px.
const LogoFull = ({ height, fill }) => (
    <Svg aria-hidden={true} width={Math.round((height * 67) / 20)} height={height} viewBox="91 4 67 20" fill="none">
        <G transform="matrix(0.0552 0 0 0.0552 86.8564 -0.1436)" fill={fill}>
            <Path d={LOGO_PETALS} fillOpacity={0.4} />
            <Circle cx="351.2" cy="160.8" r="57.1" />
            <Circle cx="160.8" cy="351.2" r="57.1" />
        </G>
        <Path d={LOGO_WORDMARK_UN} fill={fill} />
        <Path d={LOGO_WORDMARK_A} fill={fill} fillRule="evenodd" clipRule="evenodd" />
    </Svg>
);

// mode: 'adaptive' (glyph on phones, full logo from sm), 'full' or 'mark'; `height` in px.
const Logo = ({ mode = 'adaptive', height = 32 }) => {
    // A concrete colour, not `currentColor`: react-native-svg doesn't inherit a parent
    // View's text colour.
    const fill = useThemeValue(LOGO_FILL.light, LOGO_FILL.dark)

    if (mode === 'mark')
        return <LogoGlyph height={height} fill={fill} />

    if (mode !== 'adaptive')
        return <LogoFull height={height} fill={fill} />

    return (
        <View className="web:motion-safe:hover:animate-pulse">
            <View className="sm:hidden">
                <LogoGlyph height={height} fill={fill} />
            </View>
            <View className="hidden sm:flex">
                <LogoFull height={height} fill={fill} />
            </View>
        </View>
    )
}

// Illustration, title and text: one stack with gap-6, no margins or padding of their own
// (`isfirst` / `islast` turn off the H1's prose spacing). The same stack as the join page.
const SplashTextComponent = (props) => {
    const { t } = useTranslation()
    return (
        <View className="items-center lg:items-start gap-6 my-auto flex-auto w-full">
            <View className="h-48 w-48">
                <Illustration name="splash" />
            </View>
            <H1 isfirst islast className="text-center lg:text-start" fontFamily="font-title">
                {t('splash_page_title')}
            </H1>
            <Text
                accessible={true}
                accessibilityRole="text"
                className="max-w-3xl text-secondary-foreground text-center lg:text-start text-base sm:text-lg text-pretty"
            >
                {t('splash_page_text')}
            </Text>
        </View>
    )
}



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
                    <Text className="text-center text-lg text-secondary-foreground  lg:text-xl font-semibold  ">
                        {t('Nothing found')}
                    </Text>
                    <Text className="text-center text-base text-muted-foreground ">
                        {t('Try again later')}
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
                    <Text className="text-center text-lg text-foreground lg:text-xl font-semibold ">
                        {t('404 - not found')}
                    </Text>
                    <Text className="text-center text-base text-muted-foreground ">
                        {t('Page not found')}
                    </Text>
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
        <MenuFooter />
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
