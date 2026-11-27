import { View } from 'app/design/view';
import Menu from 'app/components/menu';
import { BlockWrapper } from 'app/components/block-wrapper'
import { countersModeParams, menuCountersMode } from 'app/lib/counters-mode'

export default function ElementEntityActions({ data, blockWrapperProps }) {

    const menuData = {
        ...data,
        items: (data.items || []).filter(
            (item) =>
                !item.name?.startsWith('edit-') &&
                !item.name?.startsWith('add-images-to-album') &&
                !item.name?.startsWith('delete-') &&
                !item.name?.startsWith('move-image')
                
        ),
    };

    return (
        <BlockWrapper {...blockWrapperProps}>
            <View className="w-full">
                <Menu
                    {...menuData}
                   // displayType="element"
                    alignItems="start"
                   // showMatched={true}
                    autoSize={true}
                    autoFilter={false}
                    // The look of the buttons is UNA's (Studio > Navigation > the actions menu > "Button style" /
                    // "Button size"). The defaults are for a menu UNA leaves on Automatic.
                    params={{
                        className: 'gap-x-2',
                        button_variant_default: 'default',
                        button_size_default: 'small',
                        button_rounded: false,
                        button_full_width: false,
                        // UNA's Counters for the menu (Studio > Navigation): button groups unless it says otherwise.
                        ...countersModeParams(menuCountersMode(data) || 'group'),
                    }}
                />
            </View>
        </BlockWrapper>
    );
}