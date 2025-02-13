import React, { useRef, forwardRef } from 'react';
import { Text } from 'app/design/typography';
import { Pressable, View, Row } from 'app/design/view';
import { Icon } from 'app/ui/atoms/icon';
import Redirect from 'app/ui/atoms/redirect';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { isEmoji, appSetting } from 'app/lib/util';


const menuSettings = appSetting('theme', 'dropdown_menu');

const DropdownMenuContentV = forwardRef((props, ref) => (
    <DropdownMenu.Content
        ref={ref}
        className={menuSettings.content_ver}
        {...props}
    />
));

const DropdownMenuContentH = (props) => (
    <DropdownMenu.Content
        className={menuSettings.content_hor}
        {...props}
    />
);

const DropdownMenuItemV = (props) => (
    <DropdownMenu.Item
        className={menuSettings.item_ver}
        {...props}
    >
        {props.children}
    </DropdownMenu.Item>
);

const DropdownMenuItemNoPad = (props) => (
    <DropdownMenu.Item
        className={menuSettings.item_np}
        {...props}
    >
        {props.children}
    </DropdownMenu.Item>
);

const DropdownMenuItemH = (props) => (
    <DropdownMenu.Item
        className={menuSettings.item_hor}
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

    const aDmItems = items.map((oItem, index) => {
        const key = oItem.id || index; 
        let sIcon = undefined;
        if (!!oItem?.icon) {
            if (isEmoji(oItem.icon))
                sIcon = <Text className={oItem?.class_item_icon}>{oItem.icon}</Text>;
            else
                sIcon = <Icon className={oItem?.class_item_icon} icon={oItem.icon} />;
        }

        return (
            <DmItem key={key} onSelect={(event) => !!oItem?.onClick ? oItem?.onClick(oItem, event) : onSelectInt(oItem, event)}>
                <Row className={menuSettings.item_cnt}>
                    {!!sIcon && <Text className={menuSettings.item_icon}>{sIcon}</Text>}
                    {!!oItem?.title && (typeof oItem?.title === 'string' ? <Text className={menuSettings.item_text}>{oItem.title}</Text> : oItem.title)}
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

