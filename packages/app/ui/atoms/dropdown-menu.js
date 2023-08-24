import { useRef } from 'react';
import { Platform } from 'react-native';
import { isEmoji } from 'app/lib/util';
import { Text } from 'app/design/typography';
import { View } from 'app/design/view';
import { 
    DropdownMenuRoot, 
    DropdownMenuContentV, 
    DropdownMenuContentH, 
    DropdownMenuTrigger, 
    DropdownMenuItemV, 
    DropdownMenuItemH, 
    DropdownMenuItemTitle,
    DropdownMenuItemIcon
} from 'app/design/dropdown';
import Redirect from 'app/ui/atoms/redirect';
import { Icon } from 'app/ui/atoms/icon'
import { connect } from './socket';

export default function DropdownMenu(oProps) {
    const redirectdRef = useRef();
    const bWeb = Platform.OS === 'web';

    const handleSelect = (oItem) => {

        redirectdRef.current.redirect('' + oItem.link);
    }

    const sVariant = !!oProps?.variant ? oProps.variant : 'vertical';
    const onSelect = oProps?.onSelect ? oProps.onSelect : handleSelect;

    const DmContent = sVariant == 'vertical' ? DropdownMenuContentV : DropdownMenuContentH;
    const DmItem = sVariant == 'vertical' ? DropdownMenuItemV : DropdownMenuItemH;   

    const aDmItems = oProps.items.map((oItem) => {
        let sIcon = undefined;
        if(!!oItem?.icon) {
            if(isEmoji(oItem.icon))
                sIcon = (
                    <Text className={oItem?.class_item_icon}>{oItem.icon}</Text>
                );
            else
                sIcon = (
                    <Icon className={oItem?.class_item_icon} icon={oItem.icon} />
                );
        }

        return (
            <DmItem key={oItem.id} onSelect={(event) => !!oItem?.onClick ? oItem?.onClick(oItem, event) : onSelect(oItem, event)} {...(bWeb ? {className: oItem?.class_item} : {})}>
                {!!sIcon && <DropdownMenuItemIcon>{sIcon}</DropdownMenuItemIcon>}
                {!!oItem?.title && <DropdownMenuItemTitle {...(bWeb ? {className: oItem?.class_item_title} : {})}>{oItem.title}</DropdownMenuItemTitle>}
            </DmItem>
        );
    });

    return (
        <View >
            <Redirect ref={redirectdRef} />
            <DropdownMenuRoot >
                <DropdownMenuTrigger data-state='open'>{oProps.children}</DropdownMenuTrigger>
                <DmContent>{aDmItems}</DmContent>
            </DropdownMenuRoot>
        </View>
    );
}
