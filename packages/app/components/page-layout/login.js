import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { BlockByName } from 'app/components/block'
import { getPageWidth } from 'app/lib/util'
import { Text } from 'app/design/typography'
import Card from 'app/components/card'
import { Button } from 'app/design/controls'
import Svg, { Path } from 'react-native-svg'
import Link from 'app/ui/atoms/link'


export default function PageLayout(props) {
    return (
        <ScrollView className={ getPageWidth(props.uri) + ' mx-auto w-full '}>
            


            <View className="w-full flex-row flex-col  lg:min-h-screen lg:flex-row ">
          <View className=" w-full p-8 sm:p-12 lg:bg-bgrnavbar lg:dark:bg-bgrnavbar-d   lg:w-1/2">
            <View className="lg:-translate-y-20 items-center lg:items-start flex-col mx-auto w-full  max-w-md lg:max-w-xl mx-auto  gap-y-4 lg:gap-y-8 my-auto ">
                    
                        <View className="flex-col w-1/4 aspect-square rounded-full   ">
                            <Svg
                    aria-label="Logo Mark"
                    className="p-[1px] group-h:rotate-[180deg] group-h:scale-125 group-active:scale-90 duration-500 h-full w-full  "
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
                    className="text-neutral-950 dark:text-neutral-50   group-h:text-accent dark:group-h:text-accent-d"
                    fill="#E2554F"
                    />
                    <Path
                    d="M1200 2400C1862.74 2400 2400 1862.74 2400 1200C2400 997.894 2350.25 807.889 2262 640.8L2138.68 854.417C2178.34 962.119 2200 1078.53 2200 1200C2200 1752.28 1752.28 2200 1200 2200C923.41 2200 673.048 2087.73 492.015 1906.25L314 2008.6C533.433 2248.82 849.005 2400 1200 2400Z"
                    className="group-h:animate-pulse group-active:opacity-0 text-neutral-400 dark:text-neutral-600  group-h:text-accent dark:group-h:text-accent-d"
                    fill="currentColor"
                    />
                    <Path
                    d="M2086.43 391.138L1907.77 493.559C1726.76 312.204 1476.48 200 1200 200C647.715 200 200 647.715 200 1200C200 1321.97 221.023 1437.93 261 1546L138.5 1759.22C50.1818 1592.08 0 1402.19 0 1200C0 537.258 537.258 0 1200 0C1551.1 0 1866.99 150.788 2086.43 391.138Z"
                    className="group-h:animate-pulse group-active:opacity-0 text-neutral-400 dark:text-neutral-600  group-h:text-accent dark:group-h:text-accent-d"
                    fill="currentColor"
                    />
                            </Svg>
                        </View>

                        
                        

                    
                    <Text className="text-3xl text-center lg:text-left lg:text-4xl tracking-tight font-bold text-neutral-800 dark:text-neutral-200 ">
                    Welcome back!
                    </Text>
            
              <Text className="text-base text-center lg:text-left lg:text-lg xl:text-xl  text-neutral-700 dark:text-neutral-300  ">
                Log in to your account to continue. 
              </Text>
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

            </View>
          </View>
          <View className="p-4 w-full lg:w-1/2">
            <View className=" max-w-lg w-full lg:-translate-y-20  lg:p-8 mx-auto my-auto">
              
              <Card addClassName=" rounded-2xl justify-center w-full max-w-xl mx-auto flex-auto  flex-col ">
            <View className="px-2 sm:px-4"><BlockByName name={props.blocks.form} data={props.data}/></View>
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
        </View>
        </ScrollView>)
}
