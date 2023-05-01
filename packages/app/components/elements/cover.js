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
import { Canvas, Fill,Image as Image2, BackdropBlur, ColorMatrix, useImage } from "@shopify/react-native-skia";



function CoverMenu(){
    return (
    <View className='w-full mt-2 '>
        <View className=' w-full justify-start align-end flex-row space-x-2'>
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
    const windowWidth = useWindowDimensions().width;
    let image = null
    if (data.cover){
        image = useImage(data.cover.src);

        if (!image)
            return <></>;
    }


return (
    <Row className=' justify-left items-center w-full h-24 pt-8' style={{backgroundColor: colors.barsBackground}} >
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
                    blur={4}
                    clip={{ x: 0, y: 0, width: windowWidth, height: 256 }}
                >
                    <Fill color="rgba(0, 0, 0, 0.1)" />
                </BackdropBlur>
            </Canvas>
            )}
        </View>
        <Pressable className="mr-2 ml-2bg-backgroundcard dark:bg-backgroundcard-dark w-10 h-10 rounded-full justify-center items-center" onPress={routerExpo.back} >
            <Icon icon="left" width={24} height={24} color={colors.barsColor} />
        </Pressable>
        <Profile {...data.profile} displayType="unit_wo_info" displaySize="lg" />
        <H1C className="font-bold ml-2 tracking-tight text-white dark:text-gray-50">{data.profile.display_name}</H1C>
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
        <View className=' absolute h-48 w-full '>
            { !!data.cover && <Image alt={data.group_name} view="cover" className="u-cover " src={data.cover.src} />}
        </View>
        <Row className=' justify-left w-full h-24 pt-12' >
            <Pressable className="mr-4 ml-4 bg-backgroundcell dark:bg-backgroundcell-dark w-10 h-10 rounded-full justify-center items-center" onPress={routerExpo.back} >
                <Icon icon="left" width={24} height={24} color={colors.barsColor} />
            </Pressable>
        </Row>
        <View className='px-2 mt-24 bg-backgroundcell dark:bg-backgroundcell-dark' >
            <View className='flex-row '>
                <View className=' absolute -translate-y-12 bg-backgroundcell dark:bg-backgroundcell-dark rounded-full p-1 '>
                    <Profile {...data.profile} displayType="unit_wo_info" displaySize="2xl" />
                </View>
                <View className='ml-auto '>
                    <CoverMenu />
                </View>
            </View>
            <View className='w-full px-2 mt-4'>
                <H1C className="font-bold tracking-tight text-2xl text-gray-900 dark:text-gray-50">{data.profile.display_name}</H1C>
                <Text numberOfLines={1} className='text-base text-gray-800 dark:text-gray-200 text-wrap '>{stripTags(data.profile.info.description)}</Text>
            </View>
        </View>
    </View>
    );
}