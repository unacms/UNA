import { use } from 'react';
import { NeoButton } from 'app/design/controls'
import { View } from 'app/design/view'
import { Text } from 'app/design/typography'
import { components } from 'app/components/registry';
import { UnitActionWidthContext, useUnitActionHugs } from 'app/components/units/unit-action-width';


/**
 * Not an action: a slot the size of a button with a dashed outline ("You" on the viewer's own card), so the card is
 * as tall as its neighbours with two buttons, and its phone row ends as theirs do.
 */
function UnitActionNote({ title }) {
    return (
        <View className="min-h-9 sm:w-full flex-row items-center justify-center rounded-control-sm border border-dashed border-border px-3">
            <Text numberOfLines={1} className="text-sm font-semibold text-secondary-foreground">
                {title}
            </Text>
        </View>
    );
}

/** The params of a card's element button (a connection, a suggestion's action). */
function elementParams(params, { hugs, iconOnlyOnPhones }) {
    const result = {
        ...params,
        button_rounded: params?.button_rounded || false,
        button_full_width: hugs ? false : (params?.button_full_width ?? true),
        only_icon: params?.only_icon || false,
        on_done: () => {
            // Handle action completion
        },
    };
    if (iconOnlyOnPhones && !params?.button_show_title_from_size) {
        result.button_show_title_from_size = 'sm';
    }
    return result;
}

export default function MenuItemSubmenu({ menuItem, isPrimary }) {
    // Profile rows on phones: a compact button on the right (unit-action-width.js).
    const hugs = useUnitActionHugs();
    // A profile row on a phone has room for one labelled button next to the name: the second one (Follow
    // beside Add friend) shows its icon alone below `sm`, and its label again in the card grid.
    const iconOnlyOnPhones = !isPrimary && use(UnitActionWidthContext) === 'compact-mobile';
    if (!menuItem) return null;
    if (menuItem.note) return <UnitActionNote title={menuItem.title} />;

    if (menuItem.data?.type) {
        const Element = components['molecule'][String(menuItem.data.type)]
        if (!Element) return null;
        return (
            <Element
                key={menuItem.id || menuItem.name}
                {...menuItem.data}
                primary={isPrimary}
                params={elementParams(menuItem.data.params, { hugs, iconOnlyOnPhones })}
            />
        );
    }

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
