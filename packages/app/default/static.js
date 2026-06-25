import { View, ScrollView, Row } from 'app/design/view'
import { Text, H1 } from 'app/design/typography'
import { Button, Modal } from 'app/design/controls'
import Svg, { Path, Circle, Ellipse } from 'react-native-svg'
import Link from 'app/ui/atoms/link'
import { Icon } from 'app/ui/atoms/icon'
import Card from 'app/ui/molecules/card'
import { fetcher } from 'app/lib/fetcher'
import { useEffect, useState } from 'react'
import React from 'react'
import { Animated } from 'react-native'
import { useTranslation } from 'react-i18next'
import { tp } from 'app/lib/util'
import ProfilesList from 'app/ui/molecules/profile_list'
import { useTheme } from 'app/design/theme'
import { Platform } from 'react-native'
import SvgFile from 'app/ui/molecules/svg-file'
import MenuFooter from 'app/components/nav/menu-footer'
import { appSetting } from 'app/lib/util'
const isWeb = Platform.OS === 'web'
//mode can be 'adaptive', 'full', 'mark', 'text'
const Logo = ({ mode = 'adaptive' }) => {
    // Resolve a concrete color (like IconFromSet) instead of relying on
    // `currentColor` inheritance — react-native-svg does not inherit a parent
    // View's text color, so on first render `currentColor` falls back to the
    // theme primary (blue) until the subtree re-renders.
    const { colors } = useTheme()
    const logoColor = colors.default

    const textStyles = {
        adaptive: ' hidden sm:block  ',
        mark: ' hidden ',
        full: ' ',
    }

    const markStyles = {
        text: 'hidden sm:block ',
    }

    return (
        <Row className="items-center gap-3 text-foreground web:hover:animate-pulse">
            <View className={`${markStyles[mode]}`}>
                <Svg
                    aria-label="Logo Mark"
                    width={40}
                    height={40}
                    color={logoColor}
                    viewBox="0 0 40 40"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <Path
                        d="M11.9468 11.8909C14.0127 9.83909 16.8583 8.5714 20.0001 8.5714C20.3283 8.5714 20.6533 8.58523 20.9746 8.61237C21.2844 8.63852 21.567 8.42658 21.6347 8.12318C22.2838 5.21753 24.408 2.86848 27.1804 1.90314C27.4392 1.81299 27.4658 1.43791 27.2101 1.33905C24.9733 0.474227 22.5421 0 20.0001 0C17.0609 0 14.2699 0.633998 11.7562 1.77265C11.5553 1.86368 11.4286 2.06522 11.4286 2.28582V11.685C11.4286 11.9482 11.76 12.0763 11.9468 11.8909Z"
                        fill="currentColor"
                    />
                    <Path
                        d="M31.8734 36.0956C31.6877 36.2327 31.4285 36.0985 31.4285 35.8673V19.9999C31.4285 19.6717 31.4148 19.3466 31.3877 19.0254C31.3614 18.7156 31.5734 18.4331 31.8768 18.3653C34.7826 17.7162 37.1314 15.592 38.0969 12.8196C38.1869 12.5607 38.562 12.5342 38.6609 12.7899C39.5257 15.0267 40 17.4579 40 19.9999C40 26.5999 36.8031 32.453 31.8734 36.0956Z"
                        fill="currentColor"
                    />
                    <Path
                        d="M35.7142 9.99996C35.7142 13.1559 33.1559 15.7142 29.9999 15.7142C26.8439 15.7142 24.2856 13.1559 24.2856 9.99996C24.2856 6.84405 26.8439 4.28569 29.9999 4.28569C33.1559 4.28569 35.7142 6.84405 35.7142 9.99996Z"
                        fill="currentColor"
                    />
                    <Path
                        d="M1.90315 27.1802C1.81301 27.4391 1.43792 27.4656 1.33906 27.2099C0.47423 24.9732 0 22.542 0 20C0 13.4001 3.19687 7.54684 8.12659 3.90428C8.31231 3.76703 8.57145 3.90157 8.57145 4.13251V20C8.57145 20.3282 8.58528 20.6533 8.61242 20.9745C8.63857 21.2843 8.42662 21.5669 8.12322 21.6347C5.21756 22.2837 2.86849 24.4079 1.90315 27.1802Z"
                        fill="currentColor"
                    />
                    <Path
                        d="M28.2436 38.2273C28.4448 38.1362 28.5714 37.9348 28.5714 37.7142V28.3148C28.5714 28.0517 28.2399 27.9237 28.0531 28.1091C25.9873 30.1608 23.1416 31.4285 19.9999 31.4285C19.6716 31.4285 19.3466 31.4148 19.0254 31.3876C18.7156 31.3614 18.433 31.5734 18.3652 31.8768C17.7162 34.7825 15.5919 37.1313 12.8195 38.0968C12.5607 38.187 12.5342 38.5619 12.7898 38.6608C15.0267 39.5256 17.4579 39.9999 19.9999 39.9999C22.939 39.9999 25.7302 39.3659 28.2436 38.2273Z"
                        fill="currentColor"
                    />
                    <Path
                        d="M15.7145 29.9999C15.7145 33.1559 13.1561 35.7142 10.0002 35.7142C6.84426 35.7142 4.28588 33.1559 4.28588 29.9999C4.28588 26.8439 6.84426 24.2856 10.0002 24.2856C13.1561 24.2856 15.7145 26.8439 15.7145 29.9999Z"
                        fill="currentColor"
                    />
                </Svg>
            </View>
            <View className={`${textStyles[mode]}`}>
                <Svg
                    aria-label="Logo Text"
                    width={72}
                    height={36}
                    viewBox="0 0 68 32"
                    color={logoColor}
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <Path
                        d="M17.5 16C17.5 20.1421 14.1421 23.5 10 23.5C5.85786 23.5 2.5 20.1421 2.5 16V7.25C2.5 6.55964 1.94036 6 1.25 6C0.559644 6 0 6.55964 0 7.25V16C0 21.5228 4.47715 26 10 26C15.5228 26 20 21.5228 20 16V7.25C20 6.55964 19.4404 6 18.75 6C18.0596 6 17.5 6.55964 17.5 7.25V16Z"
                        fill="currentColor"
                    />
                    <Path
                        d="M41.5 16V24.75C41.5 25.4404 42.0596 26 42.75 26C43.4404 26 44 25.4404 44 24.75V16C44 10.4772 39.5228 6 34 6C28.4772 6 24 10.4772 24 16V24.75C24 25.4404 24.5596 26 25.25 26C25.9404 26 26.5 25.4404 26.5 24.75V16C26.5 11.8579 29.8579 8.5 34 8.5C38.1421 8.5 41.5 11.8579 41.5 16Z"
                        fill="currentColor"
                    />
                    <Path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M65.5 22.6146V24.75C65.5 25.4404 66.0596 26 66.75 26C67.4404 26 68 25.4404 68 24.75V16C68 10.4772 63.5228 6 58 6C52.4772 6 48 10.4772 48 16C48 21.5228 52.4772 26 58 26C60.9867 26 63.6676 24.6906 65.5 22.6146ZM65.5 16C65.5 20.1421 62.1421 23.5 58 23.5C53.8579 23.5 50.5 20.1421 50.5 16C50.5 11.8579 53.8579 8.5 58 8.5C62.1421 8.5 65.5 11.8579 65.5 16Z"
                        fill="currentColor"
                    />
                </Svg>
            </View>
        </Row>
    )
}

