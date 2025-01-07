import { View, ScrollView, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Button, Modal } from 'app/design/controls'
import Svg, { Path, Circle, Ellipse } from 'react-native-svg'
import Link from 'app/ui/atoms/link'
import { Icon } from 'app/ui/atoms/icon'
import Card from 'app/components/card'
import { fetcher } from 'app/lib/fetcher'
import { useEffect, useState } from 'react'
import React from 'react'
import { Animated } from 'react-native'
import { useTranslation } from 'react-i18next'
import { tp, appSetting, updateRouteDataForConnection } from 'app/lib/util'
import ProfilesList from 'app/ui/molecules/profile_list'
import { Platform } from 'react-native'
import PopupModal from 'app/ui/molecules/popup_modal'
import Splash from 'app/ui/molecules/splash'
import { componentsMap } from 'app/ui/molecules/_map'

const LogoText = (
    <Svg
        aria-label="Logo Text"
        className=" group-active:scale-90 text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 duration-500"
       
        viewBox="0 0 68 32"
        fill="none"
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
)

const LogoMark = (
    <Svg
        aria-label="Logo Mark"
        className=" w-auto h-fit text-neutral-800 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-neutral-100  "
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
)

const LogoNative = (
    <View className="w-10 h-10">
        <Svg
            aria-label="Logo Mark"
            className="  h-10 w-10  text-neutral-800 dark:text-neutral-200  "
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <Path
                d="M11.9468 11.8909C14.0127 9.83909 16.8583 8.5714 20.0001 8.5714C20.3283 8.5714 20.6533 8.58523 20.9746 8.61237C21.2844 8.63852 21.567 8.42658 21.6347 8.12318C22.2838 5.21753 24.408 2.86848 27.1804 1.90314C27.4392 1.81299 27.4658 1.43791 27.2101 1.33905C24.9733 0.474227 22.5421 0 20.0001 0C17.0609 0 14.2699 0.633998 11.7562 1.77265C11.5553 1.86368 11.4286 2.06522 11.4286 2.28582V11.685C11.4286 11.9482 11.76 12.0763 11.9468 11.8909Z"
                fill="rgba(31,41,55,1)"
            />
            <Path
                d="M31.8734 36.0956C31.6877 36.2327 31.4285 36.0985 31.4285 35.8673V19.9999C31.4285 19.6717 31.4148 19.3466 31.3877 19.0254C31.3614 18.7156 31.5734 18.4331 31.8768 18.3653C34.7826 17.7162 37.1314 15.592 38.0969 12.8196C38.1869 12.5607 38.562 12.5342 38.6609 12.7899C39.5257 15.0267 40 17.4579 40 19.9999C40 26.5999 36.8031 32.453 31.8734 36.0956Z"
                fill="rgba(31,41,55,1)"
            />
            <Path
                d="M35.7142 9.99996C35.7142 13.1559 33.1559 15.7142 29.9999 15.7142C26.8439 15.7142 24.2856 13.1559 24.2856 9.99996C24.2856 6.84405 26.8439 4.28569 29.9999 4.28569C33.1559 4.28569 35.7142 6.84405 35.7142 9.99996Z"
                fill="rgba(31,41,55,1)"
            />
            <Path
                d="M1.90315 27.1802C1.81301 27.4391 1.43792 27.4656 1.33906 27.2099C0.47423 24.9732 0 22.542 0 20C0 13.4001 3.19687 7.54684 8.12659 3.90428C8.31231 3.76703 8.57145 3.90157 8.57145 4.13251V20C8.57145 20.3282 8.58528 20.6533 8.61242 20.9745C8.63857 21.2843 8.42662 21.5669 8.12322 21.6347C5.21756 22.2837 2.86849 24.4079 1.90315 27.1802Z"
                fill="rgba(31,41,55,1)"
            />
            <Path
                d="M28.2436 38.2273C28.4448 38.1362 28.5714 37.9348 28.5714 37.7142V28.3148C28.5714 28.0517 28.2399 27.9237 28.0531 28.1091C25.9873 30.1608 23.1416 31.4285 19.9999 31.4285C19.6716 31.4285 19.3466 31.4148 19.0254 31.3876C18.7156 31.3614 18.433 31.5734 18.3652 31.8768C17.7162 34.7825 15.5919 37.1313 12.8195 38.0968C12.5607 38.187 12.5342 38.5619 12.7898 38.6608C15.0267 39.5256 17.4579 39.9999 19.9999 39.9999C22.939 39.9999 25.7302 39.3659 28.2436 38.2273Z"
                fill="rgba(31,41,55,1)"
            />
            <Path
                d="M15.7145 29.9999C15.7145 33.1559 13.1561 35.7142 10.0002 35.7142C6.84426 35.7142 4.28588 33.1559 4.28588 29.9999C4.28588 26.8439 6.84426 24.2856 10.0002 24.2856C13.1561 24.2856 15.7145 26.8439 15.7145 29.9999Z"
                fill="rgba(31,41,55,1)"
            />
        </Svg>
    </View>
)

