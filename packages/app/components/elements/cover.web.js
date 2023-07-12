import { useState } from 'react'
import { View, Row, Pressable } from 'app/design/view'
import Image from '../../ui/atoms/image'
import { Text } from 'app/design/typography'
import { stripTags } from '../../lib/util'
import { Button } from 'app/design/controls'
import { appSetting } from 'app/lib/util'
import DropdownPopup from 'app/ui/atoms/dropdown-popup'
import Profile from 'app/ui/molecules/profile'
import Menu from 'app/components/menu'
import { useWindowDimensions } from 'react-native'
import { useRouter } from 'next/router';
import { Icon } from 'app/ui/atoms/icon'; 

function CoverMenu(props) {
  return (
    <View className="w-full">
      <View className="w-full justify-start align-end flex-row gap-2">
        <Menu
          {...props}
          displayType="button"
          params={{ button_variant: 'default', button_rounded: false }}
        />
      </View>
    </View>
  )
}

function CoverMenuSmall(props) {
  const [ntfsOpen, setNtfsOpen] = useState(false)

  return (
    <DropdownPopup
      open={ntfsOpen}
      onOpenChange={(bOpen) => {
        setNtfsOpen(bOpen)
      }}
      title="Test"
    >
      <Button variant="text" rounded startDecorator="DotsThreeOutline" />,
      <Menu
        {...props}
        displayType="button"
        params={{
          showVertical: true,
          button_variant: 'default',
          button_rounded: false,
          button_full_width: true,
        }}
      />
    </DropdownPopup>
  )
}

function CoverMenuMeta(props) {
  return (
    <Menu {...props} displayType="mixed" params={{ button_variant: 'text' }} />
  )
}

export function CoverSmall(props) {
  const router = useRouter();
  const data = props.data
  return (
    <View className=" backdrop-blur bg-backgroundtabbar  border-b border-bordercolornavbar dark:border-bordercolor-dark dark:bg-backgroundtabbar-dark  w-full ">
      <View className={appSetting('layout', 'max_width') + ' mx-auto w-full'}>
        <View className=" mx-2 py-2 flex-row gap-2">
          <Row className=" items-center  flex-auto">
          <View className='mr-2'>
          <Pressable className="mr-2 ml-2 bg-backgroundnavbar bordder dark:bg-backgroundnavbar-dark  w-10 h-10 rounded-full justify-center items-center" onPress={router.back} >
            <Icon icon="left" width={24} height={24} />
          </Pressable>
</View>
            <Profile
              {...data.profile}
              displayType="unit_wo_info"
              displaySize="base"
            />
            <Row className=" items-center ml-3 w-full">
              <Text className="text-lg xl:text-xl font-bold tracking-tight  text-neutral-900 dark:text-neutral-50">
                {data.profile.display_name}
              </Text>
              <View className="ml-4">
                <Button
                  size="sm"
                  rounded
                  startDecorator="SealCheck"
                  variant="link"
                  fullWidth
                />
              </View>
            </Row>
          </Row>
          <View className=" w-auto  my-auto ">
            <CoverMenuSmall {...data.actions_menu} />
          </View>
        </View>
      </View>
    </View>
  )
}

export default function ElementCover(props) {
  const data = props.data
  const router = useRouter();
  let { width } = useWindowDimensions()
  let bPerson = props.data.profile.module == 'bx_persons' ? true : false;

  return (
    <View className=" backdrop-blur border-b border-bordercolornavbar dark:border-bordercolor-dark bg-backgroundnavbar dark:bg-backgroundnavbar-dark ">
      <View className={appSetting('layout', 'max_width') + ' sm:px-4 mx-auto w-full'}>
        <View className=" duration-500 bg-primary-200  dark:bg-primary-950 aspect-video sm:aspect-3/1 w-auto   xl:rounded-b-lg overflow-hidden">
          {!!data.cover && (
            <Image
              alt={data.group_name}
              view="cover"
              sizes="(max-width:1280px) 100vw, 1280px"
              className="u-cover "
              src={data.cover.src}
            />
          )}
          { bPerson && <View className=" backdrop-blur bg-backgrounditem/50 dark:bg-backgrounditem-dark/50 pl-4 md:pl-6 pr-6 lg:px-8 lg:py-4 py-3 duration-300  rounded-2xl mb-2 ml-2  mr-32 sm:mr-48 md:ml-44 lg:ml-52 md:mr-4   mt-auto  flex-none flex-row items-center  ">
              <Text
                numberOfLines={3}
                className=" w-full text-sm md:text-base text-neutral-800 dark:text-neutral-200 "
              >
                {stripTags(data.profile.info.description)}
              </Text>
            </View>
          }
          <View className='absolute lg:hidden top-4 left-8 z-50'>
          <Pressable className="mr-2 ml-2 bg-backgroundnavbar dark:bg-backgroundnavbar-dark border  w-10 h-10 rounded-full justify-center items-center" onPress={router.back} >
            <Icon icon="left" width={24} height={24} />
          </Pressable>
          </View>
        </View>

        <View className="relative  flex-col md:flex-row gap-x-2 px-2 sm:px-4 pb-4 ">
          
        {bPerson && <View className=" flex-col  w-full md:w-52 ">
            <View className='rounded-full w-min p-1 z-50 right-0 lg:p-2 absolute duration-200 -bottom-12 sm:-bottom-24 md:-bottom-2 flex-none bg-backgroundcard dark:bg-backgroundcard-dark '>
              <Profile
                {...data.profile}
                displayType="unit_wo_info"
                displaySize={width >= 640 ? '4xl' : '3xl'}
              />
            </View>  
          </View>
          }
          <View className="flex-col lg:flex-row gap-x-2 gap-y-4  flex-auto ">
              <View className=" flex-col  mt-4 flex-auto gap-y-2 ">
                <Text className="tracking-tight text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 dark:text-neutral-50 ml-2">
                  {data.profile.display_name}
                </Text>
                <View className="   ">
                <CoverMenuMeta {...data.meta_menu} />
              </View>
                
              </View>
          
              <View className="flex-none ml-2 mt-auto  ">
                <CoverMenu {...data.actions_menu} />
              </View>
          </View>
        </View>
        
       
      </View>
    </View>
  )
}
