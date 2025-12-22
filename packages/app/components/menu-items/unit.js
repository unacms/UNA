import { Button } from 'app/design/controls'
import { getComponent } from 'app/components/registry';


export default function MenuItemSubmenu({ menuItem, isPrimary }) {
    if (!menuItem) return null;
    if (menuItem.data?.type) {
        const Element = getComponent('molecule', String(menuItem.data.type))
        if (Element) {
            const oElementParams = {
                ...menuItem.data,
                primary: isPrimary,
                params: {
                    button_rounded: menuItem.data?.params?.button_rounded || false,
                    button_full_width: menuItem.data?.params?.button_full_width || true,
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
            <Button
                variant={isPrimary ? "primary" : "secondary"}
                size="sm"
                fullWidth
                title={menuItem.title}
                className="my-auto"
                startDecorator={menuItem.icon || false}
                onPress={menuItem.onPress}
            />
        );
    }
    return null;
}