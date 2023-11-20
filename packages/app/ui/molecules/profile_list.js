

import { View, Row } from 'app/design/view'
import Profile from 'app/ui/molecules/profile';

function fillArrayToLength(arr, maxCount, defaultValue) {
    while (arr.length < maxCount) {
        arr.push(defaultValue);
    }
    return arr;
  }

export default function ({maxCount, showEmpty, data, displaySize="base"}) {

    let sSize = ''
    switch (displaySize) {
        case 'xs':
            sSize = 'w-6 h-6'
            break

        case 'sm':
            sSize = 'w-8 h-8'
            break

        case 'base':
            sSize = 'w-10 h-10 '
            break
    }

    if (data?.length > maxCount){
        data = data.slice(0, maxCount);
    }

    if (showEmpty)
        data = fillArrayToLength(data, maxCount, '');
    return  (
        <Row className='items-center flex-auto overflow-hidden'>
            {
                data?.length > 0 && data?.map((profile, index) => {
                    if (profile?.id){
                        profile.display_name = profile.title
                        profile.url_avatar = profile.image.src;
                        return <View key={index} className={sSize + (index > 0 ? " -ml-2 " : " ")}><Profile {...profile} displayType="unit_wo_info" displaySize={displaySize} /></View>
                    }
                    else{
                        return <View key={index} className={sSize + (index > 0 ? "  " : " ") + " h-10 w-10 -ml-2 rounded-full border border-white dark:border-neutral-900 dark:bg-neutral-700 bg-neutral-300 "}></View>
                    }
                })
            }
        </Row>
    )

}
