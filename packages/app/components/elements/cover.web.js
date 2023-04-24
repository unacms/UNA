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

  


function CoverMenu(){
    return (
        <View className=' w-full lg:w-auto  mt-2 lg:mt-0'>
            <View className=' w-full justify-end align-end  flex-row  space-x-2'>
                <Button title="Follow" variant="primary" fullWidth />
                <Button title="Message" variant="default" fullWidth/>
            </View>
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
            if (window.scrollY > 300 && !isSmall){
                setIsSmall(true);
            }
            if (window.scrollY < 10 && isSmall){
                setIsSmall(false);
            }
        });
    }
    
    return (
        isSmall ? 
        <View className='bg-neocard dark:bg-neocard-dark fixed top:64 z-50 w-full border-b border-neoborder dark:border-neoborder-dark' >
        <View className={appSetting('layout', 'max_width') + ' mx-auto w-full'}>
            <View className='w-full relative  '>
                <View className=' p-2 flex-col  justify-between lg:flex-row'>
                    <Row className='items-center'>
                        <Profile {...data.profile} displayType="unit_wo_info" displaySize="lg" />
                        <View className='flex-col gap-2 w-full lg:w-auto ml-4'>
                            <H1C className="font-bold tracking-tight  text-gray-900 dark:text-gray-50">{data.profile.display_name}</H1C>
                        </View>
                    </Row>
                    <View className=' w-full lg:w-auto  mt-2 lg:mt-0'>
                        <CoverMenu/>
                    </View>
                </View>
            </View>
        </View>
    </View>
        : <View className='bg-neocard dark:bg-neocard-dark ' >
            <View className={appSetting('layout', 'max_width') + ' mx-auto w-full'}>
                <View className=''>
                    <View  className='bg-cover bg-primary dark:bg-primary-dark w-full pt-[34%]  lg:rounded-b-lg overflow-hidden'>
                        { !!data.cover && <Image alt={data.group_name} view="cover" className="u-cover lg:rounded-b-2xl" src={data.cover.src} />  }
                    </View>
                </View>
                <View className='w-full relative  '>
                        <View className={sType + " absolute left-0  -top-16 lg:-top-24 left-4 h-32 w-32 lg:h-48 lg:w-48 overflow-hidden border--2 border-neocard dark:border-neocard-dark "} >
                        <Profile {...data.profile} displayType="unit_wo_info" displaySize={width >= 1024? "4xl" : "3xl"} />
                </View>
                    
                    <View className='  lg:p-4 flex-col-reverse  lg:pl-56 lg:pb-8  justify-between lg:flex-row  '>
                    <View className='flex-col lg:gap-2 w-full lg:w-auto ml-4 lg:ml-0'>
                                <H1C className="font-bold tracking-tight  text-gray-900 dark:text-gray-50">{data.profile.display_name}</H1C>
                                    <Row className='flex-row space-x-1'>
                                        <Text className="font-bold tracking-tight  text-gray-800 dark:text-gray-200">@johndoe</Text>
                                        <Text className="text-gray-400 dark:text-gray-60">·</Text>
                                        <Text className=" tracking-tight  text-gray-800 dark:text-gray-200">256 Followers</Text>
                                    </Row>
                                    <Text className='lg:hidden text-gray-800 dark:text-gray-200 mt-2'>{stripTags(data.profile.info.description)}</Text>
                        </View>
                        <View className='mx-4 lg:mx-0 mb-4  w-auto  ml-40 lg:ml-0'>
                            <CoverMenu/>
                        </View>
                        
                        
                    </View>
                </View>
            </View>
        </View>
    );
}
