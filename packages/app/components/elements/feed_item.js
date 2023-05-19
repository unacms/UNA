import { View } from 'app/design/view';
import Html from '../../ui/atoms/html';
import Time from '../../ui/atoms/time';
import Profile from '../../ui/molecules/profile';
import { Text } from 'app/design/typography'
import Menu from '../menu';

export default function ElementFeedItem({data}) {
    return (<View className="relative sm:my-0 bg-backgroundcard dark:bg-backgroundcard-dark w-full mx-auto max-w-5xl">             
        <View className="m-4">
            <Html data={data.event.content.text} />
        </View>
        <View className="mx-4 mb-2">
            <Menu {...data.event.menu_actions} displayType="element" showMatched="true" params={{show_action: false, show_counter: true}} />
        </View>
        <View className="px-4 pt-2 border-t border-neoborder dark:border-neoborder-dark flex-row items-center">
            <View className=" flex-row gap-2 flex-auto flex-wrap ">
                <Menu {...data.event.menu_actions} displayType="element" showMatched="true" params={{classNameItem: 'flex-none flex flex-row pr-2', show_action: true, show_counter: false, show_action_as_button: false}} />
            </View>
        </View>
    </View>
    )
}