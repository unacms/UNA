import { useRef, useState, useEffect } from 'react';
import { isEmoji } from 'app/lib/util';
import { Text } from 'app/design/typography';
import { Pressable, View, Row } from 'app/design/view';
import React, { memo } from 'react'
import Redirect from 'app/ui/atoms/redirect';
import { Icon } from 'app/ui/atoms/icon'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

const DropdownMenuContentV = (props) => (
    <DropdownMenu.Content
        className="z-10 min-w-[200px] backdrop-blur bg-bgrmodal dark:bg-bgrmodal-d mt-1 divide-y divide-bdr dark:divide-bdr-d text-sm  border dark:border-bdr-d border-bdr rounded-xl shadow-xl overflow-hidden"
        {...props}
    >
        {props.children}
    </DropdownMenu.Content>
);

const DropdownMenuContentH = (props) => (
    <DropdownMenu.Content
        className=" flex flex-row z-10 p-1 bg-bgrmodal border border-bdr dark:border-bdr-d m-2 dark:bg-bgrmodal-d text-sm text-neutral-800 dark:text-neutral-200 rounded-full shadow-sm"
        {...props}
    >
        {props.children}
    </DropdownMenu.Content>
);

const DropdownMenuItemV = (props) => (
    <DropdownMenu.Item
        className=" flex flex-row focus:outline-none items-center p-3 gap-x-3 text-sm font-medium hover:bg-bgritem dark:hover:bg-bgritem-d text-neutral-700 dark:text-neutral-200 dark:hover:text-white hover:cursor-pointer"
        {...props}
    >
        {props.children}
    </DropdownMenu.Item>
);

const DropdownMenuItemNoPad = (props) => (
    <DropdownMenu.Item
        className="flex flex-row focus:outline-none items-center justify-between  hover:bg-bgritem dark:hover:bg-bgritem-d  text-base text-neutral-700 dark:text-neutral-200 dark:hover:text-white hover:cursor-pointer"
        {...props}
    >
        {props.children}
    </DropdownMenu.Item>
);

const DropdownMenuItemH = (props) => (
    <DropdownMenu.Item
        className=" flex focus:outline-none block px-4 p-2 hover:bg-bgritem dark:hover:bg-bgritem-d dark:hover:text-white rounded-full hover:cursor-pointer text-neutral-700 dark:text-neutral-200"
        {...props}
    >
        {props.children}
    </DropdownMenu.Item>
);



export default function ({variant, defaultOpen, onSelect, items, children}) {

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
                sIcon = (
                    <Text className={oItem?.class_item_icon}>{oItem.icon}</Text>
                );
            else
                sIcon = (
                    <Icon className={oItem?.class_item_icon} icon={oItem.icon} />
                );
        }
        return (
            <DmItem key={oItem.id} onSelect={(event) => !!oItem?.onClick ? oItem?.onClick(oItem, event) : onSelectInt(oItem, event)} >
                <Row className='items-center'>
                    {!!sIcon && <Text className="text-xl text-xl text-neutral-700 dark:text-neutral-200 mr-2">{sIcon}</Text>}
                    {!!oItem?.title && <Text className=" text-base text-neutral-700 dark:text-neutral-200 ">{oItem.title}</Text>}
                </Row>
            </DmItem>
        );
    });

    return (
        <View >
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

