import { View, Row, Pressable } from 'app/design/view';
import { Text, H1C } from 'app/design/typography';
import { stripTags } from '../../lib/util';
import { Button } from 'app/design/controls';
import Profile from 'app/ui/molecules/profile';
import { useWindowDimensions } from 'react-native'
import Image from '../../ui/atoms/image';
import { useRouter } from 'expo-router';
import { Theme } from 'app/design/theme';
import { Icon } from 'app/ui/atoms/icon'; 
import Menu from 'app/components/menu';
import { Canvas, Fill,Image as Image2, BackdropBlur, useImage } from "@shopify/react-native-skia";

function CoverMenu(props) {
    return (
    <View className='w-full mt-3 '>
        <View className=' w-full justify-start align-end flex-row gap-2'>
            <Menu {...props} displayType="button" params={{button_variant: 'default', button_rounded: false}} />
        </View>
    </View>
    );
}

export function CoverSmall(props) {
    const routerExpo = useRouter();
    const data = props.data;
    const { colors } = Theme();
    const windowWidth = useWindowDimensions().width;
    let image = null
    if (data.cover){
        image = useImage(data.cover.src);

        if (!image)
            return <></>;
    }


return (
    <Row className=' justify-left items-center pt-10  w-full h-24' style={{backgroundColor: colors.barsBackground}} >
        <View className='absolute h-80 w-full'>
        { !!data.cover && (
            <Canvas style={{ width: windowWidth, height: 256}}>
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
        
        <Pressable className="mr-2 ml-2 bg-backgroundcard dark:bg-backgroundcard-dark w-10 h-10 rounded-full justify-center items-center" onPress={routerExpo.back} >
            <Icon icon="ArrowLeft" width={24} height={24} color={colors.barsColor} />
        </Pressable>
        <Profile {...data.profile} displayType="unit_wo_info" displaySize="base" />
        <H1C className="font-bold text-base ml-2 tracking-tight text-white dark:text-gray-50">{data.profile.display_name}</H1C>
    </Row>
    );
}

function CoverMenuMeta(props) {
    return (
      <Menu {...props} displayType="mixed" params={{ button_variant: 'text' }} />
    )
  }

export default function ElementCover(props) {
    const routerExpo = useRouter();
    const data = props.data;
    const { colors } = Theme();
    let sType = 'lg:rounded'

    if (props.data.profile.module == "bx_persons")
        sType = 'rounded-full';

    return (
    <View className='w-full ' >
        <View className=' absolute h-48 w-full '>
            { !!data.cover && <Image alt={data.group_name} view="cover"  sizes="(max-width:1280px) 100vw, 1280px"  className="u-cover " src={data.cover.src} />}
        </View>
        <Row className=' justify-left w-full h-24 pt-12' >
            <Pressable className="mr-2 ml-2 bg-backgroundnavbar dark:bg-backgroundnavbar-dark  w-10 h-10 rounded-full justify-center items-center" onPress={routerExpo.back} >
                <Icon icon="left" width={24} height={24} color={colors.barsColor} />
            </Pressable>
        </Row>
        <View className='px-2 mt-24  pb-2' >
        <View className="relative  flex-row flex-wrap px-4 gap-4 ">
          <View
            className={
              sType +
              ' w-min p-1  absolute -bottom-1  flex-none bg-backgroundcard dark:bg-backgroundcard-dark '
            }
          >
            <Profile
              {...data.profile}
              displayType="unit_wo_info"
              displaySize={'2xl'}
            />
          </View>
            
          <View className=" flex-col pl-24 mt-auto py-2 flex-auto">
            <Text className="tracking-tight text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-50">
              {data.profile.display_name}
            </Text>

            
          </View>
        </View>
        </View>
        <View className="bg-backgrounditem dark:bg-backgrounditem-dark px-2.5 py-1 rounded-lg mx-4 mt-4 flex-none flex-row items-center  ">
              <Text
                numberOfLines={3}
                className=" w-full text-sm sm:text-base text-gray-800 dark:text-gray-200 "
              >
                {stripTags(data.profile.info.description)}
              </Text>
            </View>
        <View className="p-4 flex-row flex-wrap items-center align-center  gap-4 w-full justify-between">
          <View className="  flex-none ">
            <CoverMenuMeta {...data.meta_menu} />
          </View>
          
          <View className="flex-none">
            <CoverMenu {...data.actions_menu} />
          </View>
        </View>
    </View>
    );
}