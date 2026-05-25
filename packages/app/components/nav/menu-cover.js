import { NeoButton } from 'app/design/controls'
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
            trigger={<NeoButton
                key="btn"
                image="Ellipsis"
                style="plain"
                controlSize="regular"
                borderShape="circle"
            />}
        >

            <Menu
                key="menu"
                {...props}
                displayType="button"
                params={{
                    showVertical: true,
                    button_style: 'plain',
                    button_size: 'small',
                    button_border_shape: 'capsule',
                    button_content_insets: { x: 0 },
                    button_full_width: false,
                }}
            />

        </DropdownPopup>
    )
}

export function CoverMenu(props) {
    let size = props.size || 'regular'

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
                button_style: 'bordered',
                button_primary_style: 'borderedProminent',
                button_border_shape: 'capsule',
                button_size: size,
                button_full_width: props?.params?.button_full_width ?? false,
                className: 'flex-wrap gap-x-2',
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

   
    const buttonStyle = isDesktop ? 'glass' : 'glass'
    const buttonSize = isDesktop ? 'regular' : 'regular'

    return (
        <Menu
            {...propsCopy}
            displayType="button"
            autoSize={props.autoSize ?? true}
            containerClasses={props.containerClasses}
            allowZeroPersistant={props.allowZeroPersistant}
            params={{
                showVertical:props?.params?.showVertical ?? false,
                show_action: true,
                show_counter: true,
                show_combined: true,
                button_style: buttonStyle,
                button_size: buttonSize,
                button_primary_style: 'glassProminent',
                button_border_shape: 'capsule',
                button_full_width: props?.params?.button_full_width ?? false,
                className: '  gap-2  ',
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
                button_style: 'plain',
                button_size: props.button_size || 'small',
                button_border_shape: 'capsule',
                button_content_insets: { x: 0 },
                
                list_display_size: props.list_display_size || 'xs',
                list_max_count: props.list_max_count || 3,
                list_className: '',
                menu_item_separator: 'dot',
                menu_item_separator_class: 'h-1 w-1 rounded-full bg-muted-foreground/60',
                className: ' gap-3 flex-wrap flex-auto items-center',
                justify_items: 'start'
            }}
        />
    )
}