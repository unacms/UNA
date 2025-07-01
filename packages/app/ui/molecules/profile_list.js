import { View, Row } from 'app/design/view'
import Profile from 'app/ui/molecules/profile';
import { memo } from 'react'

function fillArrayToLength(arr, maxCount, defaultValue) {
    while (arr.length < maxCount) {
        arr.push(defaultValue);
    }
    return arr;
  }

  export default function ProfilesList ({maxCount, showEmpty, data, displaySize="base"}) {

    let sSize = ''
    switch (displaySize) {
        case 'xs':
            sSize = 'w-6 h-6'
            break

        case 'sm':
            sSize = 'w-9 h-9'
            break

        case 'base':
            sSize = 'w-10 h-10 '
            break
        
        case 'lg':
            sSize = 'w-12 h-12 '
            break
    }

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
                        return <View key={index} className={sSize + (index > 0 ? " -ml-2 " : " ") + " shadow-[0_0_0_2px_rgba(255,255,255,1)] dark:shadow-[0_0_0_2px_rgba(0,0,0,1)]  rounded-full "}><Profile {...pr} displayType="unit_wo_info" displaySize={displaySize} /></View>
                    }
                    else{
                        return <View key={index} className={sSize + (index > 0 ? " -ml-2 " : " ") + " h-10 w-10 rounded-full border border-white dark:border-neutral-900 dark:bg-neutral-700 bg-neutral-300 "}></View>
                    }
                })
            }
        </Row>
    )

}