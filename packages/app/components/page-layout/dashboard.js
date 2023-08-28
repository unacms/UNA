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
      <View className=" w-full xl:w-1/4 p-2">
        <Link href={currentUser.url}>
          <View
            className="w-full p-3 flex-col xl:flex-col gap-x-1 duration-300 rounded-xl group
            border 
                        bg-backgroundcard dark:bg-backgroundcard-dark border-bordercolorcard dark:border-bordercolorcard-dark"
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
      <View className=" w-1/2 lg:w-1/3 p-2">
          <Link href="/friends">
            <View
              className="w-full p-4 flex-col gap-y-2 active:opacity-50 sm:hover:-translate-y-0.5 hover:shadow-xl  hover:border-transparent sm:hover:scale-105 duration-200  bg-backgroundcard dark:bg-backgroundcard-dark rounded-xl group border border-bordercolorcard dark:border-bordercolorcard-dark"
            >
              <Row className=''>
              <Text className=" text-3xl font-semibold flex-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white  ">
                1,290 
              </Text>
              <Row className='my-auto  text-green-800 bg-green-200 dark:bg-green-950 gap-x-1 py-1 px-2 rounded-full dark:text-green-200 '>
                <Icon className="text-green-600 dark:text-green-400" icon="ArrowFatUp" width={16} height={16} />
              <Text className=" flex-none text-green-800 dark:text-green-200 text-xs  ">
                55
              </Text>
              </Row>
             
              </Row>
              <Row className="w-full my-auto gap-x-2 ">
                <View className="flex-none text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white font-semibold ">
                  <Icon icon="Users" width={24} height={24} />
                </View>
                <Text className=" flex-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white font-semibold   my-auto ">
                  Friends
                </Text>
              </Row>
            </View>
          </Link>
        </View>

        <View className=" w-1/2 lg:w-1/3 p-2">
          <Link href="/followers">
            <View
              className="w-full p-4 flex-col gap-y-2 active:opacity-50 sm:hover:-translate-y-0.5 hover:shadow-xl  hover:border-transparent sm:hover:scale-105 duration-200  bg-backgroundcard dark:bg-backgroundcard-dark rounded-xl group border border-bordercolorcard dark:border-bordercolorcard-dark"
            >
              <Row className=''>
              <Text className=" text-3xl font-semibold flex-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white  ">
                67,5K 
              </Text>
              <Row className='my-auto  text-green-800 bg-green-200 dark:bg-green-950 gap-x-1 py-1 px-2 rounded-full dark:text-green-200 '>
              <Icon className="text-green-600 dark:text-green-400" icon="ArrowFatUp" width={16} height={16} />
              <Text className=" flex-none text-green-800 dark:text-green-200 text-xs  ">
                3.1K 
              </Text>
              </Row>
             
              </Row>
              <Row className="w-full my-auto gap-x-2 ">
                <View className="flex-none text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white font-semibold ">
                  <Icon icon="UsersFour" width={24} height={24} />
                </View>
                <Text className=" flex-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white font-semibold   my-auto ">
                  Followers
                </Text>
              </Row>
            </View>
          </Link>
        </View>
        <View className=" w-1/2 lg:w-1/3 p-2">
          <Link href="/posts-home">
            <View
              className="w-full p-4 flex-col gap-y-2 active:opacity-50 sm:hover:-translate-y-0.5 hover:shadow-xl  hover:border-transparent sm:hover:scale-105 duration-200  bg-backgroundcard dark:bg-backgroundcard-dark rounded-xl group border border-bordercolorcard dark:border-bordercolorcard-dark"
            >
              <Row className='space-x-1'>
              <Text className=" text-3xl font-semibold flex-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white  ">
                142
              </Text>
              <Row className='my-auto  text-green-800 bg-green-200 dark:bg-green-950 gap-x-1 py-1 px-2 rounded-full dark:text-green-200 '>
              <Icon className="text-green-600 dark:text-green-400" icon="ChartBar" width={16} height={16} />
              <Text className=" flex-none text-green-800 dark:text-green-200 text-xs">17.1M  
              </Text>
              </Row>
              <Row className='my-auto  text-green-800 bg-green-200 dark:bg-green-950 gap-x-1 py-1 px-2 rounded-full dark:text-green-200 '>
              <Icon className="text-green-600 dark:text-green-400" icon="ThumbsUp" width={16} height={16} />
              <Text className=" flex-none text-green-800 dark:text-green-200 text-xs  ">114,6K 
              </Text>
              </Row>
             
              </Row>
              <Row className="w-full my-auto gap-x-2 ">
                <View className="flex-none text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white font-semibold ">
                  <Icon icon="Files" width={24} height={24} />
                </View>
                <Text className=" flex-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white font-semibold   my-auto ">
                  Posts
                </Text>
              </Row>
            </View>
          </Link>
        </View>
        <View className=" w-1/2 lg:w-1/3 p-2">
          <Link href="/discussions-home">
            <View
              className="w-full p-4 flex-col gap-y-2 active:opacity-50 sm:hover:-translate-y-0.5 hover:shadow-xl  hover:border-transparent sm:hover:scale-105 duration-200  bg-backgroundcard dark:bg-backgroundcard-dark rounded-xl group border border-bordercolorcard dark:border-bordercolorcard-dark"
            >
              <Row className='space-x-1'>
              <Text className=" text-3xl font-semibold flex-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white  ">
                6
              </Text>
              <Row className='my-auto  text-green-800 bg-green-200 dark:bg-green-950 gap-x-1 py-1 px-2 rounded-full dark:text-green-200 '>
              <Icon className="text-green-600 dark:text-green-400" icon="ChartBar" width={16} height={16} />
              <Text className=" flex-none text-green-800 dark:text-green-200 text-xs  ">98  
              </Text>
              </Row>
              <Row className='my-auto  text-green-800 bg-green-200 dark:bg-green-950 gap-x-1 py-1 px-2 rounded-full dark:text-green-200 '>
              <Icon className="text-green-600 dark:text-green-400" icon="Smiley" width={16} height={16} />
              <Text className=" flex-none text-green-800 dark:text-green-200 text-xs  ">4 
              </Text>
              </Row>
             
              </Row>
              <Row className="w-full my-auto gap-x-2 ">
                <View className="flex-none text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white font-semibold ">
                  <Icon icon="ChatsCircle" width={24} height={24} />
                </View>
                <Text className=" flex-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white font-semibold   my-auto ">
                  Discussions
                </Text>
              </Row>
            </View>
          </Link>
        </View>
        <View className=" w-1/2 lg:w-1/3 p-2">
          <Link href="/groups-home">
            <View
              className="w-full p-4 flex-col gap-y-2 active:opacity-50 sm:hover:-translate-y-0.5 hover:shadow-xl  hover:border-transparent sm:hover:scale-105 duration-200  bg-backgroundcard dark:bg-backgroundcard-dark rounded-xl group border border-bordercolorcard dark:border-bordercolorcard-dark"
            >
              <Row className='space-x-1'>
              <Text className=" text-3xl font-semibold flex-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white  ">
                0
              </Text>
             
             
              </Row>
              <Row className="w-full my-auto gap-x-2 ">
                <View className="flex-none text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white font-semibold ">
                  <Icon icon="UsersThree" width={24} height={24} />
                </View>
                <Text className=" flex-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white font-semibold   my-auto ">
                  Groups
                </Text>
              </Row>
            </View>
          </Link>
        </View>
        <View className=" w-1/2 lg:w-1/3 p-2">
          <Link href="/events-home">
            <View
              className="w-full p-4 flex-col gap-y-2 active:opacity-50 sm:hover:-translate-y-0.5 hover:shadow-xl  hover:border-transparent sm:hover:scale-105 duration-200  bg-backgroundcard dark:bg-backgroundcard-dark rounded-xl group border border-bordercolorcard dark:border-bordercolorcard-dark"
            >
              <Row className='space-x-1'>
              <Text className=" text-3xl font-semibold flex-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white  ">
                2
              </Text>
              <Row className='my-auto  text-green-800 bg-green-200 dark:bg-green-950 gap-x-1 py-1 px-2 rounded-full dark:text-green-200 '>
              <Icon className="text-green-600 dark:text-green-400" icon="ChartBar" width={16} height={16} />
              <Text className=" flex-none text-green-800 dark:text-green-200 text-xs  ">9,876  
              </Text>
              </Row>
              <Row className='my-auto  text-green-800 bg-green-200 dark:bg-green-950 gap-x-1 py-1 px-2 rounded-full dark:text-green-200 '>
              <Icon className="text-green-600 dark:text-green-400" icon="User" width={16} height={16} />
              <Text className=" flex-none text-green-800 dark:text-green-200 text-xs  ">689
              </Text>
              </Row>
             
              </Row>
              <Row className="w-full my-auto gap-x-2 ">
                <View className="flex-none text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white font-semibold ">
                  <Icon icon="CalendarCheck" width={24} height={24} />
                </View>
                <Text className=" flex-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-white font-semibold   my-auto ">
                  Events
                </Text>
              </Row>
            </View>
          </Link>
        </View>
    


  



    



      </Row>
    </View>
  )
}
