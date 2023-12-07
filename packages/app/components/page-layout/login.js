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
        getPageWidth(props.uri) + ' lg:h-[calc(100vh-4rem)] justify-center'
      }
    >
      <View className=" w-full mx-auto max-w-5xl flex-col items-center lg:flex-row p-3 rounded-3xl lg:bg-bgrnavbar/50 lg:dark:bg-bgrnavbar-d/50 lg:border border-dashed border-bdr dark:border-bdr-d ">
        <View className="flex-col p-8 flex-auto w-full  items-center lg:items-start  gap-y-4 lg:gap-y-8 my-auto ">
          <Text className="text-4xl lg:text-5xl tracking-tight font-bold text-neutral-800 dark:text-neutral-200 ">
            Welcome back!
          </Text>

          <Text className="text-base lg:text-lg xl:text-xl  text-neutral-700 dark:text-neutral-300  ">
            Login to your account to continue.
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
       

        <View className=" flex-auto flex-col w-full max-w-xl gap-y-3 ">
        <BlockByName name={props.blocks.form} data={props.data} />
              <Link
                className=" mx-auto  w-full "
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
                  Don't have an account?
                </Text>
                <Link className=" w-full " href="/create-account">
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
    </ScrollView>
  )
}
