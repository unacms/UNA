
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
        <View className=' w-full  p-1 '>
   
   <View  className='w-full p-4 flex-row gap-4
   
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
       
       
       <View className='flex-col my-auto mr-auto bg-backgrounditem dark:bg-backgrounditem-dark  p-2 rounded-full'>
       <Icon icon="User" width={32} height={32}  />
       </View>
       
       <View className='flex-auto flex-row my-auto '>
       <Text className='my-auto flex-auto  text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-neutral-50 text-lg font-semibold '>Andrey Yasko</Text>
       <Button variant="outline" startDecorator='UserSwitch' rounded  />

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
                        <Icon icon="Users" width={32} height={32}  />
                        </View>
                        
                        <View className='flex-auto flex-col my-auto '>
                        <Text className='my-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-neutral-50 text-lg font-semibold '>Friends</Text>
                       
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

            <View className='flex-col my-auto flex-auto'><Link href="/logout" >
            <Text className='my-auto text-neutral-800 group-hover:text-neutral-950 dark:text-neutral-200 group-hover:dark:text-neutral-50 text-lg font-semibold '>Sign out</Text>
                </Link>
            </View>
            </View>
           
            </View>
       
            
                    
        </Row>






        
    </View>)
}
