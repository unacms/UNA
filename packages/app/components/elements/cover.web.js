import { View, Row } from 'app/design/view';
import Image from '../../ui/atoms/image';
import { Text, H1C } from 'app/design/typography';
import { stripTags } from '../../lib/util';
import { Button } from 'app/design/controls';
import { appSetting } from 'app/lib/util'
import Profile from 'app/ui/molecules/profile';
import { useRef, useState } from 'react';
import { Platform } from 'react-native'
import { useWindowDimensions } from 'react-native'
import { Transition } from '@headlessui/react'

  


function CoverMenu(){
    return (
        
            <View className=' mx-auto flex-row  gap-2'>
                <Button title="Follow" variant="primary" fullWidth />
                <Button title="Message" variant="default" fullWidth/>
            </View>
        
    );
}

export default function ElementCover(props) {

    const [isSmall, setIsSmall] = useState(false);

    //TODO: implements menus
    const data = props.data;
    let sType = 'lg:rounded'

    let { width } = useWindowDimensions()

    if (props.data.profile.module == "bx_persons")
        sType = 'rounded-full';

    if(Platform.OS == 'web') {
        document.addEventListener("scroll", (event) => {
            if (window.scrollY > 540 && !isSmall){
                setIsSmall(true);
            }
            if (window.scrollY < 10 && isSmall){
                setIsSmall(false);
            }
        });
    }
    
    return (
        isSmall ? 
        <View className='  bg-neocard dark:bg-neocard-dark fixed top:64 z-50 w-full border-b border-neoborder dark:border-neoborder-dark' >
        <View className={appSetting('layout', 'max_width') + '  mx-auto w-full'}>
            
                <View className=' px-4 py-2   flex-row gap-2'>
                    <Row className=' items-center flex-auto'>
                        <Profile {...data.profile} displayType="unit_wo_info" displaySize="lg" />
                        <View className='flex-row items-center ml-3'>
                        
                            <Text className="text-2xl font-bold tracking-tight  text-gray-900 dark:text-gray-50">{data.profile.display_name}</Text>

                            <Button  size="sm" rounded startDecorator="SealCheck"  variant="link" fullWidth />

                                    
                        </View>
                    </Row>
                    <View className=' w-auto  my-auto '>
                        <CoverMenu/>
                    </View>
                </View>
            
        </View>
    </View>
        : <View className='bg-neocard dark:bg-neocard-dark ' >
            <View className={appSetting('layout', 'max_width') + '  mx-auto w-full'}>
                
                <View  className=' duration-500 bg-primary-200 dark:bg-primary-950  -mx-4 w-auto pt-[34%]  xl:rounded-b-lg overflow-hidden'>
                        { !!data.cover && <Image alt={data.group_name} view="cover" className="u-cover " src={data.cover.src} />  }
                </View>
                
                <View className='w-auto lg:flex-row mx-4 py-1 relative gap-4 items-center  border-b  border-bordercolor dark:border-bordercolor-dark'>
                    <View className={sType + " p-1 -mt-16 sm:-mt-24 flex-none bg-backgroundcard dark:bg-backgroundcard-dark "} >
                        <Profile {...data.profile} displayType="unit_wo_info" displaySize={width >= 640? "4xl" : "3xl"} />
                    </View>
                    
                    <View className=' flex-col w-full  lg:flex-row justify-between gap-4 flex-auto '>
                        <View className='flex-col gap-2 items-center lg:items-start  lg:ml-0'>
                                    <Row>
                                    <Text className=" tracking-tight truncate text-4xl font-bold text-gray-900 dark:text-gray-50">{data.profile.display_name}</Text>

                                    <Button  size="base" rounded startDecorator="SealCheck"  variant="link" fullWidth />

                                    </Row>
                                    
                                    <View className='flex-row  gap-1 -mx-2 text-center'>

                                        <Button title="Administrator" size="sm" rounded startDecorator="UserCircle"  variant="text" fullWidth />
                                        <Button title="Joined Dec 2021" size="sm" rounded startDecorator="Clock"  variant="text" fullWidth />

                                        <Button title="245 followers" size="sm" rounded startDecorator="Users"  variant="text" fullWidth />
                                        
                                    </View>
                                    <Text className='lg:hidden   text-base text-gray-800 dark:text-gray-200  text-center'>{stripTags(data.profile.info.description)}</Text>

                                    
                        </View>
                        
                        
                        
                    </View>
                    <View className='items-start w-auto flex-row pb-4 '>
                            <CoverMenu/>
                    </View>
                </View>
            </View>
            
        </View>
    );
}