import { use } from 'react';
import { NeoButton } from 'app/design/controls'
import { View } from 'app/design/view'
import { Text } from 'app/design/typography'
import { components } from 'app/components/registry';
import { UnitActionWidthContext, useUnitActionHugs } from 'app/components/units/unit-action-width';


export default function MenuItemSubmenu({ menuItem, isPrimary }) {
    // Profile rows on phones: a compact button on the right (unit-action-width.js).
    const hugs = useUnitActionHugs();
    // A profile row on a phone has room for one labelled button next to the name: the second one (Follow
    // beside Add friend) shows its icon alone below `sm`, and its label again in the card grid.
    const iconOnlyOnPhones = !isPrimary && use(UnitActionWidthContext) === 'compact-mobile';
    if (!menuItem) return null;
    // Not an action: a slot the size of a button with a dashed outline ("You" on the viewer's own card), so the
    // card is as tall as its neighbours with two buttons, and its phone row ends as theirs do.
    if (menuItem.note) {
        return (
            <View className="min-h-9 sm:w-full flex-row items-center justify-center rounded-control-sm border border-dashed border-border px-3">
                <Text numberOfLines={1} className="text-sm font-semibold text-secondary-foreground">
                    {menuItem.title}
                </Text>
            </View>
        );
    }
    if (menuItem.data?.type) {
        const Element = components['molecule'][String(menuItem.data.type)]
        if (Element) {
            const oElementParams = {
                ...menuItem.data,
                primary: isPrimary,
                params: {
                    ...menuItem.data?.params,
                    button_rounded: menuItem.data?.params?.button_rounded || false,
                    button_full_width: hugs ? false : (menuItem.data?.params?.button_full_width ?? true),
                    only_icon: menuItem.data?.params?.only_icon || false,
                    ...(iconOnlyOnPhones && !menuItem.data?.params?.button_show_title_from_size
                        ? { button_show_title_from_size: 'sm' }
                        : null),
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
                width={hugs ? undefined : 'fill'}
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