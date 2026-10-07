import { View } from 'app/design/view';
import { BlockWrapper } from 'app/components/block-wrapper';
import ElementMenu from 'app/components/elements/menu';

export default function ElementTasksMenu({ data, blockWrapperProps, url }) {
    const menus = Object.entries(data || {});

    if (!menus.length) return null;

    return (
        <BlockWrapper {...blockWrapperProps}>
            <View className="w-full gap-4">
                {menus.map(([key, menu]) => (
                    <View key={menu.object || key} className="flex-shrink-0">
                        <ElementMenu
                            data={{ content: { items: menu.items || [] } }}
                            url={url}
                            blockWrapperProps={{ block: { designbox_id: null } }}
                        />
                    </View>
                ))}
            </View>
        </BlockWrapper>
    );
}
