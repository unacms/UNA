import { View, Row, Pressable } from 'app/design/view'
import { Text, H1C } from 'app/design/typography'
import { stripTags } from '../../lib/util'
import Profile from 'app/ui/molecules/profile'
import { useWindowDimensions } from 'react-native'
import Image from '../../ui/atoms/image'
import { useRouter } from 'expo-router'
import { Theme } from 'app/design/theme'
import { Icon } from 'app/ui/atoms/icon'
import Menu from 'app/components/menu'
import {
  Canvas,
  Fill,
  Image as Image2,
  BackdropBlur,
  useImage,
} from '@shopify/react-native-skia'

function CoverMenu(props) {
  return (
    
      <View className="flex-row">
        <Menu
          {...props}
          displayType="button"
          params={{ button_variant: 'default', button_size: 'base' , button_rounded: false }}
        />
      </View>
    
  )
}

export function CoverSmall(props) {
  const routerExpo = useRouter()
  const data = props.data
  const { colors } = Theme()
  const windowWidth = useWindowDimensions().width
  let image = null
  if (data.cover) {
    image = useImage(data.cover.src)

    if (!image) return <></>
  }

  return (
    <Row
      className=" justify-left items-center pt-10  w-full h-24"
      style={{ backgroundColor: colors.barsBackground }}
    >
      <View className="absolute h-80 w-full">
        {!!data.cover && (
          <Canvas style={{ width: windowWidth, height: 256 }}>
            <Image2
              image={image}
              x={0}
              y={0}
              width={windowWidth}
              height={256}
              fit="cover"
            />
            <BackdropBlur
              blur={10}
              clip={{ x: 0, y: 0, width: windowWidth, height: 256 }}
            >
              <Fill color="rgba(0, 0, 0, 0.1)" />
            </BackdropBlur>
          </Canvas>
        )}
      </View>

      <Pressable
        className="mx-4 bg-backgroundcard dark:bg-backgroundcard-dark w-10 h-10 rounded-full justify-center items-center"
        onPress={routerExpo.back}
      >
        <Icon
          icon="ArrowLeft"
          width={24}
          height={24}
          color={colors.barsColor}
        />
      </Pressable>
      <Profile
        {...data.profile}
        displayType="unit_wo_info"
        displaySize="base"
      />
      <H1C className="font-bold text-base ml-2 tracking-tight text-white">
        {data.profile.display_name}
      </H1C>
    </Row>
  )
}

function CoverMenuMeta(props) {
  return (
    <Menu {...props} displayType="mixed" params={{ button_variant: 'text' }} />
  )
}

export default function ElementCover(props) {
  const routerExpo = useRouter()
  const data = props.data
  const { colors } = Theme()
  let sType = 'lg:rounded'

  let bPerson = props.data.profile.module == 'bx_persons' ? true : false

  return (
    <View className=" bg-white dark:bg-neutral-900 ">
      <View className=" absolute h-48 w-full ">
        {!!data.cover && (
          <Image
            alt={data.group_name}
            view="cover"
            sizes="(max-width:1280px) 100vw, 1280px"
            className="u-cover "
            src={data.cover.src}
          />
        )}
      </View>
      <Row className=" justify-left w-full h-24 pt-12">
        <Pressable
          className="mr-2 ml-2 bg-backgroundnavbar dark:bg-backgroundnavbar-dark  w-10 h-10 rounded-full justify-center items-center"
          onPress={routerExpo.back}
        >
          <Icon icon="left" width={24} height={24} color={colors.barsColor} />
        </Pressable>
      </Row>
      <View className="px-4 mt-40 bg-black/0 ">
        <View className="relative  ">
          {bPerson && (
            <View className=" w-min p-1  absolute bottom-10 rounded-full  flex-none bg-backgroundcard dark:bg-backgroundcard-dark ">
              <Profile
                {...data.profile}
                displayType="unit_wo_info"
                displaySize={'3xl'}
              />
            </View>
          )}
            
          
            <Text className="tracking-tight  text-2xl font-bold text-neutral-950 dark:text-neutral-50">
              {data.profile.display_name}
            </Text>
          
        </View>
      </View>
      
        <View className="m-2  flex-col space-y-1  ">
         <View className=''><CoverMenuMeta {...data.meta_menu} /></View> 
        
        {bPerson && (
          <Text
            numberOfLines={3}
            className=" mx-2   text-sm sm:text-base text-neutral-800 dark:text-neutral-200 "
          >
            {stripTags(data.profile.info.description)}
          </Text>
           )}



        </View>
     
      <View className=" flex-col gap-y-2 p-4   ">

      
          <CoverMenu {...data.actions_menu} />
      
        
      </View>
    </View>
  )
}
