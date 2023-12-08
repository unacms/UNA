import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { BlockByName } from 'app/components/block'
import { getPageWidth } from 'app/lib/util'
import { Text } from 'app/design/typography'
import Card from 'app/components/card'
import { Button } from 'app/design/controls'
import Link from 'app/ui/atoms/link'


export default function PageLayout(props) {
  return (
    <ScrollView
      className={
        getPageWidth(props.uri) + ' lg:h-[calc(100vh-4rem)] justify-center '
      }
    >
      <View className=" w-full  mx-auto max-w-5xl flex-col items-center lg:flex-row  rounded-3xl lg:bg-bgrnavbar/50 lg:dark:bg-bgrnavbar-d/50 lg:border border-dashed border-bdr dark:border-bdr-d ">
        <View className="flex-col p-8 flex-auto w-full  items-center lg:items-start  gap-y-4 lg:gap-y-8 my-auto ">
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

        <View className=" flex-auto flex-col w-full max-w-md  ">
          <View className=""><BlockByName name={props.blocks.form} data={props.data} /></View>
          <View className="px-2 sm:px-4 pb-4">
          <Card
            rounded=" rounded-2xl "
            addClassName="border p-4 sm:p-6 w-full  max-w-xl mx-auto flex-auto gap-y-6 flex-col "
          >
            <Text className="text-lg font-bold  mx-auto text-neutral-700 dark:text-neutral-300  ">
              Already have an account?
            </Text>
            <Link className=" w-full " href="/login">
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
    </ScrollView>
  )
}
