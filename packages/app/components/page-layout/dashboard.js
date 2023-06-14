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
  if (!currentUser) return <></>

  return (
    <View className="w-full p-3 max-w-screen-2xl mx-auto flex-col xl:flex-row ">
        <View className=" w-full xl:w-1/4 p-1 xl:pr-3">
          <Link href={currentUser.url}>
            <View  className="w-full p-4 flex-col xl:flex-col xl:gap-4 duration-200 rounded-lg  group
                                bg-backgroundcard dark:bg-backgroundcard-dark active:bg-backgroundcard-active dark:active:bg-backgroundcard-darkactive 
                                hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
                                hover:shadow-sm active:shadow-none 
                                active:translate-y-0.5 border
                                border-bordercolorcard dark:border-bordercolorcard-dark 
                                sm:hover:border-bordercolorcard-hover sm:dark:hover:border-bordercolorcard-darkhover 
                                active:border-bordercolorcard-active dark:active:border-bordercolorcard-darkactive
                                overflow-hidden"
            >
              <View className="flex-auto flex-row my-auto items-center">
                
              <View className=" my-auto p-0.5 mr-3">
                <Profile
                  {...currentUser}
                  displayType="unit_wo_info"
                  displaySize="lg"
                />
              </View>
              <Text className="my-auto flex-auto  text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-neutral-50 text-xl font-semibold ">
                  {currentUser.display_name}
                </Text>
                <View className="flex-row gap-1 my-auto xl:hidden">
                <Button
                    variant="text"
                    startDecorator="UserSwitch"
                    rounded
                  />
                   <Button
                    variant="text"
                    startDecorator="Gear"
                    rounded
                  />
                  <Button
                    variant="text"
                    startDecorator="SignOut"
                    rounded
                  />
                </View>
              </View>


              <View className="flex-auto flex-col my-auto hidden xl:flex ">
                
                <View className="flex-col ">
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
        <View className=" w-1/2 lg:w-1/3  p-1 ">
          <Link
            href={currentUser.url.replace(
              'view-persons-profile',
              'persons-profile-friends'
            )}
          >
            <View
              className="w-full p-3 sm:p-1 flex-col sm:flex-row lg:gap-2
                    
                    duration-200 rounded-lg  group
            bg-backgroundcard dark:bg-backgroundcard-dark active:bg-backgroundcard-active dark:active:bg-backgroundcard-darkactive 
            hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
            hover:shadow-sm active:shadow-none 
            active:translate-y-0.5 border
            border-bordercolorcard dark:border-bordercolorcard-dark 
            sm:hover:border-bordercolorcard-hover sm:dark:hover:border-bordercolorcard-darkhover 
            active:border-bordercolorcard-active dark:active:border-bordercolorcard-darkactive
                    
                    
                    overflow-hidden
                    
                    
                    "
            >
              <View className="flex-col my-auto mr-auto bg-backgrounditem dark:bg-backgrounditem-dark  p-2 rounded-md">
                <Icon icon="Users" width={32} height={32} />
              </View>

              <View className="flex-auto flex-col my-auto ">
                <Text className="pt-2 sm:py-2 sm:pl-2 my-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-neutral-50 text-lg font-semibold ">
                  Friends
                </Text>
              </View>
            </View>
          </Link>
        </View>

        <View className=" w-1/2 lg:w-1/3  p-1 ">
          <Link
            href={currentUser.url.replace(
              'view-persons-profile',
              'persons-profile-subscriptions'
            )}
          >
            <View
              className="w-full p-3 sm:p-1 flex-col sm:flex-row lg:gap-2
                    
                    duration-200 rounded-lg  group
            bg-backgroundcard dark:bg-backgroundcard-dark active:bg-backgroundcard-active dark:active:bg-backgroundcard-darkactive 
            hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
            hover:shadow-sm active:shadow-none 
            active:translate-y-0.5 border
            border-bordercolorcard dark:border-bordercolorcard-dark 
            sm:hover:border-bordercolorcard-hover sm:dark:hover:border-bordercolorcard-darkhover 
            active:border-bordercolorcard-active dark:active:border-bordercolorcard-darkactive
                    
                    
                    overflow-hidden
                    
                    
                    "
            >
              <View className="flex-col my-auto mr-auto bg-backgrounditem dark:bg-backgrounditem-dark  p-2 rounded-md">
                <Icon icon="UsersFour" width={32} height={32} />
              </View>

              <View className="flex-auto flex-col my-auto ">
              <Text className="pt-2 sm:py-2 sm:pl-2 my-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-neutral-50 text-lg font-semibold ">
                  Followers
                </Text>
              </View>
            </View>
          </Link>
        </View>

        <View className=" w-1/2 lg:w-1/3  p-1 ">
          <Link
            href={currentUser.url.replace(
              'view-persons-profile',
              'persons-profile-subscriptions'
            )}
          >
            <View
              className="w-full p-3 sm:p-1 flex-col sm:flex-row lg:gap-2
                    
                    duration-200 rounded-lg  group
            bg-backgroundcard dark:bg-backgroundcard-dark active:bg-backgroundcard-active dark:active:bg-backgroundcard-darkactive 
            hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
            hover:shadow-sm active:shadow-none 
            active:translate-y-0.5 border
            border-bordercolorcard dark:border-bordercolorcard-dark 
            sm:hover:border-bordercolorcard-hover sm:dark:hover:border-bordercolorcard-darkhover 
            active:border-bordercolorcard-active dark:active:border-bordercolorcard-darkactive
                    
                    
                    overflow-hidden
                    
                    
                    "
            >
              <View className="flex-col my-auto mr-auto bg-backgrounditem dark:bg-backgrounditem-dark  p-2 rounded-md">
                <Icon icon="UsersFour" width={32} height={32} />
              </View>

              <View className="flex-auto flex-col my-auto ">
              <Text className="pt-2 sm:py-2 sm:pl-2 my-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-neutral-50 text-lg font-semibold ">
                  Following
                </Text>
              </View>
            </View>
          </Link>
        </View>

        <View className=" w-1/2 lg:w-1/3 hidden p-1 ">
          <View
              className="w-full p-3 sm:p-1 flex-col sm:flex-row lg:gap-2
                    
                    duration-200 rounded-lg  group
            bg-backgroundcard dark:bg-backgroundcard-dark active:bg-backgroundcard-active dark:active:bg-backgroundcard-darkactive 
            hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
            hover:shadow-sm active:shadow-none 
            active:translate-y-0.5 border
            border-bordercolorcard dark:border-bordercolorcard-dark 
            sm:hover:border-bordercolorcard-hover sm:dark:hover:border-bordercolorcard-darkhover 
            active:border-bordercolorcard-active dark:active:border-bordercolorcard-darkactive
                    
                    
                    overflow-hidden
                    
                    
                    "
          >
            <View className="flex-col mr-auto my-auto bg-backgrounditem dark:bg-backgrounditem-dark  p-2 rounded-md">
              <Icon icon="Files" width={32} height={32} />
            </View>

            <View className="flex-col my-auto flex-auto">
            <Text className="pt-2 sm:py-2 sm:pl-2 my-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-neutral-50 text-lg font-semibold ">
                Posts
              </Text>
            </View>
          </View>
        </View>

        <View className=" w-1/2 lg:w-1/3  p-1 hidden">
          <View
              className="w-full p-3 sm:p-1 flex-col sm:flex-row lg:gap-2
                    
                    duration-200 rounded-lg  group
            bg-backgroundcard dark:bg-backgroundcard-dark active:bg-backgroundcard-active dark:active:bg-backgroundcard-darkactive 
            hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
            hover:shadow-sm active:shadow-none 
            active:translate-y-0.5 border
            border-bordercolorcard dark:border-bordercolorcard-dark 
            sm:hover:border-bordercolorcard-hover sm:dark:hover:border-bordercolorcard-darkhover 
            active:border-bordercolorcard-active dark:active:border-bordercolorcard-darkactive
                    
                    
                    overflow-hidden
                    
                    
                    "
          >
            <View className="flex-col my-auto mr-auto bg-backgrounditem dark:bg-backgrounditem-dark  p-2 rounded-md">
              <Icon icon="ChatsCircle" width={32} height={32} />
            </View>

            <View className="flex-col my-auto flex-auto">
              <Text className="my-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-neutral-50 text-lg font-semibold ">
                Discussions
              </Text>
            </View>
          </View>
        </View>

        <View className=" w-1/2 lg:w-1/3  p-1 hidden">
          <View
              className="w-full p-3 sm:p-1 flex-col sm:flex-row lg:gap-2
                    
                    duration-200 rounded-lg  group
            bg-backgroundcard dark:bg-backgroundcard-dark active:bg-backgroundcard-active dark:active:bg-backgroundcard-darkactive 
            hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
            hover:shadow-sm active:shadow-none 
            active:translate-y-0.5 border
            border-bordercolorcard dark:border-bordercolorcard-dark 
            sm:hover:border-bordercolorcard-hover sm:dark:hover:border-bordercolorcard-darkhover 
            active:border-bordercolorcard-active dark:active:border-bordercolorcard-darkactive
                    
                    
                    overflow-hidden
                    
                    
                    "
          >
            <View className="flex-col my-auto mr-auto bg-backgrounditem dark:bg-backgrounditem-dark  p-2 rounded-md">
              <Icon icon="UsersThree" width={32} height={32} />
            </View>

            <View className="flex-col my-auto flex-auto">
            <Text className="pt-2 sm:py-2 sm:pl-2 my-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-neutral-50 text-lg font-semibold ">
                Groups
              </Text>
            </View>
          </View>
        </View>

        <View className=" w-1/2 lg:w-1/3  p-1 hidden">
          <View
              className="w-full p-3 sm:p-1 flex-col sm:flex-row lg:gap-2
                    
                    duration-200 rounded-lg  group
            bg-backgroundcard dark:bg-backgroundcard-dark active:bg-backgroundcard-active dark:active:bg-backgroundcard-darkactive 
            hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
            hover:shadow-sm active:shadow-none 
            active:translate-y-0.5 border
            border-bordercolorcard dark:border-bordercolorcard-dark 
            sm:hover:border-bordercolorcard-hover sm:dark:hover:border-bordercolorcard-darkhover 
            active:border-bordercolorcard-active dark:active:border-bordercolorcard-darkactive
                    
                    
                    overflow-hidden
                    
                    
                    "
          >
            <View className="flex-col my-auto mr-auto bg-backgrounditem dark:bg-backgrounditem-dark  p-2 rounded-md">
              <Icon icon="CalendarCheck" width={32} height={32} />
            </View>

            <View className="flex-col my-auto flex-auto">
              <Text className="my-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-neutral-50 text-lg font-semibold ">
                Events
              </Text>
            </View>
          </View>
        </View>

        <View className=" w-1/2 lg:w-1/3  p-1 hidden">
          <View
              className="w-full p-3 sm:p-1 flex-col sm:flex-row lg:gap-2
            
            duration-200 rounded-lg  group
            bg-backgroundcard dark:bg-backgroundcard-dark active:bg-backgroundcard-active dark:active:bg-backgroundcard-darkactive 
            hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
            hover:shadow-sm active:shadow-none 
            active:translate-y-0.5 border
            border-bordercolorcard dark:border-bordercolorcard-dark 
            sm:hover:border-bordercolorcard-hover sm:dark:hover:border-bordercolorcard-darkhover 
            active:border-bordercolorcard-active dark:active:border-bordercolorcard-darkactive
            
            
            overflow-hidden
            
            
            "
          >
            <View className="flex-col my-auto mr-auto bg-backgrounditem dark:bg-backgrounditem-dark  p-2 rounded-md">
              <Icon icon="Bookmarks" width={32} height={32} />
            </View>

            <View className="flex-col my-auto flex-auto">
            <Text className="pt-2 sm:py-2 sm:pl-2 my-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-neutral-50 text-lg font-semibold ">
                Bookmarks
              </Text>
            </View>
          </View>
        </View>

        <View className=" w-1/2 lg:w-1/3  p-1 ">
          <Link href="account-settings-email">
            <View
              className="w-full p-3 sm:p-1 flex-col sm:flex-row lg:gap-2
                    
                    duration-200 rounded-lg  group
                    bg-backgroundcard dark:bg-backgroundcard-dark active:bg-backgroundcard-active dark:active:bg-backgroundcard-darkactive 
                    hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
                    hover:shadow-sm active:shadow-none 
                    active:translate-y-0.5 border
                    border-bordercolorcard dark:border-bordercolorcard-dark 
                    sm:hover:border-bordercolorcard-hover sm:dark:hover:border-bordercolorcard-darkhover 
                    active:border-bordercolorcard-active dark:active:border-bordercolorcard-darkactive
                    
                    
                    overflow-hidden
                    
                    
                    "
            >
              <View className="flex-col my-auto mr-auto bg-backgrounditem dark:bg-backgrounditem-dark  p-2 rounded-md">
                <Icon icon="Gear" width={32} height={32} />
              </View>

              <View className="flex-col my-auto flex-auto">
              <Text className="pt-2 sm:py-2 sm:pl-2 my-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-neutral-50 text-lg font-semibold ">
                  Settings
                </Text>
              </View>
            </View>
          </Link>
        </View>

        <View className=" w-1/2 lg:w-1/3  p-1 ">
          <Link href="logout">
            <View
              className="w-full p-3 sm:p-1 flex-col sm:flex-row lg:gap-2

              duration-200 rounded-lg  group
              bg-backgroundcard dark:bg-backgroundcard-dark active:bg-backgroundcard-active dark:active:bg-backgroundcard-darkactive 
              hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
              hover:shadow-sm active:shadow-none 
              active:translate-y-0.5 border
              border-bordercolorcard dark:border-bordercolorcard-dark 
              sm:hover:border-bordercolorcard-hover sm:dark:hover:border-bordercolorcard-darkhover 
              active:border-bordercolorcard-active dark:active:border-bordercolorcard-darkactive
              
              
              overflow-hidden
              

            "
            >
              <View className="flex-col my-auto mr-auto bg-backgrounditem dark:bg-backgrounditem-dark  p-2 rounded-md">
                <Icon icon="SignOut" width={32} height={32} />
              </View>

              <View className="flex-col my-auto flex-auto">
                
              <Text className="pt-2 sm:py-2 sm:pl-2 my-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-neutral-50 text-lg font-semibold ">
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