const LogoNativeDark = (
    <View className="w-36 h-11">
        <Svg
            viewBox="0 0 8000 2400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <Path
                d="M4762.09 2000L3697.63 1064.15L3703.83 1939.62H3400V400H3412.4L4474.79 1349.94L4468.59 458.365H4770.35V2000H4762.09Z"
                fill="#e5e7eb"
            />
            <Path
                d="M5162.11 458.365H6199.7V740.126H5461.81V1056.1H6114.95V1337.86H5461.81V1657.86H6228.63V1939.62H5162.11V458.365Z"
                fill="#e5e7eb"
            />
            <Path
                d="M6445.69 1201.01C6445.69 1099.04 6465.67 1002.43 6505.63 911.195C6545.59 819.958 6600.71 739.455 6670.98 669.686C6742.64 598.574 6825.31 542.893 6919.01 502.641C7012.71 462.39 7113.3 442.264 7220.78 442.264C7326.88 442.264 7426.78 462.39 7520.48 502.641C7614.18 542.893 7696.85 598.574 7768.51 669.686C7841.54 739.455 7898.03 819.958 7937.99 911.195C7979.33 1002.43 8000 1099.04 8000 1201.01C8000 1305.66 7979.33 1403.61 7937.99 1494.84C7898.03 1586.08 7841.54 1666.58 7768.51 1736.35C7696.85 1804.78 7614.18 1858.45 7520.48 1897.36C7426.78 1936.27 7326.88 1955.72 7220.78 1955.72C7113.3 1955.72 7012.71 1936.27 6919.01 1897.36C6825.31 1858.45 6742.64 1804.78 6670.98 1736.35C6600.71 1666.58 6545.59 1586.08 6505.63 1494.84C6465.67 1403.61 6445.69 1305.66 6445.69 1201.01ZM6755.73 1201.01C6755.73 1288.22 6776.39 1368.05 6817.73 1440.5C6860.45 1511.61 6917.63 1568.64 6989.29 1611.57C7060.94 1653.17 7141.55 1673.96 7231.11 1673.96C7317.92 1673.96 7395.78 1653.17 7464.67 1611.57C7534.95 1568.64 7590.06 1511.61 7630.02 1440.5C7669.98 1368.05 7689.96 1288.22 7689.96 1201.01C7689.96 1111.11 7669.3 1030.61 7627.96 959.497C7586.62 887.044 7530.81 830.021 7460.54 788.428C7390.26 745.493 7311.03 724.025 7222.85 724.025C7134.66 724.025 7055.43 745.493 6985.15 788.428C6914.88 830.021 6859.07 887.044 6817.73 959.497C6776.39 1030.61 6755.73 1111.11 6755.73 1201.01Z"
                fill="#e5e7eb"
            />
            <Path
                d="M1660 1478.25L2280 400C1939.86 596.377 1735.59 711.463 1412.5 898L1660 1478.25Z"
                fill="#dc2626"
            />
            <Path
                d="M987.5 1502L740 921.75L120 2000L987.5 1502Z"
                fill="#dc2626"
            />

            <Path
                d="M740 921.75L1360 2000L1660 1478.25L1040 400L740 921.75Z"
                fill="#ef4444"
            />
            <Path
                d="M1200 2400C1862.74 2400 2400 1862.74 2400 1200C2400 997.894 2350.25 807.889 2262 640.8L2138.68 854.417C2178.34 962.119 2200 1078.53 2200 1200C2200 1752.28 1752.28 2200 1200 2200C923.41 2200 673.048 2087.73 492.015 1906.25L314 2008.6C533.433 2248.82 849.005 2400 1200 2400Z"
                fill="#f59e0b"
            />
            <Path
                d="M2086.43 391.138L1907.77 493.559C1726.76 312.204 1476.48 200 1200 200C647.715 200 200 647.715 200 1200C200 1321.97 221.023 1437.93 261 1546L138.5 1759.22C50.1818 1592.08 0 1402.19 0 1200C0 537.258 537.258 0 1200 0C1551.1 0 1866.99 150.788 2086.43 391.138Z"
                fill="#f59e0b"
            />
        </Svg>
    </View>
)

