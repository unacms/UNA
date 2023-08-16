import { View } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls'
import Link from 'app/ui/atoms/link'
import { Row } from 'app/design/view'
import { Icon } from 'app/ui/atoms/icon'
import { useCurrentUser } from 'app/context/user'
import Profile from 'app/ui/molecules/profile'

export default function PageLayout(props) {
  let { currentUser, setCurrentUser } = useCurrentUser()

  let profile = null
  if (currentUser) {
    let dUser = Object.assign({}, currentUser)
    dUser.url_avatar = dUser.avatar
    dUser.url = '/dashboard'
    profile = <Profile {...dUser} displayType="unit_wo_info" size="lg" />
  }

  if (!currentUser) return <></>

  return (
    <View className="w-full p-2 max-w-screen-2xl mx-auto flex-col xl:flex-row ">
      <View className=" w-full xl:w-1/4 p-2 xl:pr-3">
        <Link href={currentUser.url}>
          <View
            className="w-full p-3 flex-col xl:flex-col gap-x-1 duration-300 rounded-xl group
            bg-white dark:bg-neutral-900  active:bg-neutral-100 dark:active:bg-neutral-900
            shadow-sm  active:shadow-none 
            border border-neutral-200 dark:border-neutral-800"
          >
            <View className="flex-auto flex-row my-auto items-center">
              <View className=" my-auto p-1.5 mr-3 border border-neutral-200 dark:border-neutral-800 rounded-full">
                {profile}
              </View>
              <Text className="my-auto flex-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-neutral-50 text-lg font-semibold ">
                {currentUser.display_name}
              </Text>
              <View className="flex-row gap-x-2 my-auto xl:hidden">
                <Button variant="outline" startDecorator="UserSwitch" rounded />
                <Button variant="outline" startDecorator="Gear" rounded />
                <Button variant="outline" startDecorator="SignOut" rounded />
              </View>
            </View>
            <View className="flex-auto mt-4  flex-col my-auto hidden xl:flex ">
              <View className="flex-col gap-y-0.5">
                <Button
                  variant="text"
                  title="Switch Profile"
                  startDecorator="UserSwitch"
                  fullWidth
                  align="left"
                />
                <Button
                  variant="text"
                  title="Account Settings"
                  startDecorator="Gear"
                  fullWidth
                  align="left"
                />
                <Button
                  variant="text"
                  title="Sign out"
                  startDecorator="SignOut"
                  fullWidth
                  align="left"
                />
              </View>
            </View>
          </View>
        </Link>
      </View>
      <Row className="flex-wrap flex-auto mb-auto ">
        <View className=" w-1/2 lg:w-1/3 px-2 py-1.5">
          <Link href="/friends">
            <View
              className="w-full sm:hover:scale-105  p-3 flex-col sm:flex-row gap-x-1 duration-300 rounded-xl group bg-white active:opacity-50
                         sm:hover:-translate-y-0.5 active:translate-y-1 border 
                        bg-backgroundcard dark:bg-backgroundcard-dark border-bordercolorcard dark:border-bordercolorcard-dark"
            >
              <Row className=" my-auto">
                <Button variant="outline" startDecorator="Users" rounded />
              </Row>
              <View className="flex-auto flex-col my-auto ">
                <Text className="pt-2 sm:py-2 sm:pl-2 my-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white text-lg font-semibold ">
                  Friends
                </Text>
              </View>
            </View>
          </Link>
        </View>

        <View className=" w-1/2 lg:w-1/3 px-2 py-1.5">
          <Link href="/posts-home">
            <View
              className="w-full sm:hover:scale-105  p-3 flex-col sm:flex-row gap-x-1 duration-300 rounded-xl group bg-white active:opacity-50
                         sm:hover:-translate-y-0.5 active:translate-y-1 border 
                        bg-backgroundcard dark:bg-backgroundcard-dark border-bordercolorcard dark:border-bordercolorcard-dark"
            >
              <Row className=" my-auto">
                <Button variant="outline" startDecorator="Files" rounded />
              </Row>

              <View className="flex-col my-auto flex-auto">
                <Text className="pt-2 sm:py-2 sm:pl-2 my-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-neutral-50 text-lg font-semibold ">
                  Posts
                </Text>
              </View>
            </View>
          </Link>
        </View>

        <View className=" w-1/2 lg:w-1/3 px-2 py-1.5">
          <Link href="/discussions-home">
            <View
              className="w-full sm:hover:scale-105  p-3 flex-col sm:flex-row gap-x-1 duration-300 rounded-xl group bg-white active:opacity-50
                         sm:hover:-translate-y-0.5 active:translate-y-1 border 
                        bg-backgroundcard dark:bg-backgroundcard-dark border-bordercolorcard dark:border-bordercolorcard-dark"
            >
              <Row className=" my-auto">
                <Button
                  variant="outline"
                  startDecorator="ChatsCircle"
                  rounded
                />
              </Row>

              <View className="flex-col my-auto flex-auto">
                <Text className="pt-2 sm:py-2 sm:pl-2 my-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white text-lg font-semibold ">
                  Discussions
                </Text>
              </View>
            </View>
          </Link>
        </View>

        <View className=" w-1/2 lg:w-1/3 px-2 py-1.5 ">
          <Link href="/groups-home">
            <View
              className="w-full sm:hover:scale-105  p-3 flex-col sm:flex-row gap-x-1 duration-300 rounded-xl group bg-white active:opacity-50
                         sm:hover:-translate-y-0.5 active:translate-y-1 border 
                        bg-backgroundcard dark:bg-backgroundcard-dark border-bordercolorcard dark:border-bordercolorcard-dark"
            >
              <Row className=" my-auto">
                <Button variant="outline" startDecorator="UsersThree" rounded />
              </Row>

              <View className="flex-col my-auto flex-auto">
                <Text className="pt-2 sm:py-2 sm:pl-2 my-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white text-lg font-semibold ">
                  Groups
                </Text>
              </View>
            </View>
          </Link>
        </View>

        <View className=" w-1/2 lg:w-1/3 px-2 py-1.5 ">
          <Link href="/events-home">
            <View
              className="w-full sm:hover:scale-105  p-3 flex-col sm:flex-row gap-x-1 duration-300 rounded-xl group bg-white active:opacity-50
                         sm:hover:-translate-y-0.5 active:translate-y-1 border 
                        bg-backgroundcard dark:bg-backgroundcard-dark border-bordercolorcard dark:border-bordercolorcard-dark"
            >
              <Row className=" my-auto">
                <Button
                  variant="outline"
                  startDecorator="CalendarCheck"
                  rounded
                />
              </Row>

              <View className="flex-col my-auto flex-auto">
                <Text className="pt-2 sm:py-2 sm:pl-2 my-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white text-lg font-semibold ">
                  Events
                </Text>
              </View>
            </View>
          </Link>
        </View>

        <View className=" w-1/2 lg:w-1/3 px-2 py-1.5 ">
          <Link href="/account-settings-email">
            <View
              className="w-full sm:hover:scale-105  p-3 flex-col sm:flex-row gap-x-1 duration-300 rounded-xl group bg-white active:opacity-50
                        sm:hover:-translate-y-0.5 active:translate-y-1 border 
                        bg-backgroundcard dark:bg-backgroundcard-dark border-bordercolorcard dark:border-bordercolorcard-dark"
            >
              <Row className=" my-auto w-auto">
                <Button variant="outline" startDecorator="Gear" rounded />
              </Row>
              <View className="flex-col my-auto flex-auto">
                <Text className="pt-2 sm:py-2 sm:pl-2 my-auto  text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white text-lg font-semibold ">
                  Settings
                </Text>
              </View>
            </View>
          </Link>
        </View>

        <View className=" w-1/2 lg:w-1/3 px-2 py-1.5 ">
          <Link href="/logout">
            <View
              className="w-full sm:hover:scale-105  p-3 flex-col sm:flex-row gap-x-1 duration-300 rounded-xl group bg-white active:opacity-50
                        sm:hover:-translate-y-0.5 active:translate-y-1 border 
                        bg-backgroundcard dark:bg-backgroundcard-dark border-bordercolorcard dark:border-bordercolorcard-dark"
            >
              <Row className=" my-auto">
                <Button variant="outline" startDecorator="SignOut" rounded />
              </Row>

              <View className="flex-col my-auto flex-auto">
                <Text className="pt-2 sm:py-2 sm:pl-2 my-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white text-lg font-semibold ">
                  Sign out
                </Text>
              </View>
            </View>
          </Link>
        </View>
      </Row>
    </View>
  )
}
