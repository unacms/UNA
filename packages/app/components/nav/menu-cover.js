import Menu from 'app/components/menu'
import { useState } from 'react'
import DropdownPopup from 'app/ui/atoms/dropdown-popup'
import { useIsDesktop } from 'app/context/measure';
import { View } from 'app/design/view';

// UNA's persons actions menu can return both the adaptive friends connection
// (`profile-friends` — renders "Add friend", then "Friends"/"Unfriend" once
// connected) and a redundant explicit `profile-friend-add` ("Add friend"). For a
// non-friend they render identically, producing a duplicate button. We keep the
// adaptive connection and drop the redundant one. Add pairs here if more surface.
const REDUNDANT_ACTION_WHEN_PRESENT = {
    'profile-friend-add': 'profile-friends',
};

function dropRedundantActions(items, alsoPresentNames = []) {
    const list = Array.isArray(items) ? items : [];
    const present = new Set([...alsoPresentNames, ...list.map((aItem) => aItem.name)]);
    return list.filter((aItem) => {
        const requiredSibling = REDUNDANT_ACTION_WHEN_PRESENT[aItem.name];
        return !(requiredSibling && present.has(requiredSibling));
    });
}

// Partition cover action items into the standalone buttons shown OUTSIDE the "…" menu
// and the OVERFLOW that collapses inside it.
//
// Source of truth is the per-item `persistent` flag (Option A): any item flagged
// `persistent` renders outside, everything else collapses. When the backend sets no
// per-item flags, fall back to the menu-level `persistent` count so the first N items
// still surface outside (keeps the cover usable until the backend marks items).
// Redundant actions (see above) are dropped from each partition.
function splitPersistentItems(items, persistentCount) {
    const list = Array.isArray(items) ? items : [];
    const hasFlags = list.some((aItem) => aItem.persistent);
    const outsideRaw = hasFlags
        ? list.filter((aItem) => aItem.persistent)
        : list.slice(0, Math.max(0, Number(persistentCount) || 0));
    const overflowRaw = hasFlags
        ? list.filter((aItem) => !aItem.persistent)
        : list.slice(Math.max(0, Number(persistentCount) || 0));
    const outside = dropRedundantActions(outsideRaw);
    const overflow = dropRedundantActions(overflowRaw, outside.map((aItem) => aItem.name));
    return { outside, overflow };
}

export function CoverMenuSmall(props) {
    const [ntfsOpen, setNtfsOpen] = useState(false)
    return (
        <DropdownPopup
            open={ntfsOpen}
            onOpenChange={(bOpen) => {
                setNtfsOpen(bOpen)
            }}
            minPopupWidth={320}
            buttonProps={{
                image: 'Ellipsis',
                style: 'plain',
                controlSize: 'regular',
                borderShape: 'circle',
            }}
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
    const isDesktop = useIsDesktop();
    const isSplitMenu = props.isSplitMenu;

    let propsCopy = { ...props } // Create a copy of the array

    if (isSplitMenu) {
        propsCopy.items = splitPersistentItems(propsCopy.items, props.persistent).outside
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

    const buttonStyle = isDesktop ? 'bordered' : 'glass'
    const buttonSize = props.size || (isDesktop ? 'regular' : 'regular')

    return (
        <Menu
            {...propsCopy}
            displayType="button"
            autoSize={!isSplitMenu}
            containerClasses={props.containerClasses}
            params={{
                showVertical:props?.params?.showVertical ?? false,
                show_action: true,
                show_counter: true,
                show_combined: true,
                button_style: buttonStyle,
                button_size: buttonSize,
                button_primary_style: buttonStyle == 'bordered' ? 'borderedProminent' : 'glassProminent',
                button_border_shape: 'capsule',
                button_full_width: props?.params?.button_full_width ?? false,
                className: 'flex-wrap gap-x-2 my-auto ',
                isFixedCount: true,
            }}
        />
    )
}

export function CoverMenuMore(props) {
    const isDesktop = useIsDesktop();
    const isSplitMenu = props.isSplitMenu;

    let propsCopy = { ...props } // Create a copy of the array

    if (isSplitMenu) {
        propsCopy.items = splitPersistentItems(propsCopy.items, props.persistent).overflow
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
        if (!aItem.display_type && aItem.link) {
            return { ...aItem, noAction: true };
        }
        return aItem;
    });

   
    const buttonStyle = isDesktop ? 'bordered' : 'glass'
    const buttonSize = isDesktop ? 'regular' : 'regular'

    return (
        <Menu
            {...propsCopy}
            displayType="button"
            autoSize={props.autoSize ?? true}
            containerClasses={props.containerClasses}
            // In split mode the sibling CoverMenu renders the persistent buttons, so the
            // "more" menu is pure overflow: collapse every (non-persistent) item into "…",
            // 0 inline, consistently on desktop and mobile.
            allowZeroPersistant={isSplitMenu ? true : props.allowZeroPersistant}
            params={{
                showVertical:props?.params?.showVertical ?? false,
                show_action: true,
                show_counter: true,
                show_combined: true,
                button_style: buttonStyle,
                button_size: buttonSize,
                button_primary_style: buttonStyle == 'bordered' ? 'borderedProminent' : 'glassProminent',
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
                button_size: props.button_size || 'regular',
                button_border_shape: 'capsule',
                button_content_insets: { x: 0 },
                
                list_display_size: props.list_display_size || 'xs',
                list_max_count: props.list_max_count || 3,
                list_className: '',
                menu_item_separator: 'dot',
                menu_item_separator_class: 'h-1 w-1 rounded-full bg-muted-foreground/60',
                className: ' gap-3 flex-wrap',
                justify_items: 'start'
            }}
        />
    )
}