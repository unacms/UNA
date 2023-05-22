
import { View } from 'app/design/view';
import {BlockByName} from 'app/components/block';
import { Text } from 'app/design/typography'
import { Button, ButtonsGroup } from 'app/design/controls';
import Link from 'app/ui/atoms/link';

export default function PageLayout(props) {
    return (<View className="w-full sm:p-5 max-w-5xl mx-auto ">
        <View className='flex-col gap-4 py-4 px-8'>
            <View className='flex-row w-full  justify-between items-center'>
                    <View className='w-1/2   px-2  font-semibold text-neutral-800 dark:text-neutral-200'>
                        
                        
                        <Button title="Friends" align="start" size='xl' fullWidth  startDecorator="Users" iconend />
                        
                    </View>
                    <View className='w-1/2   px-2  font-semibold text-neutral-800 dark:text-neutral-200'>
                    <Button title="Groups" align="start" size='xl' fullWidth  startDecorator="Users" iconend />
                        


                    </View>
            </View>

            <View className='flex-row w-full  justify-between items-center'>
                    <View className='w-1/2   px-2  font-semibold text-neutral-800 dark:text-neutral-200'>
                        
                        
                        <Button title="Posts" align="start" size='xl' fullWidth  startDecorator="Users" iconend />
                        
                    </View>
                    <View className='w-1/2   px-2  font-semibold text-neutral-800 dark:text-neutral-200'>
                    <Button title="People" align="start" size='xl' fullWidth  startDecorator="Users" iconend />
                        


                    </View>
            </View>
            <View className='flex-row w-full  justify-between items-center'>
                    <View className='w-1/2   px-2  font-semibold text-neutral-800 dark:text-neutral-200'>
                        
                        
                        <Button title="Events" align="start" size='xl' fullWidth  startDecorator="Users" iconend />
                        
                    </View>
                    <View className='w-1/2   px-2  font-semibold text-neutral-800 dark:text-neutral-200'>
                    <Button title="Discussions" align="start" size='xl' fullWidth  startDecorator="Users" iconend />
                        


                    </View>
            </View>
            <View className=' w-full  '>
                    <View className='w-full   px-2  font-semibold text-neutral-800 dark:text-neutral-200'>
                        
                    <Link href="/logout" ><Button title="Logout" size='lg' fullWidth variant ='outline' /></Link>

                        
                    </View>
              
            </View>



        </View>
    </View>)
}
