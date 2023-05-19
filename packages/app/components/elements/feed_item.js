import { View } from 'app/design/view';
import Html from '../../ui/atoms/html';
import Time from '../../ui/atoms/time';
import Profile from '../../ui/molecules/profile';
import { Text } from 'app/design/typography'
import Menu from '../menu';

export default function ElementFeedItem({data}) {
    return (
    <View className="relative sm:my-0 bg-backgroundcard dark:bg-backgroundcard-dark sm:rounded-t-lg sm:border-t border-neoborder dark:border-neoborder-dark sm:border-x w-full mx-auto max-w-5xl">             
        <View className="m-4">
            <Profile {...data.event.author_data} displayType="unit" displaySize="lg" showInfo={(<Time className="" ts={data.event.date}></Time>)}  />
            <Html data={data.event.content.text} />
        </View>
        <View className="mx-4 mb-2">
            <Menu {...data.event.menu_actions} displayType="element" showMatched="true" params={{show_action: true, show_counter: true, show_combined: true}} />
        </View>
    </View>
    )
}