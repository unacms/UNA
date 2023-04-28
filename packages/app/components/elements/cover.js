import { View, Row, Pressable } from 'app/design/view';
import { Text, H1C } from 'app/design/typography';
import { stripTags } from '../../lib/util';
import { Button } from 'app/design/controls';
import { appSetting } from 'app/lib/util'
import Profile from 'app/ui/molecules/profile';
import { useRef, useState } from 'react';
import { Platform } from 'react-native'
import { useWindowDimensions } from 'react-native'
import Image from '../../ui/atoms/image';
import { useRouter } from 'expo-router';
import { Theme } from 'app/design/theme';
import { Icon } from 'app/ui/atoms/icon'; 

function CoverMenu(){
    return (
        <View className=' w-full lg:w-auto  mt-2 lg:mt-0'>
            <View className=' w-full justify-start align-end  flex-row  space-x-2'>
                <Button title="Follow" variant="primary" fullWidth />
                <Button title="Message" variant="default" fullWidth/>
            </View>
        </View>
    );
}

export function CoverSmall(props) {
    const routerExpo = useRouter();
  const data = props.data;
  const { colors } = Theme();
  return (

    <Row className=' justify-left w-full h-24 pt-12' style={{backgroundColor: colors.barsBackground}} >
      <Pressable  className="mr-4 ml-4" onPress={routerExpo.back} >
        <Icon icon="left" width={24} height={24}  color={colors.barsColor} />
       </Pressable>
      <Profile {...data.profile} displayType="unit_wo_info" displaySize="sm" />
      <H1C className="font-bold ml-4 tracking-tight  text-gray-900 dark:text-gray-50">{data.profile.display_name}</H1C>
    </Row>
  );
}

export default function ElementCover(props) {

    const routerExpo = useRouter();
  const data = props.data;
  const { colors } = Theme();
    let sType = 'lg:rounded'

    if (props.data.profile.module == "bx_persons")
        sType = 'rounded-full';

    return (
      <View className='w-full' >
         <View  className=' absolute h-80 w-full '>
            { !!data.cover && <Image alt={data.group_name} view="cover" className="u-cover " src={data.cover.src} />  }
        </View>
        <Row className=' justify-left w-full h-24 pt-12' style={{backgroundColor: colors.barsBackground}} >
      <Pressable  className="mr-4 ml-4" onPress={routerExpo.back} >
        <Icon icon="left" width={24} height={24}  color={colors.barsColor} />
       </Pressable>
    </Row>
        <View className=' m-4 p-4  mt-16' style={{backgroundColor:'rgba(255,255,255,0.8)'}}>
            <Row className='items-center'>
                <Profile {...data.profile} displayType="unit_wo_info" displaySize="lg" />
                <View className='flex-col w-full '>
                    <H1C className="font-bold tracking-tight  text-gray-900 dark:text-gray-50">{data.profile.display_name}</H1C>
                </View>
            </Row>
            <View className=' w-full'>
                <CoverMenu/>
            </View>
      </View>
  </View>
    );
}