import { View } from 'app/design/view';
import Image from '../../ui/atoms/image';

import { Text, H1 } from 'app/design/typography';
import MenuSimple from 'app/components/menu_simple';
import Link from 'app/ui/atoms/link'
import Html from 'app/ui/atoms/html';

export default function ElementCover(props) {
    //TODO: implements menus
    const data = props.data;
   
    return (
        <View> 
            { !!data.profile.url_avatar && <Image alt={data.fullname} className="rounded-full absolute top-0 z-50" view="cover" src={data.profile.url_avatar} />}
            <View className='h-24'>
                { !!data.cover && <Image alt={data.group_name} view="cover" className="u-cover h-24" src={data.cover.src} />  }
            </View>
            <H1 className="font-bold tracking-tight  text-neogray-900 dark:text-neogray-50 ">{data.profile.display_name}</H1>
           
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

        </View>
        
    );
}
