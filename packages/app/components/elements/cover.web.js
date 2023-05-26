import { useState } from 'react';
import { View, Row } from 'app/design/view';
import Image from '../../ui/atoms/image';
import { Text } from 'app/design/typography';
import { stripTags } from '../../lib/util';
import { Button } from 'app/design/controls';
import { appSetting } from 'app/lib/util'
import DropdownPopup from 'app/ui/atoms/dropdown-popup';
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

function CoverMenuSmall(props) {
    const [ntfsOpen, setNtfsOpen] = useState(false);

    return (
            <DropdownPopup open={ntfsOpen} onOpenChange={(bOpen) => {setNtfsOpen(bOpen);}} title="Test">{[
                <Button variant="text" rounded startDecorator="DotsThreeOutline" />, 
                <Menu {...props} displayType="button" params={{showVertical: true, button_variant: 'default', button_rounded: false, button_full_width: true}} />]}
            </DropdownPopup>
    );
}

function CoverMenuMeta(props) {
    return (
        <Menu {...props} displayType="mixed" params={{button_variant: 'text'}} />
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
                        <CoverMenuSmall {...data.actions_menu} />
                    </View>
                </View>
            </View>
        </View>
    );
}

export default function ElementCover(props) {
    const data = props.data;
    
    let { width } = useWindowDimensions();

    let sType = 'lg:rounded'
    if (props.data.profile.module == "bx_persons")
        sType = 'rounded-full';

    return (
      <View className=' backdrop-blur  bg-backgroundnavbar dark:bg-backgroundnavbar-dark ' >
            <View className={appSetting('layout', 'max_width') + '  mx-auto w-full'}>
                <View  className=' duration-500 bg-primary-200 dark:bg-primary-950  -mx-4 w-auto pt-[20%]  xl:rounded-b-lg overflow-hidden'>
                        { !!data.cover && <Image alt={data.group_name} view="cover" sizes="(max-width:1280px) 100vw, 1280px" className="u-cover " src={data.cover.src} />  }
                </View>
                <View className='relative flex-col lg:flex-row -top-16 lg:-top-24 -mb-16 lg:-mb-24 px-4 xl:px-0 py-3 lg:gap-4 border-bordercolor dark:border-bordercolor-dark'>
                    <View className={sType + " w-min p-1 flex-none bg-backgroundcard dark:bg-backgroundcard-dark "} >
                        <Profile {...data.profile} displayType="unit_wo_info" displaySize={width >= 1024? "4xl" : "3xl"} />
                    </View>
                    <View className='w-min lg:pt-24 lg:flex-row lg:justify-between flex-auto'>
                        <View className='items-start shrink gap-3'>
                            <Row className='items-center w-full truncate mt-1 lg:mt-0'>
                                <Text className="ml-1 tracking-tight truncate text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-50">{data.profile.display_name}</Text>
                                <Button size="sm" rounded startDecorator="SealCheck" variant="link" fullWidth />
                            </Row>
                            <Row className='flex-wrap gap-1 text-center'>
                                <CoverMenuMeta  {...data.meta_menu} />
                            </Row>
                            <Text numberOfLines={2} className=' lg:hidden text-base text-gray-800 dark:text-gray-200 '>{stripTags(data.profile.info.description)}</Text>
                        </View>
                        <View className='items-start'>
                            <CoverMenu  {...data.actions_menu} />
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}