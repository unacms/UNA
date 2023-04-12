import { View, Pressable } from 'app/design/view';
import Image from '../../ui/atoms/image';
import Html from '../../ui/atoms/html';
import Time from '../../ui/atoms/time';
import Profile from '../../ui/molecules/profile';
import { Text, H1 } from 'app/design/typography'

export default function ElementFeedItem({data}) {
    return (<View className="relative sm:my-0 bg-neocard  dark:bg-neocard-dark sm:border-x  border-neoborder dark:border-neoborder-dark w-full mx-auto max-w-5xl">             
        <View className="m-4">
            <Profile {...data.event.author_data} displayType="unit" displaySize="lg" showInfo={(<Time className="" ts={data.event.date}></Time>)}  />
            <Html data={data.event.content.text} />
            <Text>TODO: add functionality</Text>
        </View>
    </View>
    )
}