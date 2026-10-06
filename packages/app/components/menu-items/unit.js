import { NeoButton } from 'app/design/controls'
import { components } from 'app/components/registry';


export default function MenuItemSubmenu({ menuItem, isPrimary }) {
    if (!menuItem) return null;
    if (menuItem.data?.type) {
        const Element = components['molecule'][String(menuItem.data.type)]
        if (Element) {
            const oElementParams = {
                ...menuItem.data,
                primary: isPrimary,
                params: {
                    ...menuItem.data?.params,
                    button_rounded: menuItem.data?.params?.button_rounded || false,
                    button_full_width: menuItem.data?.params?.button_full_width ?? true,
                    only_icon: menuItem.data?.params?.only_icon || false,
                    on_done: (sAction, oData) => {
                        // Handle action completion
                    },
                },
            };
            return <Element key={menuItem.id || menuItem.name} {...oElementParams} />;
        }
    } else {
        return (
            <NeoButton
                style={isPrimary ? 'borderedProminent' : undefined}
                controlSize="small"
                width="fill"
                image={menuItem.icon || undefined}
                label={menuItem.title || undefined}
                classNames={{ root: 'my-auto' }}
                expoUI={false}
                onPress={menuItem.onPress}
            />
        );
    }
    return null;
}