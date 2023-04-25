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
               // setIsSmall(true);
            }
            if (window.scrollY < 10 && isSmall){
             //   setIsSmall(false);
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
                
                    <View  className='bg-cover bg-primary dark:bg-primary-dark w-full pt-[34%]  xl:rounded-b-lg overflow-hidden'>
                        { !!data.cover && <Image alt={data.group_name} view="cover" className="u-cover " src={data.cover.src} />  }
                    </View>
                
                <View className='w-full lg:flex-row px-4 relative gap-2 items-center  border-b  border-borderColor dark:border-borderColor-dark'>
                    <View className={sType + " p-1 -mt-16 sm:-mt-24 flex-none bg-backgroundCard dark:bg-backgroundCard-dark "} >
                        <Profile {...data.profile} displayType="unit_wo_info" displaySize={width >= 640? "4xl" : "3xl"} />
                    </View>
                    
                    <View className=' flex-col w-full  md:flex-row justify-between gap-4 flex-auto '>
                        <View className='flex-col gap-2 items-center md:items-start  lg:ml-0'>
                                <Text className=" tracking-tight truncate text-2xl font-bold text-gray-900 dark:text-gray-50">{data.profile.display_name}</Text>
                                    <View className='flex-row  gap-1 text-center'>
                                        <Text className="font-bold tracking-tight  text-gray-800 dark:text-gray-200">@johndoethefirst</Text>
                                        <Text className="text-gray-400 dark:text-gray-60">·</Text>
                                        <Text className=" tracking-tight whitespace-nowrap text-gray-800 dark:text-gray-200">256 Followers</Text>
                                        <Text className="text-gray-400 dark:text-gray-60">·</Text>
                                        <Text className=" tracking-tight whitespace-nowrap  text-gray-800 dark:text-gray-200">23 Friends</Text>
                                    </View>
                                    
                        </View>
                        <View className='items-start w-auto flex-row '>
                            <CoverMenu/>
                        </View>
                        
                        
                    </View>
                    <Text className='lg:hidden pb-4 pt-2 text-base text-gray-800 dark:text-gray-200  text-center'>{stripTags(data.profile.info.description)}</Text>
                </View>
            </View>
            
        </View>
    );
}