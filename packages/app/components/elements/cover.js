import { View, Row } from 'app/design/view';
import Image from '../../ui/atoms/image';
import { Text, H1, H1C } from 'app/design/typography';
import { stripTags } from '../../lib/util';
import { Button } from 'app/design/controls';
import { appSetting } from 'app/lib/util'

export default function ElementCover(props) {
    //TODO: implements menus
    const data = props.data;
    let sType = 'lg:rounded'

    if (props.data.profile.module == "bx_persons")
        sType = 'rounded-full';

    return (
        <View className='bg-neocard dark:bg-neocard-dark '>
            <View className={appSetting('layout', 'max_width') + ' mx-auto w-full'}>
                <View className=''>
                    <View  className='bg-cover w-full pt-[34%]  lg:rounded-b-lg overflow-hidden'>
                        { !!data.cover && <Image alt={data.group_name} view="cover" className="u-cover lg:rounded-b-2xl" src={data.cover.src} />  }
                    </View>
                  
                </View>
                <View className='w-full relative  '>
                    
                        <View className={sType + "  absolute left-0  -top-16 lg:-top-24 left-4 h-32 w-32 lg:h-48 lg:w-48 overflow-hidden   border-2 border-neocard dark:border-neocard-dark "} >
                            <View className="w-[50%] z-20 aspect-square bg-gray-200  dark:bg-gray-600 border-4 border-gray-100 dark:border-gray-700  mx-auto rounded-full mt-[15%] "></View>
                            <View className="w-[80%] -translate-y-[5%] aspect-square  bg-gray-200  dark:bg-gray-600  mx-auto rounded-t-full  "></View>
                            { !!data.profile.url_avatar && <Image alt={data.fullname} className="rounded-b-2xl w-full z-50" view="cover" src={data.profile.url_avatar} />}
                        </View>
                    
                    
                    <View className=' p-4 flex-col  lg:pl-56 lg:pb-8  justify-between lg:flex-row-reverse  '>
                        <View className=' mb-4  w-full lg:w-auto  '>
                            <View className=' w-full justify-end align-end  flex-row  space-x-2'>
                                <Button title="Follow" variant="primary" fullWidth />
                                <Button title="Remove" variant="default" fullWidth/>
                            </View>
                        </View>
                        <View className='flex-col gap-2 w-full lg:w-auto '>
                            
                                <H1C className="font-bold tracking-tight  text-gray-900 dark:text-gray-50">{data.profile.display_name}</H1C>
                               
                                    <Row className='flex-row space-x-1'>
                                        <Text className="font-bold tracking-tight  text-gray-800 dark:text-gray-200">@johndoe</Text>
                                        <Text className="text-gray-400 dark:text-gray-60">·</Text>
                                        <Text className=" tracking-tight  text-gray-800 dark:text-gray-200">256 Followers</Text>
                                    </Row>
                                    <Text className='lg:hidden'>{stripTags(data.profile.info.description)}</Text>
                                
                            
                        </View>
                        
                    </View>
                </View>
            </View>
        </View>
    );
}
/*
{ !!data.actions_menu && <View className=''>
                {data.actions_menu.items.map((tab, index) => (
                     <Link href={tab.link} >
                     <Text>{tab.title}</Text>
                 </Link>
                ))}

            </View> }
            
 { !!data.meta_menu && <View className=''>
                {data.meta_menu.items.map((tab, index) => (
                     <Html data={tab} />
                ))}

            </View> }
            */