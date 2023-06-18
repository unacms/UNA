import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls'
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg'
import Link from 'app/ui/atoms/link'
import { Icon } from 'app/ui/atoms/icon'
export const staticDefault = {
  logo: {
    text: (
      <Svg
        aria-label="Logo Text"
        className="h-6 w-16 hidden sm:block text-neutral-800 dark:text-neutral-200 group-hover:text-gray-900 dark:group-hover:text-gray-100 duration-500"
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
    ),

    mark: (
      <Svg
        aria-label="Logo Mark"
        className=" group-hover:rotate-[360deg]  group-active:scale-125 duration-500 h-8 w-8  "
        viewBox="0 0 2400 2400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <Path
          d="M1660 1478.25L2280 400C1939.86 596.377 1735.59 711.463 1412.5 898L1660 1478.25Z"
          className="  text-neutral-800 dark:text-neutral-200  group-hover:text-accent-400 dark:group-hover:text-accent-600"
          fill="currentColor"
        />
        <Path
          d="M987.5 1502L740 921.75L120 2000L987.5 1502Z"
          className="text-neutral-800 dark:text-neutral-200  group-hover:text-accent-400 dark:group-hover:text-accent-600"
          fill="currentColor"
        />
        <Path
          d="M740 921.75L1360 2000L1660 1478.25L1040 400L740 921.75Z"
          className="text-neutral-950 dark:text-neutral-50   group-hover:text-accent dark:group-hover:text-accent-dark"
          fill="currentColor"
        />
        <Path
          d="M1200 2400C1862.74 2400 2400 1862.74 2400 1200C2400 997.894 2350.25 807.889 2262 640.8L2138.68 854.417C2178.34 962.119 2200 1078.53 2200 1200C2200 1752.28 1752.28 2200 1200 2200C923.41 2200 673.048 2087.73 492.015 1906.25L314 2008.6C533.433 2248.82 849.005 2400 1200 2400Z"
          className="group-hover:animate-pulse group-active:opacity-0 text-neutral-400 dark:text-neutral-600  group-hover:text-primary-400 dark:group-hover:text-primary-600"
          fill="currentColor"
        />
        <Path
          d="M2086.43 391.138L1907.77 493.559C1726.76 312.204 1476.48 200 1200 200C647.715 200 200 647.715 200 1200C200 1321.97 221.023 1437.93 261 1546L138.5 1759.22C50.1818 1592.08 0 1402.19 0 1200C0 537.258 537.258 0 1200 0C1551.1 0 1866.99 150.788 2086.43 391.138Z"
          className="group-hover:animate-pulse group-active:opacity-0  text-neutral-400 dark:text-neutral-600 group-hover:text-primary-400 dark:group-hover:text-primary-600"
          fill="currentColor"
        />
      </Svg>
    ),

    native: (
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
          fill="currentColor"
        />
        <Path
          d="M987.5 1502L740 921.75L120 2000L987.5 1502Z"
          fill="currentColor"
        />

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
    ),
    nativedark: (
      <Svg
        className="w-20 h-6 text-primary-dark"
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
          fill="currentColor"
        />
        <Path
          d="M987.5 1502L740 921.75L120 2000L987.5 1502Z"
          fill="currentColor"
        />

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
    ),
  },
  components: {
    about: (
      <>
        <Text className="text-3xl lg:text-4xl xl:text-5xl  font-bold text-neutral-800 dark:text-neutral-200">
          About
        </Text>
        <Text className="text-lg lg:text-xl xl:text-2xl  text-neutral-600 dark:text-neutral-400">
          The place to connect, share and grow with the community.
        </Text>
      </>
    ),
    home: (
      <View className=" w-full max-w-screen-xl mx-auto">
        <View className=" flex-col p-12  w-full md:flex-row gap-y-8 gap-x-8 duration-500   mx-auto">
          <View className="flex-col items-center md:items-start md:text-start gap-y-8 my-auto  flex-auto">
            <Text className="text-4xl lg:text-5xl   font-bold text-neutral-900 dark:text-neutral-100 text-center md:text-start">
              Welcome to your network!
            </Text>

            <Text className="text-xl  text-neutral-700 dark:text-neutral-300 text-center md:text-start">
              Connect, create, discover, learn, share and grow together with
              your community.
            </Text>
            <Row className="gap-x-2">
              <Link href="/create-account">
                <Button
                  title="Create new account"
                  variant="primary"
                  startDecorator="UserCirclePlus"
                />
              </Link>
              <Link href="/login">
                <Button
                  title="Log in"
                  variant="default"
                  startDecorator="SignIn"
                />
              </Link>
            </Row>
          </View>
          <View className=" w-full p-8 md:w-[40%] border border-transparent hover:border-bordercolor dark:hover:border-bordercolor-dark   hover:shadow-xl hover:rotate-3 duration-500 w-full  backdrop-blur-md   rounded-full p-4  ">
            <Svg
              aria-label="Logo Mark"
              className="   "
              viewBox="0 0 2400 2400"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <Path
                d="M1660 1478.25L2280 400C1939.86 596.377 1735.59 711.463 1412.5 898L1660 1478.25Z"
                className="  text-accent-400 dark:text-accent-600"
                fill="currentColor"
              />
              <Path
                d="M987.5 1502L740 921.75L120 2000L987.5 1502Z"
                className="text-accent-400 dark:text-accent-600"
                fill="currentColor"
              />
              <Path
                d="M740 921.75L1360 2000L1660 1478.25L1040 400L740 921.75Z"
                className="text-accent dark:text-accent-dark"
                fill="currentColor"
              />
              <Path
                d="M1200 2400C1862.74 2400 2400 1862.74 2400 1200C2400 997.894 2350.25 807.889 2262 640.8L2138.68 854.417C2178.34 962.119 2200 1078.53 2200 1200C2200 1752.28 1752.28 2200 1200 2200C923.41 2200 673.048 2087.73 492.015 1906.25L314 2008.6C533.433 2248.82 849.005 2400 1200 2400Z"
                className="text-primary-400 dark:text-primary-600"
                fill="currentColor"
              />
              <Path
                d="M2086.43 391.138L1907.77 493.559C1726.76 312.204 1476.48 200 1200 200C647.715 200 200 647.715 200 1200C200 1321.97 221.023 1437.93 261 1546L138.5 1759.22C50.1818 1592.08 0 1402.19 0 1200C0 537.258 537.258 0 1200 0C1551.1 0 1866.99 150.788 2086.43 391.138Z"
                className="text-primary-400 dark:text-primary-600"
                fill="currentColor"
              />
            </Svg>
          </View>
        </View>

        <Row className="flex-wrap p-2  flex-auto mb-20 ">
          <View className=" w-1/2 lg:w-1/3  p-3 ">
            <View className="p-4 gap-y-4 rounded-lg bg-backgroundcard dark:bg-backgroundcard-dark shadow-sm">
              <View className="flex-row  gap-x-4 items-center ">
                <Text className="flex-auto my-auto text-neutral-950  dark:text-neutral-50  text-2xl font-semibold ">
                  Connect
                </Text>
                <Icon icon="Graph" width={32} height={32} />
              </View>

              <Text className=" my-auto text-neutral-600 whitespace-normal dark:text-neutral-400  text-base ">
                Make friends and create lasting connections with like-minded people. 
              </Text>
            </View>
          </View>
          <View className=" w-1/2 lg:w-1/3  p-3 ">
            <View className="p-4 gap-y-4 rounded-lg bg-backgroundcard dark:bg-backgroundcard-dark  shadow-sm">
              <View className="flex-row  gap-x-4 items-center ">
                <Text className="flex-auto my-auto text-neutral-950  dark:text-neutral-50  text-2xl font-semibold ">
                  Discuss
                </Text>
                <Icon icon="ChatsTeardrop" width={32} height={32} />
              </View>

              <Text className=" my-auto text-neutral-600 whitespace-normal dark:text-neutral-400  text-base ">
                Talk about your interests and hobbies. Bring out thoughts and ideas.
              </Text>
            </View>
          </View>
          <View className=" w-1/2 lg:w-1/3  p-3 ">
            <View className="p-4 gap-y-4 rounded-lg bg-backgroundcard dark:bg-backgroundcard-dark  shadow-sm">
              <View className="flex-row  gap-x-4 items-center ">
                <Text className="flex-auto my-auto text-neutral-950  dark:text-neutral-50  text-2xl font-semibold  ">
                  Share
                </Text>
                <Icon icon="ShareNetwork" width={32} height={32} />
              </View>

              <Text className=" my-auto text-neutral-600 whitespace-normal dark:text-neutral-400  text-base ">
                Share your thoughts, ideas, experiences and knowledge with the community.
              </Text>
            </View>
          </View>
          <View className=" w-1/2 lg:w-1/3  p-3 ">
            <View className="p-4 gap-y-4 rounded-lg bg-backgroundcard dark:bg-backgroundcard-dark  shadow-sm">
              <View className="flex-row  gap-x-4 items-center ">
                <Text className="flex-auto my-auto text-neutral-950  dark:text-neutral-50  text-2xl font-semibold ">
                  Create
                </Text>
                <Icon icon="MagicWand" width={32} height={32} />
              </View>

              <Text className=" my-auto text-neutral-600 whitespace-normal dark:text-neutral-400  text-base ">
                 Write articles, create polls, publish video, post comments and more.
              </Text>
            </View>
          </View>
          <View className=" w-1/2 lg:w-1/3  p-3 ">
            <View className="p-4 gap-y-4 rounded-lg bg-backgroundcard dark:bg-backgroundcard-dark  shadow-sm">
              <View className="flex-row  gap-x-4 items-center ">
                <Text className="flex-auto my-auto text-neutral-950  dark:text-neutral-50  text-2xl font-semibold ">
                  Learn
                </Text>
                <Icon icon="Student" width={32} height={32} />
              </View>

              <Text className=" my-auto text-neutral-600 whitespace-normal dark:text-neutral-400  text-base ">
                Explore new ideas and learn from experts and peers in your field.
              </Text>
            </View>
          </View>
          <View className=" w-1/2 lg:w-1/3  p-3 ">
            <View className="p-4 gap-y-4 rounded-lg bg-backgroundcard dark:bg-backgroundcard-dark  shadow-sm">
              <View className="flex-row  gap-x-4 items-center ">
                <Text className="flex-auto my-auto text-neutral-950  dark:text-neutral-50  text-2xl font-semibold ">
                  Collaborate
                </Text>
                <Icon icon="Handshake" width={32} height={32} />
              </View>

              <Text className=" my-auto text-neutral-600 whitespace-normal dark:text-neutral-400  text-base ">
                Work together to achieve common goals as a team and grow together.
              </Text>
            </View>
          </View>


        </Row>
      </View>
    ),
  },
}