const SplashTextInner = () => {
    const { t } = useTranslation()
    return (
        <View className="text-center max-w-3xl lg:text-start w-full flex-auto ">
            <H1 className="text-center lg:text-start sm:pb-6" fontFamily="font-title">
                {t('splash_page_title')} {appSetting('config', 'title')}
            </H1>
            <Text
                accessible={true}
                accessibilityRole="text"
                className=" text-secondary-foreground text-center lg:text-start text-base sm:text-lg text-pretty"
            >
                {t('splash_page_text')}
            </Text>
         
        </View>
    )
}

const SplashTextComponent = (props) => {
    return isWeb ? (
        <View className="items-center lg:items-start relative gap-6 my-auto flex-auto w-full ">

            <View className="relative flex-auto h-48 w-48">

                <SvgFile
                    src_dark="splash-dark.svg"
                    src_default="splash-light.svg"
                    colorize
                    className="text-secondary-foreground"
                    alt="Splash screen illustration"
                />

            </View>
            <View className="flex-auto w-full items-center lg:items-start">
                <SplashTextInner />
            </View>
        </View>
    ) : (
        <View className=" items-center lg:items-start flex-auto gap-6 w-full mx-auto">
            <View className="flex-auto w-64 h-64">
                <SvgFile
                    src_dark="splash-dark.svg"
                    src_default="splash-light.svg"
                    colorize
                    className="text-secondary-foreground"
                    alt="Splash screen illustration"
                />
            </View>
            <View className="flex-auto w-full">
                <SplashTextInner />
            </View>
        </View>
    )
}



