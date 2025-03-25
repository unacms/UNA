import { View } from 'app/design/view'
import { Button, Modal } from 'app/design/controls'
import { useCurrentUser } from 'app/context/user'
import { menuItemsByName, appSetting, menuItemsByNameNew } from 'app/lib/util'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { useTranslation } from 'react-i18next';
import { getPageData, getBlocksFromData, getDataForMenu } from 'app/lib/util';
import { useState, useEffect, useMemo } from 'react';
import FormModal, { handleFormModal } from 'app/ui/molecules/form_modal';


export default function MenuAdd({ buttonProps, children }) {
    const { currentUser, setCurrentUser } = useCurrentUser();
    const [pageData, setPageData] = useState(false);
    const [menuData, setMenuData] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            getDataForMenu({ object: appSetting('menu_items', 'objects', 'add'), params: null }, setMenuData);
        };
        fetchData();
    }, []);

    const menu_add_items = appSetting('layout', 'user_remote_config') ? menuItemsByNameNew('menu_post', menuData, currentUser) : menuItemsByName('', appSetting('menu_items', 'menu_add'), currentUser);

    if (menu_add_items.length == 0 && menuData)
        return <></>;

    buttonProps = buttonProps || {
        variant: "secondary",
        rounded: 'rounded',
        startDecorator: "Plus",
        tooltip: "Create",
    };

    return (
        <>
            <FormModal pageData={pageData} setPageData={setPageData} />
            <DropdownMenu
                onSelect={(oItem, event) => handleFormModal(oItem, event, setPageData)}
                items={menu_add_items.map(
                    (item, index) => {
                        return (
                            {
                                id: 'menu-' + index,
                                link: item.link,
                                title: item.title,
                                icon: item.icon
                            }
                        )
                    }
                )}
            >

                {!!children ? children : <Button
                    {...buttonProps}
                />}
            </DropdownMenu>
        </>
    );
}