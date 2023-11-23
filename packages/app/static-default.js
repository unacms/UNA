import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls'
import Svg, { Path } from 'react-native-svg'
import Link from 'app/ui/atoms/link'
import { Icon } from 'app/ui/atoms/icon'
import Card from 'app/components/card'
import { fetcher } from 'app/lib/fetcher'
import { useEffect, useState } from 'react'
import React from 'react'
import { Animated } from 'react-native'
import { useTranslation } from 'react-i18next';
import { tp } from 'app/lib/util'
import ProfilesList from 'app/ui/molecules/profile_list'
// import Aaa from "./aaa.svg";

// const AaaExample = () => <Aaa />;

const LogoText = (
  <Svg
    aria-label="Logo Text"
    className="h-8   group-active:scale-90 text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-900 dark:group-hover:text-neutral-100 duration-500"
    viewBox="0 0 6400 2400"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <Path
      d="M2362.09 2000L1297.63 1064.15L1303.83 1939.62H1000V400H1012.4L2074.79 1349.94L2068.59 458.365H2370.36V2000H2362.09Z"
      fill="currentColor"
    />
    <Path
      d="M2762.11 458.365H3799.7V740.126H3061.81V1056.1H3714.95V1337.86H3061.81V1657.86H3828.63V1939.62H2762.11V458.365Z"
      fill="currentColor"
    />
    <Path
      d="M4045.69 1201.01C4045.69 1099.04 4065.67 1002.43 4105.63 911.195C4145.59 819.958 4200.71 739.455 4270.98 669.686C4342.64 598.574 4425.31 542.893 4519.01 502.641C4612.71 462.39 4713.3 442.264 4820.78 442.264C4926.88 442.264 5026.78 462.39 5120.48 502.641C5214.18 542.893 5296.85 598.574 5368.51 669.686C5441.54 739.455 5498.03 819.958 5537.99 911.195C5579.33 1002.43 5600 1099.04 5600 1201.01C5600 1305.66 5579.33 1403.61 5537.99 1494.84C5498.03 1586.08 5441.54 1666.58 5368.51 1736.35C5296.85 1804.78 5214.18 1858.45 5120.48 1897.36C5026.78 1936.27 4926.88 1955.72 4820.78 1955.72C4713.3 1955.72 4612.71 1936.27 4519.01 1897.36C4425.31 1858.45 4342.64 1804.78 4270.98 1736.35C4200.71 1666.58 4145.59 1586.08 4105.63 1494.84C4065.67 1403.61 4045.69 1305.66 4045.69 1201.01ZM4355.73 1201.01C4355.73 1288.22 4376.39 1368.05 4417.73 1440.5C4460.45 1511.61 4517.63 1568.64 4589.29 1611.57C4660.94 1653.17 4741.55 1673.96 4831.11 1673.96C4917.92 1673.96 4995.78 1653.17 5064.67 1611.57C5134.95 1568.64 5190.06 1511.61 5230.02 1440.5C5269.98 1368.05 5289.96 1288.22 5289.96 1201.01C5289.96 1111.11 5269.3 1030.61 5227.96 959.497C5186.62 887.044 5130.81 830.021 5060.54 788.428C4990.26 745.493 4911.03 724.025 4822.85 724.025C4734.66 724.025 4655.43 745.493 4585.15 788.428C4514.88 830.021 4459.07 887.044 4417.73 959.497C4376.39 1030.61 4355.73 1111.11 4355.73 1201.01Z"
      fill="currentColor"
    />
  </Svg>
)

