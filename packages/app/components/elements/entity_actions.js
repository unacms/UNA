import { View } from 'app/design/view';
import Menu from 'app/components/menu';
import { BlockWrapper } from 'app/components/block-wrapper'

export default function ElementEntityActions({ data, blockWrapperProps }) {

    return (
        <BlockWrapper {...blockWrapperProps}>
        <View className="w-full">
            <View className="p-3 sm:px-4 ">
                <Menu {...data} displayType="element" alignItems="start"  showMatched={true} autoFilter={false} params={{show_action: true, show_counter: true, show_combined: true}} />
            </View>
        </View>
        </BlockWrapper>
    );
}