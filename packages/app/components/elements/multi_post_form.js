import { View, Row, ScrollView } from 'app/design/view'
import { Button, Modal } from 'app/design/controls'
import { useState, useContext, useEffect, useCallback } from 'react'
import { FeedbackHaptics, getAlert, menuItemsByName, appSetting } from 'app/lib/util'
import { useCurrentUser } from 'app/context/user'
import Profile from 'app/ui/molecules/profile'
import Card from 'app/ui/molecules/card'
import { useTranslation } from 'react-i18next'
import FormModal, { handleFormModal, getFormModal } from 'app/ui/molecules/form_modal';

export default function MultiPostForm({ data }) {
    const { currentUser } = useCurrentUser();
    const { t } = useTranslation()
    const [pageData, setPageData] = useState(false);
    const [pageDataDef, setPageDataDef] = useState(false);
    const menu_add_items = menuItemsByName('menu_post', data.menu.items, currentUser);
    if (menu_add_items.length == 0)
        return;

    const firstForm = menu_add_items.shift();

    const profileData = {
        ...currentUser,
        url_avatar: currentUser.avatar,
        url: null,
    };

    useEffect(() => {
        const fetchData = async () => {
            const sResponse = await getFormModal(firstForm, data.params);
            setPageDataDef(sResponse.data);
        };
        fetchData();
    }, []);

    return (
        <View className="w-full">
            <Card
                rounded=" rounded-none sm:rounded-2xl  "
                margin=" mx-auto mb-1 sm:mb-3 "
                addClassName=" shadow-sm  w-full max-w-2xl px-[12px] pt-[8px] pb-[12px] sm:p-[16px]  "
            >
                <View className=" flex-row gap-x-[8px] ">
                    <View className="my-auto">
                        <Profile {...profileData} displaySize="base" displayType="unit_wo_info" />
                    </View>
                    <View className="flex-auto">
                        <Button
                            size="base"
                            variant="secondary"
                            fullWidth
                            rounded
                            title={t('Create new ') + '...'}
                            align="start"
                            onPress={() => {
                                FeedbackHaptics('Medium')
                                setPageData(pageDataDef)
                            }}
                        />
                    </View>
                </View>
                <FormModal pageData={pageData} setPageData={setPageData} />
                <Row className={` justify-between gap-x-[8px] hidden sm:flex mt-[12px] sm:mt-[12px] sm:pt-[12px] border-t border-bdr dark:border-bdr-d ' : ''}`}>
                    {menu_add_items.map((item, index) => (
                        <Button key={item.name} size="base" rounded fullWidth variant="secondary" onPress={() => handleFormModal(item, null, setPageData, data.params)} startDecorator={item.icon} title={item.title} />
                    ))}
                </Row>
            </Card>
        </View>
    )
}
