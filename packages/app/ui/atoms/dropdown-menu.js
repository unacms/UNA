import { useRef } from 'react';

import { Button } from 'app/design/controls';
import { View } from 'app/design/view';
import { 
    DropdownMenuRoot, 
    DropdownMenuContentV, 
    DropdownMenuTrigger, 
    DropdownMenuItemV, 
    DropdownMenuItemTitle
} from 'app/design/dropdown';
import Redirect from 'app/ui/atoms/redirect';

export default function DropdownMenu(oProps) {
    const redirectdRef = useRef();

    const sVariant = oProps.variant ? oProps.variant : 'vertical';

    const DmContent = sVariant == 'vertical' ? DropdownMenuContentV : DropdownMenuContentH;
    const DmItem = sVariant == 'vertical' ? DropdownMenuItemV : DropdownMenuItemH;

    const handleClick = (sUrl) => {
        redirectdRef.current.redirect(sUrl);
    }

    const aDmItems = oProps.items.map((oItem) => {
        return (
            <DmItem key={oItem.id} onSelect={() => handleClick(oItem.link)}>
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
