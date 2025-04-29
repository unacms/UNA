import { View, Row, ScrollView, Pressable } from 'app/design/view'
import { Button, Modal } from 'app/design/controls'
import { useState, useContext, useEffect, useCallback, useMemo } from 'react'
import { FeedbackHaptics, getAlert, menuItemsByNameNew, cloneObject } from 'app/lib/util'
import { useCurrentUser } from 'app/context/user'
import Profile from 'app/ui/molecules/profile'
import Card from 'app/ui/molecules/card'
import { useTranslation } from 'react-i18next'
import FormModal, { handleFormModal, getFormModal } from 'app/ui/molecules/form_modal';
import { Text, H2 } from 'app/design/typography'

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
        if (pageDataDef){
            setPageData({...cloneObject(pageDataDef), ts: Date.now()});
        }
        else{
            const a = await getFormModal(firstForm, data.params);
            setPageData({...a.data, ts: Date.now()});
        }
    }

    if (menu_add_items.length == 0 && !firstForm)
       return;
    
    return (
       
            <Card
                rounded=" rounded-none sm:rounded-2xl  "
                margin=" mx-auto mb-2 "
                addClassName=" border-y sm:border  w-full p-[12px] sm:p-[16px]  "
            >
                <View className=" flex-row gap-x-[12px] ">
                    <View className="my-auto">
                        <Profile {...profileData} displaySize="lg" displayType="unit_wo_info" />
                    </View>
                    <View className="flex-auto">
                        <Button
                            size="base"
                            variant="secondary"
                            fullWidth
                            rounded
                            title={t('Create new ') + firstForm.title.toLowerCase()}
                            align="start"
                            onPress={getFirstForm}
                        />
                    </View>
                </View>
                <FormModal key={pageData?.ts} pageData={pageData} setPageData={setPageData} />
                {menu_add_items.length > 0 && <Row className={` w-full gap-x-[8px] sm:flex mt-[12px] sm:pt-[12px] sm:border-t border-bdrcard dark:border-bdrcard-d ' : ''}`}>
                    {menu_add_items.map((item, index) => (
                        <Button key={item.name} size="sm" fullWidth variant="text" onPress={() => handleFormModal(item, null, setPageData, data.params)} startDecorator={item.icon} title={item.title} />
                    ))}
                </Row>}
            </Card>
        
    )
}
