
import { View } from 'app/design/view';
import {BlockByName} from 'app/components/block';
import { Text } from 'app/design/typography'
import { Button, ButtonsGroup } from 'app/design/controls';
import Link from 'app/ui/atoms/link';
import { Row } from 'app/design/view';
import { Pressable } from 'dripsy';
import { Icon } from 'app/ui/atoms/icon'; 


export default function PageLayout(props) {
    return (<View className="w-full p-3 max-w-5xl mx-auto ">
        
        <Row className='flex-wrap  '>
            <View className=' w-1/2 lg:w-1/3  p-1 '>
   
                    <View  className='w-full p-4 flex-col sm:flex-row gap-4
                    
                    duration-200 rounded-lg  group
            bg-backgroundcard dark:bg-backgroundcard-dark active:bg-backgroundcard-active dark:active:bg-backgroundcard-darkactive 
            hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
            hover:shadow-sm active:shadow-none 
            active:translate-y-0.5 border
            border-bordercolorcard dark:border-bordercolorcard-dark 
            sm:hover:border-bordercolorcard-hover sm:dark:hover:border-bordercolorcard-darkhover 
            active:border-bordercolorcard-active dark:active:border-bordercolorcard-darkactive
                    
                    
                    overflow-hidden
                    
                    
                    '>
                        
                        
                        <View className='flex-col my-auto mr-auto bg-backgrounditem dark:bg-backgrounditem-dark  p-2 rounded-md'>
                        <Icon icon="Users" width={32} height={32}  />
                        </View>
                        
                        <View className='flex-auto flex-col my-auto '>
                        <Text className='my-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-neutral-50 text-lg font-semibold '>Connections</Text>
                        <Row className='my-auto gap-1'>
                        <Text className='my-auto  text-neutral-600 group-hover:text-neutral-800 dark:text-neutral-400 group-hover:dark:text-neutral-200 text-sm font-normal  '>23 Friends</Text>
                        <Text className='my-auto text-neutral-500  text-sm  '>·</Text>
                        <Text className='my-auto  text-neutral-600 group-hover:text-neutral-800 dark:text-neutral-400 group-hover:dark:text-neutral-200 text-sm font-normal  '>908 Followers</Text>

                        </Row>
                        </View>
                    </View>
            </View>

            <View className=' w-1/2 lg:w-1/3  p-1 '>
   
                    <View  className='w-full p-4 flex-col sm:flex-row gap-4
                    
                    duration-200 rounded-lg  group
            bg-backgroundcard dark:bg-backgroundcard-dark active:bg-backgroundcard-active dark:active:bg-backgroundcard-darkactive 
            hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
            hover:shadow-sm active:shadow-none 
            active:translate-y-0.5 border
            border-bordercolorcard dark:border-bordercolorcard-dark 
            sm:hover:border-bordercolorcard-hover sm:dark:hover:border-bordercolorcard-darkhover 
            active:border-bordercolorcard-active dark:active:border-bordercolorcard-darkactive
                    
                    
                    overflow-hidden
                    
                    
                    '>
                        
                        
                        <View className='flex-col mr-auto my-auto bg-backgrounditem dark:bg-backgrounditem-dark  p-2 rounded-md'>
                        <Icon icon="Files" width={32} height={32}  />
                        </View>
                        
                        <View className='flex-col my-auto flex-auto'>
                        <Text className='my-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-neutral-50 text-lg font-semibold '>Posts</Text>
                        <Row className='my-auto gap-1'>
                        <Text className='my-auto  text-neutral-600 group-hover:text-neutral-800 dark:text-neutral-400 group-hover:dark:text-neutral-200 text-sm font-normal  '>8 published</Text>
                        <Text className='my-auto text-neutral-500  text-sm  '>·</Text>
                        <Text className='my-auto  text-neutral-600 group-hover:text-neutral-800 dark:text-neutral-400 group-hover:dark:text-neutral-200 text-sm font-normal  '>2 drafts</Text>

                        </Row>
                        </View>
                    </View>
            </View>

            <View className=' w-1/2 lg:w-1/3  p-1 '>
   
                    <View  className='w-full p-4 flex-col sm:flex-row gap-4
                    
                    duration-200 rounded-lg  group
            bg-backgroundcard dark:bg-backgroundcard-dark active:bg-backgroundcard-active dark:active:bg-backgroundcard-darkactive 
            hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
            hover:shadow-sm active:shadow-none 
            active:translate-y-0.5 border
            border-bordercolorcard dark:border-bordercolorcard-dark 
            sm:hover:border-bordercolorcard-hover sm:dark:hover:border-bordercolorcard-darkhover 
            active:border-bordercolorcard-active dark:active:border-bordercolorcard-darkactive
                    
                    
                    overflow-hidden
                    
                    
                    '>
                        
                        
                        <View className='flex-col my-auto mr-auto bg-backgrounditem dark:bg-backgrounditem-dark  p-2 rounded-md'>
                        <Icon icon="ChatsCircle" width={32} height={32}  />
                        </View>
                        
                        <View className='flex-col my-auto flex-auto'>
                        <Text className='my-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-neutral-50 text-lg font-semibold '>Discussions</Text>
                        <Row className='my-auto gap-1'>
                        <Text className='my-auto  text-neutral-600 group-hover:text-neutral-800 dark:text-neutral-400 group-hover:dark:text-neutral-200 text-sm font-normal  '>23 published</Text>


                        </Row>
                        </View>
                    </View>
            </View>


            <View className=' w-1/2 lg:w-1/3  p-1 '>
   
                    <View  className='w-full p-4 flex-col sm:flex-row gap-4
                    
                    duration-200 rounded-lg  group
            bg-backgroundcard dark:bg-backgroundcard-dark active:bg-backgroundcard-active dark:active:bg-backgroundcard-darkactive 
            hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
            hover:shadow-sm active:shadow-none 
            active:translate-y-0.5 border
            border-bordercolorcard dark:border-bordercolorcard-dark 
            sm:hover:border-bordercolorcard-hover sm:dark:hover:border-bordercolorcard-darkhover 
            active:border-bordercolorcard-active dark:active:border-bordercolorcard-darkactive
                    
                    
                    overflow-hidden
                    
                    
                    '>
                        
                        
                        <View className='flex-col my-auto mr-auto bg-backgrounditem dark:bg-backgrounditem-dark  p-2 rounded-md'>
                        <Icon icon="UsersThree" width={32} height={32}  />
                        </View>
                        
                        <View className='flex-col my-auto flex-auto'>
                        <Text className='my-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-neutral-50 text-lg font-semibold '>Groups</Text>
                        <Row className='my-auto gap-1'>
                        <Text className='my-auto  text-neutral-600 group-hover:text-neutral-800 dark:text-neutral-400 group-hover:dark:text-neutral-200 text-sm font-normal  '>2 created</Text>
                        <Text className='my-auto text-neutral-500  text-sm  '>·</Text>
                        <Text className='my-auto  text-neutral-600 group-hover:text-neutral-800 dark:text-neutral-400 group-hover:dark:text-neutral-200 text-sm font-normal  '>2 joined</Text>

                        </Row>
                        </View>
                    </View>
            </View>

            <View className=' w-1/2 lg:w-1/3  p-1 '>
   
                    <View  className='w-full p-4 flex-col sm:flex-row gap-4
                    
                    duration-200 rounded-lg  group
            bg-backgroundcard dark:bg-backgroundcard-dark active:bg-backgroundcard-active dark:active:bg-backgroundcard-darkactive 
            hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
            hover:shadow-sm active:shadow-none 
            active:translate-y-0.5 border
            border-bordercolorcard dark:border-bordercolorcard-dark 
            sm:hover:border-bordercolorcard-hover sm:dark:hover:border-bordercolorcard-darkhover 
            active:border-bordercolorcard-active dark:active:border-bordercolorcard-darkactive
                    
                    
                    overflow-hidden
                    
                    
                    '>
                        
                        
                        <View className='flex-col my-auto mr-auto bg-backgrounditem dark:bg-backgrounditem-dark  p-2 rounded-md'>
                        <Icon icon="CalendarCheck" width={32} height={32}  />
                        </View>
                        
                        <View className='flex-col my-auto flex-auto'>
                        <Text className='my-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-neutral-50 text-lg font-semibold '>Events</Text>
                        <Row className='my-auto gap-1'>
                        <Text className='my-auto  text-neutral-600 group-hover:text-neutral-800 dark:text-neutral-400 group-hover:dark:text-neutral-200 text-sm font-normal  '>1 created</Text>
                        <Text className='my-auto text-neutral-500  text-sm  '>·</Text>
                        <Text className='my-auto  text-neutral-600 group-hover:text-neutral-800 dark:text-neutral-400 group-hover:dark:text-neutral-200 text-sm font-normal  '>123 attending</Text>

                        </Row>
                        </View>
                    </View>
            </View>

            <View className=' w-1/2 lg:w-1/3  p-1 '>
   
            <View  className='w-full p-4 flex-col sm:flex-row gap-4
            
            duration-200 rounded-lg  group
            bg-backgroundcard dark:bg-backgroundcard-dark active:bg-backgroundcard-active dark:active:bg-backgroundcard-darkactive 
            hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
            hover:shadow-sm active:shadow-none 
            active:translate-y-0.5 border
            border-bordercolorcard dark:border-bordercolorcard-dark 
            sm:hover:border-bordercolorcard-hover sm:dark:hover:border-bordercolorcard-darkhover 
            active:border-bordercolorcard-active dark:active:border-bordercolorcard-darkactive
            
            
            overflow-hidden
            
            
            '>
                
                
                <View className='flex-col my-auto mr-auto bg-backgrounditem dark:bg-backgrounditem-dark  p-2 rounded-md'>
                <Icon icon="Bookmarks" width={32} height={32}  />
                </View>
                
                <View className='flex-col my-auto flex-auto'>
                <Text className='my-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-neutral-50 text-lg font-semibold '>Bookmarks</Text>
                <Row className='my-auto gap-1'>
                <Text className='my-auto  text-neutral-600 group-hover:text-neutral-800 dark:text-neutral-400 group-hover:dark:text-neutral-200 text-sm font-normal  '>254 saved</Text>
                

                </Row>
                </View>
            </View>
            </View>

            <View className=' w-1/2 lg:w-1/3  p-1 '>
   
                    <View  className='w-full p-4 flex-col sm:flex-row gap-4
                    
                    duration-200 rounded-lg  group
                    bg-backgroundcard dark:bg-backgroundcard-dark active:bg-backgroundcard-active dark:active:bg-backgroundcard-darkactive 
                    hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
                    hover:shadow-sm active:shadow-none 
                    active:translate-y-0.5 border
                    border-bordercolorcard dark:border-bordercolorcard-dark 
                    sm:hover:border-bordercolorcard-hover sm:dark:hover:border-bordercolorcard-darkhover 
                    active:border-bordercolorcard-active dark:active:border-bordercolorcard-darkactive
                    
                    
                    overflow-hidden
                    
                    
                    '>
                        
                        
                        <View className='flex-col my-auto mr-auto bg-backgrounditem dark:bg-backgrounditem-dark  p-2 rounded-md'>
                        <Icon icon="Gear" width={32} height={32}  />
                        </View>
                        
                        <View className='flex-col my-auto flex-auto'>
                        <Text className='my-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-neutral-50 text-lg font-semibold '>Settings</Text>
                        
                        </View>
                    </View>
            </View>

            <View className=' w-1/2 lg:w-1/3  p-1 '>
            <Link href="/logout" className='bg-transparent' >
            <View  className='w-full p-4 flex-col sm:flex-row gap-4

            duration-200 rounded-lg  group
             active:bg-backgroundcard-active dark:active:bg-backgroundcard-darkactive 
            hover:bg-backgroundcard-hover dark:hover:bg-backgroundcard-darkhover
            hover:shadow-sm active:shadow-none 
            active:translate-y-0.5 border
            border-bordercolorcard dark:border-bordercolorcard-dark 
            sm:hover:border-bordercolorcard-hover sm:dark:hover:border-bordercolorcard-darkhover 
            active:border-bordercolorcard-active dark:active:border-bordercolorcard-darkactive


            overflow-hidden


            '>


            <View className='flex-col my-auto mr-auto bg-backgrounditem dark:bg-backgrounditem-dark  p-2 rounded-md'>
            <Icon icon="SignOut" width={32} height={32}  />
            </View>

            <View className='flex-col my-auto flex-auto'>
            <Text className='my-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-neutral-50 text-lg font-semibold '>Sign out</Text>
       
            </View>
            </View>
            </Link>
            </View>
       
            
                    
        </Row>






        
    </View>)
}
