import { useRef } from 'react';

import { Button } from 'app/design/controls';
import { View } from 'app/design/view';
import { 
    DropdownMenuRoot, 
    DropdownMenuContentV, 
    DropdownMenuTrigger, 
    DropdownMenuItemV, 
    DropdownMenuItemTitle,
    DropdownMenuItemIcon
} from 'app/design/dropdown';
import Redirect from 'app/ui/atoms/redirect';
import { Icon } from 'app/ui/atoms/icon'

export default function DropdownMenu(oProps) {
    const redirectdRef = useRef();

    const handleSelect = (oItem) => {
        redirectdRef.current.redirect(oItem.link);
    }

    const sVariant = !!oProps?.variant ? oProps.variant : 'vertical';
    const onSelect = oProps?.onSelect ? oProps.onSelect : handleSelect;

    const DmContent = sVariant == 'vertical' ? DropdownMenuContentV : DropdownMenuContentH;
    const DmItem = sVariant == 'vertical' ? DropdownMenuItemV : DropdownMenuItemH;   

    const aDmItems = oProps.items.map((oItem) => {
        return (
            <DmItem key={oItem.id} onSelect={() => !!oItem?.onClick ? oItem?.onClick(oItem) : onSelect(oItem)}>
                {!!oItem.icon && <DropdownMenuItemIcon><Icon icon={oItem.icon} /></DropdownMenuItemIcon>}
                <DropdownMenuItemTitle>{oItem.title}</DropdownMenuItemTitle>
            </DmItem>
        );
    });

    return (
        <View>
            <Redirect ref={redirectdRef} />
            <DropdownMenuRoot>
                <DropdownMenuTrigger>{oProps.children}</DropdownMenuTrigger>
                <DmContent>{aDmItems}</DmContent>
            </DropdownMenuRoot>
        </View>
    );
}
