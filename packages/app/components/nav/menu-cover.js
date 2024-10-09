import { View } from 'app/design/view';
import { Button } from 'app/design/controls'
import DropdownMenu from 'app/ui/atoms/dropdown-menu'
import Menu from 'app/components/menu'
import { useWindowDimensions } from 'react-native'
import { appSetting } from 'app/lib/util'
import { useState } from 'react'
import DropdownPopup from 'app/ui/atoms/dropdown-popup'

export function CoverMenuSmall(props) {
    const [ntfsOpen, setNtfsOpen] = useState(false)
    return (
        <DropdownPopup
            open={ntfsOpen}
            onOpenChange={(bOpen) => {
                setNtfsOpen(bOpen)
            }}
            size="small"
        >
            {[
                <Button
                    key="btn"
                    variant="text"
                    rounded
                    startDecorator="DotsThreeOutline"
                />,
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
                />,
            ]}
        </DropdownPopup>
    )
}

export function CoverMenu(props) {
    let { width } = useWindowDimensions()
    let size = props.size || 'base'

    if (width < 640) size = 'base'

    const isSplitMenu = appSetting('layout', 'split_action_menu')

    let aMenuManageItems = []

    let propsCopy = { ...props } // Create a copy of the array

    if (isSplitMenu) {
        propsCopy.items = propsCopy.items.filter((aItem) => {
            if (aItem?.display_type && aItem.display_type != 'link') {
                return true // Exclude this item from the new array
            } else {
                aMenuManageItems.push({
                    id: aItem.id ? aItem.id : aItem.name,
                    link: '/' + aItem.link,
                    title: aItem.title,
                })

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

    return (
        <>
            <Menu
                {...propsCopy}
                displayType="button"
                autoSize={true}
                params={{
                    show_action: true,
                    show_counter: true,
                    show_combined: true,
                    button_variant: 'default',
                    button_size: size,
                    button_rounded: false,
                    button_full_width: false,
                }}
            />
            {isSplitMenu && propsCopy.items.length > 0 && (
                <View className="ml-2">
                    <DropdownMenu items={aMenuManageItems}>
                        <Button
                            variant="default"
                            size={size}
                            tooltip="Settings"
                            startDecorator="DotsThreeOutline"
                          
                        />
                    </DropdownMenu>
                </View>
            )}
        </>
    )
}

export function CoverMenuMeta(props) {
    return (
        <Menu
            {...props}
            displayType="mixed"
            params={{
                button_variant: 'text',
                button_size: 'sm',
                className: ' lg:flex-wrap ',//lg:w-full lg:gap-y-2
            }}
        />
    )
}