const ComponentsAbout = (
    <>
        <Text className="text-3xl lg:text-4xl xl:text-5xl  font-bold text-neutral-800 dark:text-neutral-200">
            About
        </Text>
        <Text className="text-lg lg:text-xl xl:text-2xl  text-neutral-600 dark:text-neutral-400">
            The place to connect, share and grow with the community.
        </Text>
    </>
)
const ComponentsCommentsEmpty = () => {
    const { t } = useTranslation()
    return (
        <>
            <View className="pt-8">
                <View className="flex-col gap-y-2 items-center opacity-80 justify-center  mx-auto my-auto  py-4 px-8  items-center rounded-2xl  bg-neutral-500/10 ">
                    <View className="flex-col mx-auto  text-neutral-800 dark:text-neutral-200 ">
                        <Icon icon="ChatCircle" width={32} height={32} />
                    </View>
                    <Text className="text-center text-lg text-neutral-800 dark:text-neutral-200 lg:text-xl font-semibold  ">
                        {t('No comments yet')}
                    </Text>
                    <Text className="text-center text-base text-neutral-600 dark:text-neutral-400 ">
                        {t('Be the first to share what you think')}
                    </Text>
                </View>
            </View>
        </>
    )
}

const ComponentsContentEmpty = () => {
    const { t } = useTranslation()
    return (
        <>
            <View className="p-8">
                <View className="flex-col gap-y-2 items-center opacity-80 justify-center  mx-auto my-auto mb-auto py-4 px-8 h-full items-center rounded-2xl  bg-neutral-500/10 ">
                    <View className="flex-col mx-auto m-4 text-neutral-800 dark:text-neutral-200 ">
                        <Icon icon="Binoculars" width={32} height={32} />
                    </View>
                    <Text className="text-center text-lg text-neutral-800 dark:text-neutral-200 lg:text-xl font-semibold  ">
                        {t('Nothing found')}
                    </Text>
                    <Text className="text-center text-base text-neutral-600 dark:text-neutral-400 ">
                        {t('It’s like chasing shadows, but there’s no light.')}
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
                <View className="flex-col gap-y-2 items-center opacity-80 justify-center  mx-auto my-auto mb-auto py-4 px-8 h-full items-center rounded-2xl  bg-neutral-500/10 ">
                    <View className="flex-col mx-auto m-4 text-neutral-800 dark:text-neutral-200 ">
                        <Icon icon="Binoculars" width={32} height={32} />
                    </View>
                    <Text className="text-center text-lg text-neutral-800 dark:text-neutral-200 lg:text-xl font-semibold  ">
                        {t('404 - not found')}
                    </Text>
                    <Text className="text-center text-base text-neutral-600 dark:text-neutral-400 ">
                        {t('Page not found, sorry.')}
                    </Text>
                </View>
            </View>
        </>
    )
}
const PageNotAllowed = () => {
    const { t } = useTranslation()
    return (
        <>
            <View className="p-8 mx-auto">
                <View className="flex-col gap-y-2 items-center opacity-80 justify-center  mx-auto my-auto mb-auto py-4 px-8 h-full items-center rounded-2xl  bg-neutral-500/10 ">
                    <View className="flex-col mx-auto m-4 text-neutral-800 dark:text-neutral-200 ">
                        <Icon icon="Binoculars" width={32} height={32} />
                    </View>
                    <Text className="text-center text-lg text-neutral-800 dark:text-neutral-200 lg:text-xl font-semibold  ">
                        {t('403 - not allowed')}
                    </Text>
                    <Text className="text-center text-base text-neutral-600 dark:text-neutral-400 ">
                        {t('Page not allowed, sorry.')}
                    </Text>
                </View>
            </View>
        </>
    )
}

