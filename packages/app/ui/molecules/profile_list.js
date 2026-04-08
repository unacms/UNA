import { View, Row } from 'app/design/view'
import Profile from 'app/ui/molecules/profile';
import {
    appSetting
} from 'app/lib/util'

function fillArrayToLength(arr, maxCount, defaultValue) {
    while (arr.length < maxCount) {
        arr.push(defaultValue);
    }
    return arr;
  }

  export default function ProfilesList ({maxCount, showEmpty, data, displaySize="base"}) {

    // Get size from settings (same source as Profile component)
    const sizeConfig = appSetting('theme', 'profile_sizes', displaySize);
    const sSize = sizeConfig.container;

    if (data?.length > maxCount){
        data = data.slice(0, maxCount);
    }

    if (showEmpty)
        data = fillArrayToLength(data, maxCount, '');
    return  (
        <Row className='items-center'>
            {
                data?.length > 0 && data?.map((profile, index) => {
                    if (profile?.id){
                       // profile.display_name = profile.display_name || profile.title
                       // profile.url_avatar = profile.url_avatar || profile.image.src;
                        const pr = profile.author_data || profile;
                        return <View key={index} className={ (index > 0 ? " -ml-2 " : " ") + "  bg-card rounded-full shadow-line p-px"}><Profile {...pr} displayType="unit_wo_info" displaySize={displaySize}  /></View>
                    }
                    else{
                        return <View key={index} className={ (index > 0 ? " -ml-2 " : " ") + " rounded-full bg-card shadow-sm "}></View>
                    }
                })
            }
        </Row>
    )

}