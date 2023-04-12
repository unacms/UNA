import { View, Pressable } from 'app/design/view';
import Image from '../../ui/atoms/image';
import Html from '../../ui/atoms/html';
import Time from '../../ui/atoms/time';
import Profile from '../../ui/molecules/profile';
import { Text, H1 } from 'app/design/typography'
import Menu from '../menu';

export default function ElementFeedItem({data}) {
    return (<View className="relative sm:my-0 bg-neocard  dark:bg-neocard-dark sm:border-x  border-neoborder dark:border-neoborder-dark w-full mx-auto max-w-5xl">             
        <View className="m-4">
            <Profile {...data.event.author_data} displayType="unit" displaySize="lg" showInfo={(<Time className="" ts={data.event.date}></Time>)}  />
            <Html data={data.event.content.text} />
        </View>
        <View className="mx-4 mb-2">
            <Menu {...data.event.menu_actions} displayType="element" showMatched="true" params={{show_action: false, show_counter: true}} />
        </View>
        <View className="px-4 pt-2 border-t border-neoborder dark:border-neoborder-dark flex-row items-center">
            <View className=" flex-row gap-2 flex-auto flex-wrap ">
                <Menu {...data.event.menu_actions} displayType="element" showMatched="true" params={{show_action: true, show_counter: false, show_do_vote_as_button: false}} />
            </View>
        </View>
        <View className="m-4">
            <Text>TODO: add functionality</Text>
        </View>
    </View>
    )
}