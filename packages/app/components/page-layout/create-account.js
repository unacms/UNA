import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { BlockByName } from 'app/components/block'
import { getPageWidth } from 'app/lib/util'
import { Text } from 'app/design/typography'
import Card from 'app/components/card'
import { Button } from 'app/design/controls'

export default function PageLayout(props) {
    return (
      <ScrollView className={getPageWidth(props.uri) + '  mx-auto w-full '}>
        <View className="w-full flex-row flex-col  lg:min-h-screen lg:flex-row ">
          <View className=" w-full p-8 sm:p-12 lg:bg-bgrnavbar lg:dark:bg-bgrnavbar-d   lg:w-1/2">
            <View className="lg:-translate-y-20 flex-col mx-auto w-full  max-w-md lg:max-w-xl mx-auto  gap-y-8 my-auto ">
                    
            <View className='w-full'>

                    <Text className="text-3xl lg:text-4xl tracking-tight font-bold text-primary dark:text-primary-d  ">
                    Join today!
                    </Text>
                    <Text className="text-3xl lg:text-4xl tracking-tight font-bold text-neutral-800 dark:text-neutral-200 ">
                    It's quick and easy.
                    </Text>
            </View>
              <Text className="text-base lg:text-lg xl:text-xl  text-neutral-700 dark:text-neutral-300  ">
                Create an account to get started and enjoy all the features and
                benefits of our community. 
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
              <Card addClassName=" px-4 pb-4 rounded-2xl justify-center w-full max-w-xl mx-auto flex-auto  flex-col ">
                <BlockByName name={props.blocks.form} data={props.data} />
              </Card>
            </View>
          </View>
        </View>
      </ScrollView>
    )
}
