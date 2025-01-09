import { View } from 'app/design/view'
import { Button, Modal } from 'app/design/controls'
import { useCurrentUser } from 'app/context/user'
import { menuItemsByName, appSetting } from 'app/lib/util'
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import { useTranslation } from 'react-i18next';
import { getPageData, getBlocksFromData } from 'app/lib/util';
import { useState, useEffect, useMemo } from 'react';
import FormModal, { handleMenuManageSelect } from 'app/ui/molecules/form_modal';

export default function MenuAdd({ buttonProps, children }) {
    const { currentUser, setCurrentUser } = useCurrentUser();
    const menu_add_items = menuItemsByName('', appSetting('menu_items', 'menu_add'), currentUser)
    const [pageData, setPageData] = useState(false);

    const { t } = useTranslation();
    if (menu_add_items.length == 0)
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
                onSelect={(oItem, event) => handleMenuManageSelect(oItem, event, setPageData)}
                items={menu_add_items.map(
                    (item, index) => {
                        return (
                            {
                                id: 'menu-' + index,
                                link: item.link,
                                title: t(item.title),
                                icon:
                                    item.icon.indexOf(' ') == -1
                                        ? item.icon
                                        : item.icon.split(' ')[0],
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