const JoinTextComponent = (props) => {
    return (
        <View className="flex-auto w-1/2 max-w-64">
            <SvgFile
                src_dark="create-account-dark.svg"
                src_default="create-account-light.svg"
                alt="Create account illustration"
            />
        </View>
    )
}

const ComponentsAboutComponent = (props) => {
    return (
        <>
            <Text className="text-3xl lg:text-4xl xl:text-5xl font-bold text-secondary-foreground ">
                About
            </Text>
            <Text className="text-lg lg:text-xl xl:text-2xl  text-muted-foreground ">
                The place to connect, share and grow with the community.
            </Text>
        </>
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
                        <Text className="text-primary">Login</Text>
                    </Link>{' '}
                    or{' '}
                    <Link className="text-primary" href="/create-account">
                        <Text className="text-primary">create an account</Text>
                    </Link>{' '}
                    to comment
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
                <View className="gap-y-2 items-center opacity-80 justify-center mx-auto my-auto mb-auto py-4 px-8 h-full rounded-2xl  bg-muted-foreground/10 ">
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

                <Button
                    onPress={() => reset()}
                    variant="default"
                    title="Reload page"
                ></Button>
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
            {onRetry ? <Button title={t('Retry')} onPress={onRetry} /> : null}
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
    const [data, setData] = useState(1)
    const [data2, setData2] = useState([])
    useEffect(() => {
        const fetchData1 = async () => {
            const sResponse = await fetcher('/api.php?r=q&q=accounts_count')
            setData(sResponse)
        }
        fetchData1()
    }, [])

    useEffect(() => {
        const fetchData2 = async () => {
            const sResponse2 = await fetcher(
                '/api.php?r=bx_persons/browse/&params[]={%22params%22:{%22per_page%22:%2212%22,%22start%22:0,%22type%22:%22active%22}}',
            )
            setData2(sResponse2.data[0].data.data)
        }
        fetchData2()
    }, [])

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
                        Sign in to your account
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
                                Meet new people
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
                                Discover cool spaces
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
                                Share your ideas
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
    return (
        <>
            <View className="w-full h-16"></View>
            <View className=" w-full p-3 flex-row justify-center bg-background border-t border-border/60 fixed bottom-0 ">
                <Link href="/">
                    <Button
                        variant="text"
                        title={t('Home')}
                        className="mt-auto"
                        size="sm"
                    />
                </Link>
                <Link href="/about">
                    <Button
                        variant="text"
                        title={t('About')}
                        className="mt-auto"
                        size="sm"
                    />
                </Link>

                <Link href="/contact">
                    <Button
                        variant="text"
                        title={t('Contact')}
                        className="mt-auto"
                        size="sm"
                    />
                </Link>
                <Link href="/privacy">
                    <Button
                        variant="text"
                        title={t('Privacy')}
                        className="mt-auto"
                        size="sm"
                    />
                </Link>
                <Link href="/terms">
                    <Button
                        variant="text"
                        title={t('Terms')}
                        className="mt-auto"
                        size="sm"
                    />
                </Link>
            </View>
        </>
    )
}

export { BootstrapOffline }

export const staticDefault = {
    logo: Logo,
    components_about: ComponentsAboutComponent,
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