const LogoMark = (
  <Svg
    aria-label="Logo Mark"
    className=" group-hover:rotate-[180deg] group-hover:scale-125 group-active:scale-90 duration-500 h-[42px] w-[42px]  "
    viewBox="0 0 2400 2400"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <Path
      d="M1660 1478.25L2280 400C1939.86 596.377 1735.59 711.463 1412.5 898L1660 1478.25Z"
      className="opacity-80 "
      fill="#E2554F"
    />
    <Path
      d="M987.5 1502L740 921.75L120 2000L987.5 1502Z"
      className="opacity-80 "
      fill="#E2554F"
    />
    <Path
      d="M740 921.75L1360 2000L1660 1478.25L1040 400L740 921.75Z"
      className="text-neutral-950 dark:text-neutral-50   group-hover:text-accent dark:group-hover:text-accent-d"
      fill="#E2554F"
    />
    <Path
      d="M1200 2400C1862.74 2400 2400 1862.74 2400 1200C2400 997.894 2350.25 807.889 2262 640.8L2138.68 854.417C2178.34 962.119 2200 1078.53 2200 1200C2200 1752.28 1752.28 2200 1200 2200C923.41 2200 673.048 2087.73 492.015 1906.25L314 2008.6C533.433 2248.82 849.005 2400 1200 2400Z"
      className="group-hover:animate-pulse group-active:opacity-0 text-neutral-400 dark:text-neutral-600  group-hover:text-accent dark:group-hover:text-accent-d"
      fill="currentColor"
    />
    <Path
      d="M2086.43 391.138L1907.77 493.559C1726.76 312.204 1476.48 200 1200 200C647.715 200 200 647.715 200 1200C200 1321.97 221.023 1437.93 261 1546L138.5 1759.22C50.1818 1592.08 0 1402.19 0 1200C0 537.258 537.258 0 1200 0C1551.1 0 1866.99 150.788 2086.43 391.138Z"
      className="group-hover:animate-pulse group-active:opacity-0 text-neutral-400 dark:text-neutral-600  group-hover:text-accent dark:group-hover:text-accent-d"
      fill="currentColor"
    />
  </Svg>
)

const LogoNative = (
  <Svg
    className="w-20 h-6 text-primary"
    viewBox="0 0 8000 2400"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <Path
      d="M4762.09 2000L3697.63 1064.15L3703.83 1939.62H3400V400H3412.4L4474.79 1349.94L4468.59 458.365H4770.35V2000H4762.09Z"
      fill="#E2554F"
    />
    <Path
      d="M5162.11 458.365H6199.7V740.126H5461.81V1056.1H6114.95V1337.86H5461.81V1657.86H6228.63V1939.62H5162.11V458.365Z"
      fill="#E2554F"
    />
    <Path
      d="M6445.69 1201.01C6445.69 1099.04 6465.67 1002.43 6505.63 911.195C6545.59 819.958 6600.71 739.455 6670.98 669.686C6742.64 598.574 6825.31 542.893 6919.01 502.641C7012.71 462.39 7113.3 442.264 7220.78 442.264C7326.88 442.264 7426.78 462.39 7520.48 502.641C7614.18 542.893 7696.85 598.574 7768.51 669.686C7841.54 739.455 7898.03 819.958 7937.99 911.195C7979.33 1002.43 8000 1099.04 8000 1201.01C8000 1305.66 7979.33 1403.61 7937.99 1494.84C7898.03 1586.08 7841.54 1666.58 7768.51 1736.35C7696.85 1804.78 7614.18 1858.45 7520.48 1897.36C7426.78 1936.27 7326.88 1955.72 7220.78 1955.72C7113.3 1955.72 7012.71 1936.27 6919.01 1897.36C6825.31 1858.45 6742.64 1804.78 6670.98 1736.35C6600.71 1666.58 6545.59 1586.08 6505.63 1494.84C6465.67 1403.61 6445.69 1305.66 6445.69 1201.01ZM6755.73 1201.01C6755.73 1288.22 6776.39 1368.05 6817.73 1440.5C6860.45 1511.61 6917.63 1568.64 6989.29 1611.57C7060.94 1653.17 7141.55 1673.96 7231.11 1673.96C7317.92 1673.96 7395.78 1653.17 7464.67 1611.57C7534.95 1568.64 7590.06 1511.61 7630.02 1440.5C7669.98 1368.05 7689.96 1288.22 7689.96 1201.01C7689.96 1111.11 7669.3 1030.61 7627.96 959.497C7586.62 887.044 7530.81 830.021 7460.54 788.428C7390.26 745.493 7311.03 724.025 7222.85 724.025C7134.66 724.025 7055.43 745.493 6985.15 788.428C6914.88 830.021 6859.07 887.044 6817.73 959.497C6776.39 1030.61 6755.73 1111.11 6755.73 1201.01Z"
      fill="#E2554F"
    />
    <Path
      d="M1660 1478.25L2280 400C1939.86 596.377 1735.59 711.463 1412.5 898L1660 1478.25Z"
      fill="currentColor"
    />
    <Path d="M987.5 1502L740 921.75L120 2000L987.5 1502Z" fill="currentColor" />

    <Path
      d="M740 921.75L1360 2000L1660 1478.25L1040 400L740 921.75Z"
      fill="currentColor"
    />
    <Path
      d="M1200 2400C1862.74 2400 2400 1862.74 2400 1200C2400 997.894 2350.25 807.889 2262 640.8L2138.68 854.417C2178.34 962.119 2200 1078.53 2200 1200C2200 1752.28 1752.28 2200 1200 2200C923.41 2200 673.048 2087.73 492.015 1906.25L314 2008.6C533.433 2248.82 849.005 2400 1200 2400Z"
      fill="currentColor"
    />
    <Path
      d="M2086.43 391.138L1907.77 493.559C1726.76 312.204 1476.48 200 1200 200C647.715 200 200 647.715 200 1200C200 1321.97 221.023 1437.93 261 1546L138.5 1759.22C50.1818 1592.08 0 1402.19 0 1200C0 537.258 537.258 0 1200 0C1551.1 0 1866.99 150.788 2086.43 391.138Z"
      fill="currentColor"
    />
  </Svg>
)

