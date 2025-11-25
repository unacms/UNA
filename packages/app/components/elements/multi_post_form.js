import { View, Row, ScrollView, Pressable } from 'app/design/view'
import { Button, Modal } from 'app/design/controls'
import { useState, useContext, useEffect, useCallback, useMemo } from 'react'
import { FeedbackHaptics, getAlert, menuItemsByNameNew, cloneObject, appSetting } from 'app/lib/util'
import { useCurrentUser } from 'app/context/user'
import Profile from 'app/ui/molecules/profile'
import { CardList } from 'app/ui/molecules/card'
import { useTranslation } from 'react-i18next'
import FormModal, { handleFormModal, getFormModal } from 'app/ui/molecules/form_modal';
import { Text, H2 } from 'app/design/typography'
import { cd } from 'app/lib/util'

export default function MultiPostForm({ data }) {
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

    return (

        <CardList className="flex-row gap-2 lg:gap-3">
            <Profile {...profileData} displaySize="base" displayType="unit_wo_info" />
              
                    <Pressable 
                        onPress={getFirstForm}
                        className={`${appSetting('feed', 'post_trigger')}`}
                    >
                        <Text>{t('Create new ') + firstForm.title.toLowerCase()}</Text>
                    </Pressable>
            
            <FormModal key={pageData?.ts} pageData={pageData} setPageData={setPageData} />
            {menu_add_items.length > 0 && <Row className={` ${cd('gap-sm')} flex-none`}>
                {menu_add_items.map((item, index) => (
                    <Button key={item.name} size="base" fullWidth variant="secondary" rounded iconOnly onPress={() => handleFormModal(item, null, setPageData, data.params)} startDecorator={item.icon}  />
                ))}
            </Row>}
            
        </CardList>

    )
}