export function ComponentsIntro(props) {
    const { t } = useTranslation()
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
                '/api.php?r=bx_persons/browse/&params[]={%22params%22:{%22per_page%22:%2212%22,%22start%22:0,%22type%22:%22active%22}}'
            )
            setData2(sResponse2.data[0].data.data)
        }
        fetchData2()
    }, [])

    const CounterText = React.memo(({ data }) => {
        return (
            <View className="absolute right-0 flex-col bg-gradient-to-r pl-16 from-transparent via-white dark:via-neutral-900 dark:to-neutral-900 to-white h-10 justify-end gap-y-0.5 items-end flex-none my-auto whitespace-nowrap nowrap ">
                <Text className="font-bold text-neutral-950 leading-5 dark:text-neutral-50 text-3xl font-bold">
                    <AnimatedCounter
                        value={data}
                        duration={1000}
                        startFrom={1}
                    />
                </Text>
                <Text className="  text-neutral-500 text-xs ">
                    {tp('members', data, true)}
                </Text>
            </View>
        )
    })

    return (
        <Card addClassName=" bg-white dark:bg-neutral-900 flex-col gap-y-4 p-4 ">
            <View className="flex-row gap-y-2 overflow-hidden">
                <ProfilesList data={data2} showEmpty={true} maxCount={12} />
                <CounterText data={data} />
            </View>
            <Text className="text-sm  text-neutral-700 dark:text-neutral-300">
                {t('Community Intro')}
            </Text>
        </Card>
    )
}

function ComponentModal({ title = 'test' }) {
    return <PopupModal />
}

function ComponentsSplash(props) {
    return <Splash {...props} logo_native={LogoNative} />
}

const ComponentsLoginContent = (
    <View className="flex-row hidden lg:flex  gap-x-12 gap-y-2">
        <View className="flex-col gap-y-4">
            <View className="flex-row gap-x-2 ">
                <Button
                    variant="outline"
                    startDecorator="Users"
                    size="sm"
                    full
                    rounded
                />
                <Text className="flex-auto my-auto text-neutral-800 dark:text-neutral-200 text-lg font-semibold ">
                    Meet People
                </Text>
            </View>

            <View className="flex-row gap-x-2 ">
                <Button
                    variant="outline"
                    startDecorator="UsersThree"
                    rounded
                    size="sm"
                />
                <Text className="flex-auto my-auto text-neutral-800 dark:text-neutral-200 text-lg font-semibold ">
                    Join Groups
                </Text>
            </View>

            <View className="flex-row gap-x-2 ">
                <Button
                    variant="outline"
                    startDecorator="ChatCenteredText"
                    rounded
                    size="sm"
                />
                <Text className="flex-auto my-auto text-neutral-800 dark:text-neutral-200 text-lg font-semibold ">
                    Share Ideas
                </Text>
            </View>

            <View className="flex-row gap-x-2 ">
                <Button
                    variant="outline"
                    startDecorator="CalendarCheck"
                    rounded
                    size="sm"
                />
                <Text className="flex-auto my-auto text-neutral-800 dark:text-neutral-200 text-lg font-semibold ">
                    Discover Events
                </Text>
            </View>
        </View>

        <View className="flex-col gap-y-4">
            <View className="flex-row gap-x-2 ">
                <Button
                    variant="outline"
                    startDecorator="ChatTeardropDots"
                    rounded
                    size="sm"
                />
                <Text className="flex-auto my-auto text-neutral-800 dark:text-neutral-200 text-lg font-semibold ">
                    Message Friends
                </Text>
            </View>

            <View className="flex-row gap-x-2 ">
                <Button
                    variant="outline"
                    startDecorator="Chats"
                    rounded
                    size="sm"
                />
                <Text className="flex-auto my-auto text-neutral-800 dark:text-neutral-200 text-lg font-semibold ">
                    Discuss Topics
                </Text>
            </View>

            <View className="flex-row gap-x-2 ">
                <Button
                    variant="outline"
                    startDecorator="Storefront"
                    rounded
                    size="sm"
                />
                <Text className="flex-auto my-auto text-neutral-800 dark:text-neutral-200 text-lg font-semibold ">
                    Buy & Sell
                </Text>
            </View>

            <View className="flex-row gap-x-2 ">
                <Button
                    variant="outline"
                    startDecorator="Video"
                    rounded
                    size="sm"
                />
                <Text className="flex-auto my-auto text-neutral-800 dark:text-neutral-200 text-lg font-semibold ">
                    Watch Videos
                </Text>
            </View>
        </View>
    </View>
)