const LogoNativeDark = (
  <Svg
    className="w-20 h-6 text-primary"
    viewBox="0 0 8000 2400"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <Path
      d="M4762.09 2000L3697.63 1064.15L3703.83 1939.62H3400V400H3412.4L4474.79 1349.94L4468.59 458.365H4770.35V2000H4762.09Z"
      fill="currentColor"
    />
    <Path
      d="M5162.11 458.365H6199.7V740.126H5461.81V1056.1H6114.95V1337.86H5461.81V1657.86H6228.63V1939.62H5162.11V458.365Z"
      fill="currentColor"
    />
    <Path
      d="M6445.69 1201.01C6445.69 1099.04 6465.67 1002.43 6505.63 911.195C6545.59 819.958 6600.71 739.455 6670.98 669.686C6742.64 598.574 6825.31 542.893 6919.01 502.641C7012.71 462.39 7113.3 442.264 7220.78 442.264C7326.88 442.264 7426.78 462.39 7520.48 502.641C7614.18 542.893 7696.85 598.574 7768.51 669.686C7841.54 739.455 7898.03 819.958 7937.99 911.195C7979.33 1002.43 8000 1099.04 8000 1201.01C8000 1305.66 7979.33 1403.61 7937.99 1494.84C7898.03 1586.08 7841.54 1666.58 7768.51 1736.35C7696.85 1804.78 7614.18 1858.45 7520.48 1897.36C7426.78 1936.27 7326.88 1955.72 7220.78 1955.72C7113.3 1955.72 7012.71 1936.27 6919.01 1897.36C6825.31 1858.45 6742.64 1804.78 6670.98 1736.35C6600.71 1666.58 6545.59 1586.08 6505.63 1494.84C6465.67 1403.61 6445.69 1305.66 6445.69 1201.01ZM6755.73 1201.01C6755.73 1288.22 6776.39 1368.05 6817.73 1440.5C6860.45 1511.61 6917.63 1568.64 6989.29 1611.57C7060.94 1653.17 7141.55 1673.96 7231.11 1673.96C7317.92 1673.96 7395.78 1653.17 7464.67 1611.57C7534.95 1568.64 7590.06 1511.61 7630.02 1440.5C7669.98 1368.05 7689.96 1288.22 7689.96 1201.01C7689.96 1111.11 7669.3 1030.61 7627.96 959.497C7586.62 887.044 7530.81 830.021 7460.54 788.428C7390.26 745.493 7311.03 724.025 7222.85 724.025C7134.66 724.025 7055.43 745.493 6985.15 788.428C6914.88 830.021 6859.07 887.044 6817.73 959.497C6776.39 1030.61 6755.73 1111.11 6755.73 1201.01Z"
      fill="currentColor"
    />
    <Path
      d="M1660 1478.25L2280 400C1939.86 596.377 1735.59 711.463 1412.5 898L1660 1478.25Z"
      fill="#E2554F"
    />
    <Path d="M987.5 1502L740 921.75L120 2000L987.5 1502Z" fill="#E2554F" />

    <Path
      d="M740 921.75L1360 2000L1660 1478.25L1040 400L740 921.75Z"
      fill="#E2554F"
    />
    <Path
      d="M1200 2400C1862.74 2400 2400 1862.74 2400 1200C2400 997.894 2350.25 807.889 2262 640.8L2138.68 854.417C2178.34 962.119 2200 1078.53 2200 1200C2200 1752.28 1752.28 2200 1200 2200C923.41 2200 673.048 2087.73 492.015 1906.25L314 2008.6C533.433 2248.82 849.005 2400 1200 2400Z"
      fill="currentColor"
    />
    <Path
      d="M2086.43 391.138L1907.77 493.559C1726.76 312.204 1476.48 200 1200 200C647.715 200 200 647.715 200 1200C200 1321.97 221.023 1437.93 261 1546L138.5 1759.22C50.1818 1592.08 0 1402.19 0 1200C0 537.258 537.258 0 1200 0C1551.1 0 1866.99 150.788 2086.43 391.138Z"
      fill="currentColor"
    />
  </Svg>
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
  const { t } = useTranslation();
  return (
  <>
    <View className="pt-8">
      <View className="flex-col gap-y-2 items-center opacity-80 justify-center  mx-auto my-auto  py-4 px-8  items-center rounded-2xl  bg-neutral-500/10 ">
        <View className="flex-col mx-auto mb-4 text-neutral-800 dark:text-neutral-200 ">
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
  const { t } = useTranslation();
  return (
  <>
    <View className="p-8">
      <View className="flex-col gap-y-2 items-center opacity-80 justify-center  mx-auto my-auto mb-auto py-4 px-8 h-full items-center rounded-2xl  bg-neutral-500/10 ">
        <View className="flex-col mx-auto m-4 text-neutral-800 dark:text-neutral-200 ">
          <Icon icon="Binoculars" width={32} height={32} />
        </View>
        <Text className="text-center text-lg text-neutral-800 dark:text-neutral-200 lg:text-xl font-semibold  ">
        {t('Here goes nothing')}
        </Text>
        <Text className="text-center text-base text-neutral-600 dark:text-neutral-400 ">
         {t('Couldn`t find anything to show here, sorry.')}
        </Text>
      </View>
    </View>
  </>
)
}

const PageNotFound = () => {
  const { t } = useTranslation();
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

export function ComponentsIntro(props) {
    const { t } = useTranslation();
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
      setData(sResponse);
    }
    fetchData1();
  }, []);
  
  useEffect(() => {
    const fetchData2 = async () => {
      const sResponse2 = await fetcher('/api.php?r=bx_persons/browse/&params[]={%22params%22:{%22per_page%22:%2212%22,%22start%22:0,%22type%22:%22active%22}}')
      setData2(sResponse2.data[0].data.data);
    }
    fetchData2();
  }, []);


  const CounterText = React.memo(({ data }) => {
    return (
      <View className="absolute right-0 flex-col bg-gradient-to-r pl-8   from-transparent via-white dark:via-neutral-900 dark:to-neutral-900 to-white h-10 justify-end gap-y-0.5 items-end flex-none my-auto whitespace-nowrap nowrap ">
        <Text className="font-bold text-neutral-950 leading-4 dark:text-neutral-50 text-xl font-bold">
          <AnimatedCounter value={data} duration={1000} startFrom={1} />
        </Text>
        <Text className="  text-neutral-700 dark:text-neutral-300 text-xs ">

        {tp('members', data, true)}
        </Text>
      </View>
    );
  });

  return (
    <Card addClassName=" bg-white dark:bg-neutral-900 flex-col gap-y-4 p-4  mx-2 mt-2">
      <View className="flex-row gap-y-2 ">
        <ProfilesList data ={data2} showEmpty={true} maxCount={12}/>
        <CounterText data={data} />
      </View>
      <Text className="text-xs  text-neutral-700 dark:text-neutral-300">
        {t('Community Intro')}
      </Text>
    </Card>
  )
}

