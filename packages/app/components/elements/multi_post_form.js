import { Row, View } from 'app/design/view'
import { NeoButton } from 'app/design/controls'
import { useState, useEffect, useMemo } from 'react'
import { menuItemsByNameNew, cloneObject } from 'app/lib/util'
import { useCurrentUser } from 'app/context/user'
import Profile from 'app/ui/molecules/profile/profile'
import { CardList } from 'app/ui/molecules/page/card'
import { useTranslation } from 'react-i18next'
import FormModal, { handleFormModal, getFormModal } from 'app/ui/molecules/dialogs/form_modal';
import { BlockWrapper } from 'app/components/block-wrapper'

export default function MultiPostForm({ data, blockWrapperProps }) {
    const { currentUser } = useCurrentUser();
    const { t } = useTranslation()
    const [pageData, setPageData] = useState(false);
    const [pageDataDef, setPageDataDef] = useState(false);
    const menu_add_items = menuItemsByNameNew('', data.menu, currentUser).filter(item => item.name != 'more-auto');

    const firstForm = menu_add_items.shift();

    const profileData = useMemo(() => ({
        ...currentUser,
        url_avatar: currentUser.avatar,
        url: null,
    }));

    useEffect(() => {
        const fetchData = async () => {
            const sResponse = await getFormModal(firstForm, data.params);
            setPageDataDef(sResponse.data);
        };
        fetchData();
    }, []);

    // Show tooltip after configured delay on first feed visit
    // Keep showing until user opens the post form


    const getFirstForm = async () => {
        if (pageDataDef) {
            setPageData({ ...cloneObject(pageDataDef), ts: Date.now() });
        }
        else {
            const a = await getFormModal(firstForm, data.params);
            setPageData({ ...a.data, ts: Date.now() });
        }
    }

    if (menu_add_items.length == 0 && !firstForm)
        return;



    const handleTriggerPress = () => {
        // User clicked to create post - permanently dismiss tooltip

        getFirstForm();
    };

    return (
        <BlockWrapper {...blockWrapperProps}>
            <CardList className="flex-row items-center gap-2 min-w-0">
                <View className="flex-none">
                    <Profile {...profileData} displaySize="base" displayType="unit_wo_info" />
                </View>
                <NeoButton
                    style="bordered"
                    borderShape="capsule"
                    controlSize="regular"
                    classNames={{ root: 'flex-1 min-w-0 h-10', container: 'w-full min-w-0 h-10' }}
                    align="start"
                    label={t('Create new ') + firstForm.title.toLowerCase()}
                    onPress={handleTriggerPress}
                />

                <FormModal key={pageData?.ts} pageData={pageData} setPageData={setPageData} />
                {menu_add_items.length > 0 && <Row className="gap-2 flex-none">
                    {menu_add_items.map((item, index) => (
                        <NeoButton key={item.name} style="borderless" borderShape="roundedRectangle" controlSize="regular" onPress={() => handleFormModal(item, null, setPageData, data.params)} image={item.icon} />
                    ))}
                </Row>}

            </CardList>
        </BlockWrapper>

    )
}
