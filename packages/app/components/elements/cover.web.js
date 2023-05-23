import { View, Row } from 'app/design/view';
import Image from '../../ui/atoms/image';
import { Text } from 'app/design/typography';
import { stripTags } from '../../lib/util';
import { Button } from 'app/design/controls';
import { appSetting } from 'app/lib/util'
import Profile from 'app/ui/molecules/profile';
import Menu from 'app/components/menu';
import { useWindowDimensions } from 'react-native'


function CoverMenu(props) {
    return (
        <View className='w-full'>
            <View className='w-full justify-start align-end flex-row gap-2'>
                <Menu {...props} displayType="button" params={{button_variant: 'default', button_rounded: false}} />
            </View>
        </View>
    );
}


export function CoverSmall(props) {
    const data = props.data;
    return (
        <View className=' backdrop-blur bg-backgroundtabbar dark:bg-backgroundtabbar-dark  w-full ' >
        <View className={appSetting('layout', 'max_width') + ' mx-auto w-full'}>
            
                <View className=' mx-4 py-2    flex-row gap-2'>
                    <Row className=' items-center  flex-auto'>
                        <Profile {...data.profile} displayType="unit_wo_info" displaySize="base" />
                        <View className='flex-row items-center ml-3'>
                        
                            <Text className="text-lg xl:text-xl font-bold tracking-tight  text-gray-900 dark:text-gray-50">{data.profile.display_name}</Text>

                            <Button  size="sm" rounded startDecorator="SealCheck"  variant="link" fullWidth />

                                    
                        </View>
                    </Row>
                    <View className=' w-auto  my-auto '>
                        <CoverMenu {...data.actions_menu} />
                    </View>
                </View>
            </View>
        </View>
    )
}

export default function ElementCover(props) {

    
    //TODO: implements menus
    const data = props.data;
    let sType = 'lg:rounded'

    let { width } = useWindowDimensions()

    if (props.data.profile.module == "bx_persons")
        sType = 'rounded-full';
    
    return (
      <View className=' backdrop-blur  bg-backgroundnavbar dark:bg-backgroundnavbar-dark ' >
            <View className={appSetting('layout', 'max_width') + '  mx-auto w-full'}>
                <View  className=' duration-500 bg-primary-200 dark:bg-primary-950  -mx-4 w-auto pt-[20%]  xl:rounded-b-lg overflow-hidden'>
                        { !!data.cover && <Image alt={data.group_name} view="cover" sizes="(max-width:1280px) 100vw, 1280px" className="u-cover " src={data.cover.src} />  }
                </View>
                
                <View className='w-auto flex-col-reverse lg:flex-row px-4 py-3 relative gap-4   border-bordercolor dark:border-bordercolor-dark '>
                    <View className={sType + " p-1 -top-16 lg:-top-24 left-3 -translate-y-1  absolute  mr-auto flex-none bg-backgroundcard dark:bg-backgroundcard-dark "} >
                        <Profile {...data.profile} displayType="unit_wo_info" displaySize={width >= 1024? "4xl" : "3xl"} />
                    </View>
                    
                    <View className='flex-col   gap-3 items-start  lg:ml-52'>
                                    <Row className='flex-row mt-1 lg:mt-0  items-center'>
                                    <Text className="ml-1 tracking-tight truncate text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-50">{data.profile.display_name}</Text>

                                    <Button  size="sm" rounded startDecorator="SealCheck"  variant="link" fullWidth />

                                    </Row>
                                    
                                    <View className='flex-row  gap-1  text-center flex-wrap'>
                                        <Button title="245 followers" size="sm" rounded startDecorator="Users"  variant="outline" fullWidth />
                                        <Button title="Administrator" size="sm" rounded startDecorator="UserCircle"  variant="text" fullWidth />
                                        <Button title="Joined Dec 2021" size="sm" rounded startDecorator="Clock"  variant="text" fullWidth />
                                   </View>
                                    <Text numberOfLines={2} className=' lg:hidden text-base text-gray-800 dark:text-gray-200 '>{stripTags(data.profile.info.description)}</Text>

                                    
                    </View>
                        
                        
                        
                   
                    <View className='items-start  ml-auto w-auto flex-row '>
                        <CoverMenu  {...data.actions_menu} />
                    </View>
                </View>
                
            </View>
            
        </View>
    );
}