function ComponentsSplash(props) {
  return (
    <View className="flex-col px-2 lg:px-6 w-full max-w-screen-2xl mx-auto">
      <View className="flex-col p-2 md:flex-row gap-y-4 sm:mx-2 sm:mb-2 gap-x-4 lg:my-4 duration-300 sm:border border-dashed rounded-3xl border-gray-500/20">
        <View className="flex-col xl:flex-row mx-auto  justify-center sm:justify-start items-center md:items-start xl:items-center gap-y-8 gap-x-12 flex-auto p-4 sm:p-8 md:p-6 lg:p-12  ">
          <View className="flex-col gap-y-4 w-40 xl:w-1/3 aspect-square rounded-full   ">
             <Svg
    aria-label="Logo Mark"
    className="p-[1px] group-hover:rotate-[180deg] group-hover:scale-125 group-active:scale-90 duration-500 h-full w-full  "
    viewBox="0 0 2400 2400"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <Path
      d="M1660 1478.25L2280 400C1939.86 596.377 1735.59 711.463 1412.5 898L1660 1478.25Z"
      className="opacity-80 "
      fill="#E2554F"
    />
    <Path
      d="M987.5 1502L740 921.75L120 2000L987.5 1502Z"
      className="opacity-80 "
      fill="#E2554F"
    />
    <Path
      d="M740 921.75L1360 2000L1660 1478.25L1040 400L740 921.75Z"
      className="text-neutral-950 dark:text-neutral-50   group-hover:text-accent dark:group-hover:text-accent-d"
      fill="#E2554F"
    />
    <Path
      d="M1200 2400C1862.74 2400 2400 1862.74 2400 1200C2400 997.894 2350.25 807.889 2262 640.8L2138.68 854.417C2178.34 962.119 2200 1078.53 2200 1200C2200 1752.28 1752.28 2200 1200 2200C923.41 2200 673.048 2087.73 492.015 1906.25L314 2008.6C533.433 2248.82 849.005 2400 1200 2400Z"
      className="group-hover:animate-pulse group-active:opacity-0 text-neutral-400 dark:text-neutral-600  group-hover:text-accent dark:group-hover:text-accent-d"
      fill="currentColor"
    />
    <Path
      d="M2086.43 391.138L1907.77 493.559C1726.76 312.204 1476.48 200 1200 200C647.715 200 200 647.715 200 1200C200 1321.97 221.023 1437.93 261 1546L138.5 1759.22C50.1818 1592.08 0 1402.19 0 1200C0 537.258 537.258 0 1200 0C1551.1 0 1866.99 150.788 2086.43 391.138Z"
      className="group-hover:animate-pulse group-active:opacity-0 text-neutral-400 dark:text-neutral-600  group-hover:text-accent dark:group-hover:text-accent-d"
      fill="currentColor"
    />
            </Svg>
          </View>

          <View className="flex-col gap-y-4 flex-auto ">
            <Text className="text-4xl lg:text-5xl tracking-tight text-center md:text-left font-bold text-neutral-800 dark:text-neutral-200 ">
              Welcome to the community!
            </Text>
            <Text className="text-base lg:text-lg xl:text-xl text-center md:text-left text-neutral-700 dark:text-neutral-300 ">
              Connect and create with like-minded people, discover new
              perspectives, share knowledge and grow together.
            </Text>
          </View>
        </View>

        <View className="mx-auto w-full md:w-1/2 xl:w-1/3 my-auto sm:p-2 lg:p-12 ">
          
          <Card addClassName=" rounded-2xl justify-center w-full max-w-xl mx-auto flex-auto  flex-col ">
            <View className="px-2 sm:px-4 pt-6">{props.block}</View>
            <Link
              className="px-8 mx-auto  w-full border-bdr dark:border-bdr-d"
              href="/forgot-password"
            >
              <Button
                title="Forgot password?"
                variant="link"
                fullWidth
                size="xs"
              />
            </Link>
            <Text className="text-center translate-y-4 text-xs bg-bgrcard dark:bg-bgrcard-d p-2 mx-auto rounded-full text-neutral-700 dark:text-neutral-300  ">
              Don't have an account?</Text>
            <Link
              className="p-6 sm:p-8 w-full border-t border-bdr dark:border-bdr-d"
              href="/create-account"
            >
              <Button
                title="Create account"
                variant="outline"
                startDecorator="UserCirclePlus"
                size="base"
                fullWidth
              />
            </Link>
          </Card>
        </View>
      </View>
      <View className="flex-col sm:flex-row flex-wrap w-full duration-300">
        <View className="sm:flex-auto sm:w-1/2 md:w-1/3 lg:w-1/4 p-2">
          <Card addClassName=" rounded-2xl w-full flex-auto flex-col gap-y-2 p-4">
            <View className="flex-row gap-x-2 ">
              <Button variant="outline" startDecorator="Users" rounded />
              <Text className="flex-auto my-auto text-neutral-800 dark:text-neutral-200 text-xl font-semibold ">
                Meet People
              </Text>
            </View>
            <Text
              numberOfLines={2}
              className="text-base text-neutral-600 dark:text-neutral-400"
            >
              Make new friends and create lasting connections.
            </Text>
          </Card>
        </View>
        <View className="sm:flex-auto sm:w-1/2 md:w-1/3 lg:w-1/4 p-2">
          <Card addClassName=" rounded-2xl w-full flex-auto flex-col gap-y-2 p-4">
            <View className="flex-row gap-x-2 ">
              <Button variant="outline" startDecorator="UsersThree" rounded />
              <Text className="flex-auto my-auto text-neutral-800 dark:text-neutral-200 text-xl font-semibold ">
                Join Groups
              </Text>
            </View>
            <Text
              numberOfLines={2}
              className="text-base text-neutral-600 dark:text-neutral-400"
            >
              Find your tribe in groups that match your interests.
            </Text>
          </Card>
        </View>
        <View className="sm:flex-auto sm:w-1/2 md:w-1/3 lg:w-1/4 p-2">
          <Card addClassName=" rounded-2xl w-full flex-auto flex-col gap-y-2 p-4">
            <View className="flex-row gap-x-2 ">
              <Button
                variant="outline"
                startDecorator="ChatCenteredText"
                rounded
              />
              <Text className="flex-auto my-auto text-neutral-800 dark:text-neutral-200 text-xl font-semibold ">
                Share Ideas
              </Text>
            </View>
            <Text
              numberOfLines={2}
              className="text-base text-neutral-600 dark:text-neutral-400"
            >
              Spitball ideas and get feedback from folks who get it.
            </Text>
          </Card>
        </View>
        <View className="sm:flex-auto sm:w-1/2 md:w-1/3 lg:w-1/4 p-2">
          <Card addClassName=" rounded-2xl w-full flex-auto flex-col gap-y-2 p-4">
            <View className="flex-row gap-x-2 ">
              <Button
                variant="outline"
                startDecorator="CalendarCheck"
                rounded
              />
              <Text className="flex-auto my-auto text-neutral-800 dark:text-neutral-200 text-xl font-semibold ">
                Discover Events
              </Text>
            </View>
            <Text
              numberOfLines={2}
              className="text-base text-neutral-600 dark:text-neutral-400"
            >
              Find out what's happening and catch events you care about.
            </Text>
          </Card>
        </View>
        <View className="sm:flex-auto sm:w-1/2 md:w-1/3 lg:w-1/4 p-2">
          <Card addClassName=" rounded-2xl w-full flex-auto flex-col gap-y-2 p-4">
            <View className="flex-row gap-x-2 ">
              <Button
                variant="outline"
                startDecorator="ChatTeardropDots"
                rounded
              />
              <Text className="flex-auto my-auto text-neutral-800 dark:text-neutral-200 text-xl font-semibold ">
                Message Friends
              </Text>
            </View>
            <Text
              numberOfLines={2}
              className="text-base text-neutral-600 dark:text-neutral-400"
            >
              Chat on the go with your friends, wherever, whenever.
            </Text>
          </Card>
        </View>
        <View className="sm:flex-auto sm:w-1/2 md:w-1/3 lg:w-1/4 p-2">
          <Card addClassName=" rounded-2xl w-full flex-auto flex-col gap-y-2 p-4">
            <View className="flex-row gap-x-2 ">
              <Button variant="outline" startDecorator="Chats" rounded />
              <Text className="flex-auto my-auto text-neutral-800 dark:text-neutral-200 text-xl font-semibold ">
                Discuss Topics
              </Text>
            </View>
            <Text
              numberOfLines={2}
              className="text-base text-neutral-600 dark:text-neutral-400"
            >
              Ask questions, jump into debates or chat casually, your call.
            </Text>
          </Card>
        </View>
        <View className="sm:flex-auto sm:w-1/2 md:w-1/3 lg:w-1/4 p-2">
          <Card addClassName=" rounded-2xl w-full flex-auto flex-col gap-y-2 p-4">
            <View className="flex-row gap-x-2 ">
              <Button variant="outline" startDecorator="Storefront" rounded />
              <Text className="flex-auto my-auto text-neutral-800 dark:text-neutral-200 text-xl font-semibold ">
                Buy & Sell
              </Text>
            </View>
            <Text
              numberOfLines={2}
              className="text-base text-neutral-600 dark:text-neutral-400"
            >
              Grab deals or sell your own stuff on a marketplace you can trust.
            </Text>
          </Card>
        </View>
        <View className="sm:flex-auto sm:w-1/2 md:w-1/3 lg:w-1/4 p-2">
          <Card addClassName=" rounded-2xl w-full flex-auto flex-col gap-y-2 p-4">
            <View className="flex-row gap-x-2 ">
              <Button variant="outline" startDecorator="Video" rounded />
              <Text className="flex-auto my-auto text-neutral-800 dark:text-neutral-200 text-xl font-semibold ">
                Watch Videos
              </Text>
            </View>
            <Text
              numberOfLines={2}
              className="text-base text-neutral-600 dark:text-neutral-400"
            >
              Explore, learn, and get entertained with the latest videos.
            </Text>
          </Card>
        </View>
      </View>
    </View>
  )
}

