import { View, Row, Pressable } from 'app/design/view';
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

export function CoverSmall(props) {
 
  const data = props.data;
  return (
    <Row className='items-center  justify-center w-64 '>
      
      <Profile {...data.profile} displayType="unit_wo_info" displaySize="sm" />
      <H1C className="font-bold ml-4 tracking-tight  text-gray-900 dark:text-gray-50">{data.profile.display_name}</H1C>
    </Row>
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


    
    return (
      <View className='bg-orange-500 fixed top:64 z-50 w-full border-b border-neoborder dark:border-neoborder-dark' >
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
    );
}