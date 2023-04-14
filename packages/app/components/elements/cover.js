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
        <View className='bg-white'>
            <View className={appSetting('layout', 'max_width') + ' mx-auto w-full'}>
                <View className='h-48 lg:h-auto'>
                    <View className='w-full h-32 lg:h-80 bg-blue-500 lg:rounded-b-2xl '>
                        { !!data.cover && <Image alt={data.group_name} view="cover" className="u-cover lg:rounded-b-2xl" src={data.cover.src} />  }
                    </View>
                    <View className={sType + " absolute top-20 lg:top-64 h-24 w-24 lg:h-32 lg:w-32 overflow-hidden bg-gray-100 dark:bg-gray-700 ml-4 border-2 border-white"} >
                        <View className="w-[50%] z-20 aspect-square bg-gray-200  dark:bg-gray-600 border-4 border-gray-100 dark:border-gray-700  mx-auto rounded-full mt-[15%] "></View>
                        <View className="w-[80%] -translate-y-[5%] aspect-square  bg-gray-200  dark:bg-gray-600  mx-auto rounded-t-full  "></View>
                        { !!data.profile.url_avatar && <Image alt={data.fullname} className="rounded-b-2xl w-full z-50" view="cover" src={data.profile.url_avatar} />}
                    </View>
                </View>
                <View className='w-full lg:pl-36 '>
                    <View className='justify-between lg:flex-row items-center lg:h-16'>
                        <View className='lg:flex-row w-full lg:w-auto '>
                            <View className='ml-3 lg:ml-4 '>
                                <H1C className="font-bold tracking-tight  text-gray-900 dark:text-gray-50">{data.profile.display_name}</H1C>
                                <View>
                                    <Row>
                                        <Text>@johndoe</Text><Text> · 26K Followers</Text>
                                    </Row>
                                    <Text className='lg:hidden'>{stripTags(data.profile.info.description)}</Text>
                                </View>
                            </View>
                        </View>
                        <View className=' pl-3 w-full lg:w-auto items-center lg:mr-4 lg:pl-0 mt-2 lg:mt-0'>
                            <Row className=' w-full lg:align-end gap-2'>
                                <Button title="Follow" variant="primary" fullWidth />
                                <Button title="Remove" variant="default" fullWidth/>
                            </Row>
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