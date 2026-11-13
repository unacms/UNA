import { View } from 'app/design/view';
import Menu from 'app/components/menu';
import { BlockWrapper } from 'app/components/block-wrapper'

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
                        button_full_width: false, show_action: true, show_counter: true, show_combined: true
                    }}
                />
            </View>
        </BlockWrapper>
    );
}