import { Row, Pressable } from 'app/design/view'
import { Button } from 'app/design/controls'
import { useState, useEffect, useMemo } from 'react'
import { menuItemsByNameNew, cloneObject, appSetting, storageGet, storageSet } from 'app/lib/util'
import { useCurrentUser } from 'app/context/user'
import Profile from 'app/ui/molecules/profile'
import { CardList } from 'app/ui/molecules/card'
import { useTranslation } from 'react-i18next'
import FormModal, { handleFormModal, getFormModal } from 'app/ui/molecules/form_modal';
import { Text, H2 } from 'app/design/typography'
import { View } from 'app/design/view'
import { BlockWrapper } from 'app/components/block-wrapper'
import Tooltip from 'app/ui/molecules/tooltip'

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
            <CardList padding="p-3 lg:p-4" className="flex-row gap-2">
                
                    <Profile {...profileData} displaySize="base" displayType="unit_wo_info" />
                
                
                    <Pressable 
                        className={appSetting('feed', 'post_trigger')}
                        onPress={handleTriggerPress}
                    >
                        <Text className={appSetting('feed', 'post_trigger_text')}>
                            {t('Create new ') + firstForm.title.toLowerCase()}
                        </Text>
                    </Pressable>
                

                <FormModal key={pageData?.ts} pageData={pageData} setPageData={setPageData} />
                {menu_add_items.length > 0 && <Row className="gap-2 flex-none">
                    {menu_add_items.map((item, index) => (
                        <Button key={item.name} size="base" fullWidth variant="secondary" rounded iconOnly onPress={() => handleFormModal(item, null, setPageData, data.params)} startDecorator={item.icon} />
                    ))}
                </Row>}

            </CardList>
        </BlockWrapper>

    )
}
