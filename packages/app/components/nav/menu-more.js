import { View } from 'app/design/view'
import { menuItemsByName } from 'app/lib/util'
import { useCurrentUser } from 'app/context/user'
import { useMemo } from 'react'
import { Button } from 'app/design/controls'
import DropdownMenu from 'app/ui/atoms/dropdown-menu'
import { getComponent } from 'app/components/registry';

export default function ({ data, oMenuItemsMore, popupVisible, setPopupVisible, defaultButtonProps }) {
    let { currentUser, setCurrentUser } = useCurrentUser()

    //TODO CONNECTIONS AND LINKS LIKE REPORTS AND BUTTON (const isTextMode = oProps.mode === 'text';)
    
    const handleMenuManageSelect = async (oItem, event) => {
    }

    const buttonProps = defaultButtonProps || {
        variant: "outline",
        size: "sm",
        className: " my-auto ",
        startDecorator: "Ellipsis"
    }

    const sDisplayType = 'secondary';
    const aMenuManageItems = !!currentUser ? menuItemsByName(oMenuItemsMore?.object, oMenuItemsMore.items, currentUser).map(
        (aItem) => {
            let sTitle = aItem.title;
            const ItemType = useMemo(() => {
                return getComponent('menu-item', aItem.display_type || sDisplayType);
            }, [aItem.display_type, sDisplayType]);

        
            const a = <ItemType mode="text" key={aItem.id || aItem.name} {...aItem} />
            sTitle = a;


            return {
                id: aItem.id ? aItem.id : aItem.name,
                name: aItem.name,
                link: aItem.link,
                title: sTitle,
            }
        }
    ) : []

    return (
        <DropdownMenu items={aMenuManageItems} defaultOpen={false} onSelect={handleMenuManageSelect}>
            <View className=''>
                <Button
                    {...buttonProps}
                    startDecorator="Ellipsis"
                />
            </View>
        </DropdownMenu>

    );
}
/*

 const handleClickMore = (event) => {
        event.preventDefault();
        FeedbackHaptics("Medium");
        setPopupVisible(true);
    };

return (
        <View className='ml-2'>
            <Button
               {...buttonProps}
                onPress={(event) =>
                    handleClickMore(event)
                }
            />
            <Modal
                key="more-popup"
                onVisible={popupVisible}
                title={data.title}
                onClose={() => {
                    setPopupVisible(false);
                }}
            >
                <View className='p-4 sm:p-0'>
                    <Menu
                        displayType="mixed"
                        {...oMenuItemsMore}
                    />
                </View>
            </Modal>
        </View>
    );*/

    