const ComponentsDummy = (
  <>
    <Row className="mb-auto  text-green-800 bg-green-200 dark:bg-green-950 gap-x-1 py-1 px-2 rounded-full dark:text-green-200 ">
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
      <Text className={'flex-none text-red-800 dark:text-red-200 text-xs'}>
        456
      </Text>
    </Row>

    <Row className="w-1/5 mb-auto  text-gray-800 bg-gray-200 dark:bg-gray-950 gap-x-1 py-1 px-2 rounded-full dark:text-gray-200 ">
      <Icon
        className="text-gray-600 dark:text-gray-400"
        icon="ArrowFatUp"
        width={16}
        height={16}
      />
      <Text className={'flex-none text-gray-800 dark:text-gray-200 text-xs'}>
        123
      </Text>
    </Row>
    <Row className="bg-orange-500 bg-yellow-500 bg-green-500 bg-teal-500 bg-sky-500 bg-indigo-500 bg-purple-500 bg-pink-500 bg-rose-500 bg-red-500">
      <Icon
        className="text-gray-600 dark:text-gray-400"
        icon="ArrowFatUp"
        width={16}
        height={16}
      />
      <Text className={'flex-none text-gray-800 dark:text-gray-200 text-xs'}>
        123
      </Text>
    </Row>
  </>
)


