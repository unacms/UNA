import { View, Row } from 'app/design/view'
import { Text } from 'app/design/typography'
import { Button } from 'app/design/controls'
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg'
import Link from 'app/ui/atoms/link'
import { Icon } from 'app/ui/atoms/icon'
import Card from 'app/components/card'
import { appSetting } from 'app/lib/util'
import Image from 'app/ui/atoms/image'
import { env } from 'app/lib/env'
import Form from 'app/components/elements/form'
import { BlockByName } from 'app/components/block'


function SplashBlock (props) {
    if (appSetting('splash', 'block') == 'image'){
        let url =  'https://ci.una.io/test3/s/bx_posts_photos_resized/6cryjeyhsr4z5qetgu7k7wlqrxuatfd9.jpg';
        url = '/splash.webp';
        //return env('UNA_URL')+'xxx'
        return <Image sizes="1024px" view="cover" className="u-cover" src={url} />
    }

    if (appSetting('splash', 'block') == 'login'){
        return <BlockByName name={props.blocks.login} data={props.data}/>
    }

    if (appSetting('splash', 'block') == 'signup'){
        return <BlockByName name={props.blocks.signup} data={props.data}/>
    }

    return <></>
} 

export default function SplashPage(props) {

    return (<View className="flex-col  w-full max-w-screen-2xl mx-auto">
          <View className="flex-col lg:flex-row gap-y-4 gap-x-4 sm:m-6 p-4 duration-300 sm:border border-dashed rounded-3xl border-gray-500/20">
            <View className="flex-col mx-auto w-full max-w-xl lg:w-1/2 items-center  lg:text-start p-4 xl:p-8 my-auto lg:flex-auto">
                <BlockByName name={props.blocks.home_intro} />
            </View>
            <View className="mx-auto w-full lg:w-1/2 p-2 my-auto   ">
              <Card addClassName="items-center rounded-2xl justify-center w-full max-w-xl mx-auto flex-auto h-96 flex-col gap-y-2 p-4">
                <SplashBlock {...props}/>
              </Card>
            </View>
          </View>
          <BlockByName name={props.blocks.home_footer} />
        </View>)
}