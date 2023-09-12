import { View } from 'app/design/view'
import { appSetting } from 'app/lib/util'
import Image from 'app/ui/atoms/image'
import { env } from 'app/lib/env'
import Form from 'app/components/elements/form'
import { BlockByName } from 'app/components/block'


export default function (props) {
    if (appSetting('splash', 'block') == 'image'){
        let url =  'http://localhost:3000/splash.webp';
        return <Image sizes=" (max-width:640px) 100vw, (max-width:768px) 50vw, (max-width:1024px) 33vw, (max-width:1280px) 25vw, 256px" view="cover" className="u-cover" src='https://ci.una.io/test3/s/bx_posts_photos_resized/6cryjeyhsr4z5qetgu7k7wlqrxuatfd9.jpg' />
    }

    if (appSetting('splash', 'block') == 'login'){
       console.log(props);
        //return  <BlockByName data={props.data} name='system:login_form' />
    }

    return <></>
} 