const ComponentsFooter = () => {
  const { t } = useTranslation();
  return (
    <>
      <Card addClassName="w-full p-3 flex-row justify-center ">
        <Link href="/about">
          <Button variant="text" title={t("About")} className="mt-auto" size="sm" />
        </Link>

        <Link href="/contact">
          <Button variant="text" title={t("Contact")} className="mt-auto" size="sm" />
        </Link>
        <Link href="/privacy">
          <Button variant="text" title={t("Privacy")} className="mt-auto" size="sm" />
        </Link>
        <Link href="/terms">
          <Button variant="text" title={t("Terms")} className="mt-auto" size="sm" />
        </Link>
      </Card>
    </>
  )
}

const ComponentsFullFooter = () => {
  const { t } = useTranslation();
  return (
  <>
    <View className=" w-full p-3 flex-row justify-center border-t backdrop-blur border-bdr dark:border-bdr-d mt-8 ">
      <Link href="/">
        <Button variant="text" title={t("Home")} className="mt-auto" size="sm" />
      </Link>
      <Link href="/about">
        <Button variant="text" title={t("About")} className="mt-auto" size="sm" />
      </Link>

      <Link href="/contact">
        <Button variant="text" title={t("Contact")} className="mt-auto" size="sm" />
      </Link>
      <Link href="/privacy">
        <Button variant="text" title={t("Privacy")} className="mt-auto" size="sm" />
      </Link>
      <Link href="/terms">
        <Button variant="text" title={t("Terms")} className="mt-auto" size="sm" />
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
  components_comments_empty: ComponentsCommentsEmpty,
  components_content_empty: ComponentsContentEmpty,
  components_intro: ComponentsIntro,
  components_splash: ComponentsSplash,
  components_dummy: ComponentsDummy,
  components_footer: ComponentsFooter,
  components_fullfooter: ComponentsFullFooter,
}
