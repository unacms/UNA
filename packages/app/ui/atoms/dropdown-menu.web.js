import React, { useRef } from 'react';
import { Text } from 'app/design/typography';
import { Pressable, View, Row } from 'app/design/view';
import { Icon } from 'app/ui/atoms/icon';
import Redirect from 'app/ui/atoms/redirect';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { isEmoji } from 'app/lib/util';

const DropdownMenuContentV = (props) => (
    <DropdownMenu.Content
        className="z-10 min-w-[200px] backdrop-blur bg-bgrmodal dark:bg-bgrmodal-d mt-1 p-1 text-sm border dark:border-bdr-d border-bdr rounded-xl shadow-xl overflow-hidden"
        {...props}
    />
);

const DropdownMenuContentH = (props) => (
    <DropdownMenu.Content
        className="flex flex-row z-10 p-1 bg-bgrmodal border border-bdr dark:border-bdr-d m-2 dark:bg-bgrmodal-d text-sm text-neutral-800 dark:text-neutral-200 rounded-full shadow-sm"
        {...props}
    />
);

const DropdownMenuItemV = (props) => (
    <DropdownMenu.Item
        className="flex flex-row focus:outline-none items-center px-3 py-2.5 gap-x-2 text-sm rounded-lg font-medium hover:bg-bgritem dark:hover:bg-bgritem-d text-neutral-700 dark:text-neutral-200 dark:hover:text-white hover:cursor-pointer"
        {...props}
    >
        {props.children}
    </DropdownMenu.Item>
);

const DropdownMenuItemNoPad = (props) => (
    <DropdownMenu.Item
        className="flex flex-row focus:outline-none items-center justify-between px-1 py-0.5 rounded-lg font-medium hover:bg-bgritem dark:hover:bg-bgritem-d text-sm text-neutral-700 dark:text-neutral-200 dark:hover:text-white hover:cursor-pointer"
        {...props}
    >
        {props.children}
    </DropdownMenu.Item>
);

const DropdownMenuItemH = (props) => (
    <DropdownMenu.Item
        className="flex block px-3 py-2 hover:-translate-y-1 active:-translate-y-1 dark:hover:text-white rounded-full hover:cursor-pointer text-neutral-700 active:opacity-50 hover:scale-125 active:scale-95 duration-200 dark:text-neutral-200"
        {...props}
    >
        {props.children}
    </DropdownMenu.Item>
);

export default function DropdownMenuComponent({ variant = 'vertical', defaultOpen, onSelect, items, children }) {
    const redirectdRef = useRef();

    const handleSelect = (oItem) => {
        redirectdRef.current.redirect('' + oItem.link);
    }

    const sVariant = variant || 'vertical';
    const onSelectInt = onSelect || handleSelect;

    const DmContent = (sVariant == 'vertical' || sVariant == 'nopad') ? DropdownMenuContentV : DropdownMenuContentH;
    const DmItem = sVariant == 'vertical' ? DropdownMenuItemV : (sVariant == 'nopad' ? DropdownMenuItemNoPad : DropdownMenuItemH);

    const aDmItems = items.map((oItem) => {
        let sIcon = undefined;
        if (!!oItem?.icon) {
            if (isEmoji(oItem.icon))
                sIcon = <Text className={oItem?.class_item_icon}>{oItem.icon}</Text>;
            else
                sIcon = <Icon className={oItem?.class_item_icon} icon={oItem.icon} />;
        }
        return (
            <DmItem key={oItem.id} onSelect={(event) => !!oItem?.onClick ? oItem?.onClick(oItem, event) : onSelectInt(oItem, event)}>
                <Row className="items-center gap-x-3">
                    {!!sIcon && <Text className="text-xl text-neutral-700 dark:text-neutral-200">{sIcon}</Text>}
                    {!!oItem?.title && <Text className="text-base text-neutral-700 dark:text-neutral-200">{oItem.title}</Text>}
                </Row>
            </DmItem>
        );
    });

    return (
        <View>
            <Redirect ref={redirectdRef} />
            <DropdownMenu.Root defaultOpen={defaultOpen}>
                <DropdownMenu.Trigger className='focus:outline-none' asChild={true}><Pressable onPress={() => { }}>{children}</Pressable></DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                    <DmContent>{aDmItems}</DmContent>
                </DropdownMenu.Portal>
            </DropdownMenu.Root>
        </View>
    );
}

