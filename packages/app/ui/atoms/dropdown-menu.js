import { useRef, useState,useEffect } from 'react';
import { Platform } from 'react-native';
import { isEmoji } from 'app/lib/util';
import { Text } from 'app/design/typography';
import { View } from 'app/design/view';
/*import { 
    DropdownMenuRoot, 
    DropdownMenuContentV, 
    DropdownMenuContentH, 
    DropdownMenuTrigger, 
    DropdownMenuItemV, 
    DropdownMenuItemH, 
    DropdownMenuItemTitle,
    DropdownMenuItemIcon
} from 'app/design/dropdown';
*/
import Redirect from 'app/ui/atoms/redirect';
import { Icon } from 'app/ui/atoms/icon'

export default function DropdownMenu(oProps) {

    const [DropdownMenu, setDropdownMenu] = useState(null);
    
    useEffect(() => {
        const loadComponents = async () => {
            const DropdownMenu = await import('app/design/dropdown');
            setDropdownMenu(() => DropdownMenu);
        };

        loadComponents();
    }, []);

    const redirectdRef = useRef();

    if (!DropdownMenu) {
        return null; // or return a loading spinner
    }

    const bWeb = Platform.OS === 'web';

    const handleSelect = (oItem) => {
        redirectdRef.current.redirect('' + oItem.link);
    }

    const sVariant = !!oProps?.variant ? oProps.variant : 'vertical';
    const onSelect = oProps?.onSelect ? oProps.onSelect : handleSelect;

    const DmContent = sVariant == 'vertical' ? DropdownMenu.DropdownMenuContentV : DropdownMenu.DropdownMenuContentH;
    const DmItem = sVariant == 'vertical' ? DropdownMenu.DropdownMenuItemV : DropdownMenu.DropdownMenuItemH;   

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
                {!!sIcon && <DropdownMenu.DropdownMenuItemIcon>{sIcon}</DropdownMenu.DropdownMenuItemIcon>}
                {!!oItem?.title && <DropdownMenu.DropdownMenuItemTitle {...(bWeb ? {className: oItem?.class_item_title} : {})}>{oItem.title}</DropdownMenu.DropdownMenuItemTitle>}
                {( false && bWeb && oItem.indicator && !oItem.indicator.variant) && <DropdownMenu.DropdownMenuItemSubtitle>{ oItem.indicator }</DropdownMenu.DropdownMenuItemSubtitle>}
                {(false &&  bWeb && oItem.indicator && oItem.indicator.variant) && <DropdownMenu.DropdownMenuItemSubtitleRed>{ oItem.indicator.text }</DropdownMenu.DropdownMenuItemSubtitleRed>}
            </DmItem>
        );
    });

    return (
        <View >
            <Redirect ref={redirectdRef} />
            <DropdownMenu.DropdownMenuRoot >
                <DropdownMenu.DropdownMenuTrigger data-state='open'>{oProps.children}</DropdownMenu.DropdownMenuTrigger>
                <DmContent>{aDmItems}</DmContent>
            </DropdownMenu.DropdownMenuRoot>
        </View>
    );
}
