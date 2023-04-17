
import { View } from 'app/design/view';
import Menu from '../menu';
import { appSetting } from 'app/lib/util'

export default function ElementEntityActions(props) {

    const view = appSetting('entry', 'default_view');

/*
 * Commented out to check actions.
 * 
    if (view == 'small')
        return <></>
*/

    return (
        <View className="relative  sm:my-0 bg-neocard dark:bg-neocard-dark  border-neoborder dark:border-neoborder-dark sm:border-x w-full mx-auto max-w-5xl">
            <View className="flex flex-col w-full">
                <View className="flex flex-row px-4 pb-4">
                    <Menu {...props.data} displayType="element" showMatched="true" params={{show_action: false, show_counter: true}} />
                </View>
                <View className="flex p-2 flex-row  border-t border-neoborder dark:border-neoborder-dark ">
                    <Menu {...props.data} displayType="element" showMatched="true" params={{show_action: true, show_counter: false}} />
                </View>
            </View>
        </View>
    );
}