const ComponentsDummy = (
    <>
        <Row className="mb-auto  text-green-800 bg-green-200 dark:bg-green-950 gap-x-1 py-1 px-2 rounded-full dark:text-green-200 sm:aspect-5/1 aspect-5/1 aspect-[5/1] sm:aspect-4/1 aspect-4/1 aspect-[4/1] sm:aspect-3/1 aspect-3/1 aspect-[3/1]">
            <Icon
                className="text-green-600 dark:text-green-400"
                icon="ArrowFatUp"
                width={16}
                height={16}
            />
            <Text className="flex-none text-green-800 dark:text-green-200 text-xs">
                123
            </Text>
        </Row>

        <Row className="mb-auto  text-red-800 bg-red-200 dark:bg-red-950 gap-x-1 py-1 px-2 rounded-full dark:text-red-200 ">
            <Icon
                className="text-red-600 dark:text-red-400"
                icon="ArrowFatUp"
                width={16}
                height={16}
            />
            <Text
                className={'flex-none text-red-800 dark:text-red-200 text-xs'}
            >
                456
            </Text>
        </Row>

        <Row className="w-1/5 mb-auto bg-sky-400 bg-indigo-400 text-gray-800 bg-gray-200 dark:bg-gray-950 gap-x-1 py-1 px-2 rounded-full dark:text-gray-200 ">
            <Icon
                className="text-gray-600 dark:text-gray-400"
                icon="ArrowFatUp"
                width={16}
                height={16}
            />
            <Text
                className={
                    'flex-none text-gray-800 dark:text-gray-200 text-xs dark:bg-bgrmodal-d h-full md:h-auto  sm:border sm:border-bdrmodal sm:dark:border-bdrmodal-d sm:rounded-2xl bg-bgrmodal dark:bg-bgrmodal-d h-full md:h-auto  md:border md:border-bdrmodal md:dark:border-bdrmodal-d md:rounded-2xl'
                }
            >
                123
            </Text>
        </Row>
        <Row className="font-default bg-orange-500 text-red-400 bg-red-400 bg-gray-300 bg-gray-400 bg-gray-600 bg-yellow-500 bg-green-500 bg-teal-500 bg-sky-500 bg-indigo-500 bg-purple-500 bg-pink-500 bg-rose-500 bg-red-500">
            <Icon
                className="text-gray-600 dark:text-gray-400 sm:h-auto"
                icon="ArrowFatUp"
                width={16}
                height={16}
            />
            <Text
                className={'flex-none text-gray-800 dark:text-gray-200 text-xs'}
            >
                123
            </Text>
        </Row>
    </>
)

const ComponentsFooter = () => {
    const { t } = useTranslation()
    return (
        <>
            <View className=" w-full  flex-row flex-wrap opacity-80 ">
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

const ComponentsFullFooter = () => {
    const { t } = useTranslation()
    return (
        <>
            {' '}
            <View className="w-full h-16"></View>
            <View className=" w-full p-3 flex-row justify-center bg-bgrbody dark:bg-bgrbody-d border-t border-bdr dark:border-bdr-d fixed bottom-0 ">
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

export const staticDefault = {
    logo_text: LogoText,
    logo_mark: LogoMark,
    logo_native: LogoNative,
    logo_nativedark: LogoNativeDark,
    components_about: ComponentsAbout,
    page_not_found: PageNotFound,
    page_not_allowed: PageNotAllowed,
    components_comments_empty: ComponentsCommentsEmpty,
    components_content_empty: ComponentsContentEmpty,
    components_intro: ComponentsIntro,
    components_splash: ComponentsSplash,
    components_modal: ComponentModal,
    components_dummy: ComponentsDummy,
    components_footer: ComponentsFooter,
    components_fullfooter: ComponentsFullFooter,
    components_logincontent: ComponentsLoginContent,
}
