import { Button } from 'app/design/controls'
import Menu from 'app/components/menu'
import { useState } from 'react'
import DropdownPopup from 'app/ui/atoms/dropdown-popup'
import { useIsDesktop } from 'app/context/measure';
import { View } from 'app/design/view';

export function CoverMenuSmall(props) {
    const [ntfsOpen, setNtfsOpen] = useState(false)
    return (
        <DropdownPopup
            open={ntfsOpen}
            onOpenChange={(bOpen) => {
                setNtfsOpen(bOpen)
            }}
            minPopupWidth={320}
            trigger={<Button
                key="btn"
                variant="text"
                size="base"
                rounded
                startDecorator="Ellipsis"
            />}
        >

            <Menu
                key="menu"
                {...props}
                displayType="button"
                params={{
                    showVertical: true,
                    button_variant: 'text',
                    button_rounded: false,
                    button_full_width: false,
                }}
            />

        </DropdownPopup>
    )
}

export function CoverMenu(props) {
    let size = props.size || 'base'

    const isSplitMenu = props.isSplitMenu;

    let propsCopy = { ...props } // Create a copy of the array

    if (isSplitMenu) {
        propsCopy.items = propsCopy.items.filter((aItem) => {
            if (aItem.persistent) {
                return true // Exclude this item from the new array
            } else {
                
                return false // Include this item in the new array
            }
        })
    } else {
        propsCopy.items = propsCopy.items.filter((aItem) => {
            if (aItem.name != props.uri) {
                return true // Exclude this item from the new array
            } else {
                return false // Include this item in the new array
            }
        })
    }

    
    propsCopy.items = propsCopy.items.map((aItem) => {
        if (
            aItem.name.includes('delete-') || 
            aItem.name.includes('edit-') || 
            aItem.name?.includes('join-') ||
            aItem.name?.includes('-pricing') ||
            aItem.name?.includes('-sessions') ||
            aItem.name?.includes('-questionnaire')
        ) {
            return { ...aItem, noAction: true };
        }
        return aItem;
    });

    return (
        <View><Menu
            {...propsCopy}
            displayType="button"
            autoSize={!isSplitMenu}
            containerClasses={props.containerClasses}
            params={{
                showVertical:props?.params?.showVertical ?? false,
                show_action: true,
                show_counter: true,
                show_combined: true,
                button_variant: 'secondary',
                button_size: size,
                button_rounded: false,
                button_full_width: props?.params.button_full_width ?? false,
                className: 'flex-wrap',
                isFixedCount: true,
            }}
        /></View>
    )
}

export function CoverMenuMore(props) {
    const isDesktop = useIsDesktop();
    const isSplitMenu = props.isSplitMenu;

    let propsCopy = { ...props } // Create a copy of the array

    if (isSplitMenu) {
        propsCopy.items = propsCopy.items.filter((aItem) => {
            if (aItem.persistent) {
                return false // Exclude this item from the new array
            } else {
                
                return true // Include this item in the new array
            }
        })
    } else {
        propsCopy.items = propsCopy.items.filter((aItem) => {
            if (aItem.name != props.uri) {
                return true // Exclude this item from the new array
            } else {
                return false // Include this item in the new array
            }
        })
    }

    
    propsCopy.items = propsCopy.items.map((aItem) => {
        if (
            aItem.name.includes('delete-') || 
            aItem.name.includes('edit-') || 
            aItem.name?.includes('join-') ||
            aItem.name?.includes('-pricing') ||
            aItem.name?.includes('-sessions') ||
            aItem.name?.includes('-questionnaire')
        ) {
            return { ...aItem, noAction: true };
        }
        return aItem;
    });

   
    const buttonVariant = isDesktop ? 'secondary' : 'text'
    const buttonSize = isDesktop ? 'base' : 'base'

    return (
        <Menu
            {...propsCopy}
            displayType="button"
            autoSize={props.autoSize ?? true}
            containerClasses={props.containerClasses}
            params={{
                showVertical:props?.params?.showVertical ?? false,
                show_action: true,
                show_counter: true,
                button_rounded: true,
                show_combined: true,
                button_variant: buttonVariant,
                button_size: buttonSize,
                button_full_width: props?.params?.button_full_width ?? false,
                className: 'flex-wrap justify-end gap-x-2',
                isFixedCount: true,
            }}
        />
    )
}

export function CoverMenuMeta(props) {
    return (
        <Menu
            {...props}
            displayType="mixed"
            params={{
                button_variant: 'secondary',
                button_size: 'sm',
                className: ' min-h-10 flex-row flex-wrap flex-auto items-center',//lg:w-full lg:gap-y-2
                justify_items: 'start'
            }}
        />
    )
}