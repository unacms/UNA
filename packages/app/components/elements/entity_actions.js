import { View } from 'app/design/view';
import Menu from 'app/components/menu';
import { BlockWrapper } from 'app/components/block-wrapper'

export default function ElementEntityActions({ data, blockWrapperProps }) {

    const menuData = {
        ...data,
        items: (data.items || []).filter(
            (item) =>
                !item.name?.startsWith('edit-') &&
                //!item.name?.startsWith('report') &&
                !item.name?.startsWith('delete-')
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
                    params={{
                        className: 'gap-x-2',
                        button_variant: 'default',
                        button_size: 'sm',
                        button_rounded: false,
                        button_full_width: false, show_action: true, show_counter: true, show_combined: true
                    }}
                />
            </View>
        </BlockWrapper>
    );
}