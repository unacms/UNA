import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { BlockByName } from 'app/components/block'
import { getPageWidth } from 'app/lib/util'
import { Text } from 'app/design/typography'
import Card from 'app/components/card'
import { Button } from 'app/design/controls'
import Link from 'app/ui/atoms/link'
import Svg, { Path } from 'react-native-svg'


export default function PageLayout(props) {
    return (
      <ScrollView className={getPageWidth(props.uri) + '  mx-auto w-full '}>
        <View className="w-full flex-row flex-col  lg:h-[calc(100vh-4rem)] lg:flex-row ">
          <View className=" w-full p-8 sm:p-12 lg:bg-bgrnavbar/50 lg:dark:bg-bgrnavbar-d/50 lg:border-r border-dashed border-bdr dark:border-bdr-d   lg:w-1/2">
                 
                          
            <View className="flex-col mx-auto w-full items-center lg:items-start max-w-md lg:max-w-xl mx-auto gap-y-4 lg:gap-y-8 my-auto ">
            
            
                        
                    
                    <Text className="text-4xl lg:text-5xl tracking-tight font-bold text-neutral-800 dark:text-neutral-200 ">
                    Join now! 
                    </Text>
            
              <Text className="text-base lg:text-lg xl:text-xl  text-neutral-700 dark:text-neutral-300  ">
                Create an account to get started. 
                
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
          <View className="p-4 flex-col w-full lg:w-1/2">
            <View className=" max-w-lg w-full lg:p-8 mx-auto my-auto">
              
              <View addClassName=" justify-center w-full max-w-xl mx-auto flex-auto  flex-col gap-y-4 ">
            <BlockByName name={props.blocks.form} data={props.data} />
            <Link
              className="px-8 mx-auto mb-8 w-full "
              href="/forgot-password"
            >
              <Button
                title="Forgot password?"
                variant="link"
                fullWidth
                size="sm"
              />
            </Link>
            
            <Card addClassName="border p-4 sm:p-6 rounded-2xl justify-center w-full max-w-xl mx-auto flex-auto gap-y-4 flex-col ">
            
            <Text className="text-center  text-lg font-semibold  mx-auto text-neutral-700 dark:text-neutral-300  ">
            Already have an account?</Text>
            <Link
              className=" w-full "
              href="/login"
            >
              <Button
                title="Log in with email"
                variant="outline"
                startDecorator="SignIn"
                size="base"
                fullWidth
              />
            </Link>
          </Card>
          </View>
            </View>


          </View>
        </View>
      </ScrollView>
    )
}
