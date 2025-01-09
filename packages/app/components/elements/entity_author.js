import { getAlert, getPageData } from 'app/lib/util';
import { useCurrentUser } from 'app/context/user';
import { Button } from 'app/design/controls';
import { View, Row } from 'app/design/view';
import Time from 'app/ui/atoms/time';
import Profile from 'app/ui/molecules/profile';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import Link from 'app/ui/atoms/link'
import { Text } from 'app/design/typography'
import { fetcher } from 'app/lib/fetcher'
import Redirect from 'app/ui/atoms/redirect'
import { useRef, useState, useEffect } from 'react';
import useSWR from 'swr'
import { Modal } from 'app/design/controls'
import { useTranslation } from 'react-i18next';
import Form from 'app/components/elements/form'
import { useLayoutData } from 'app/context/layout';
import FormModal, { handleMenuManageSelect as handleMenuManageSelectModal } from 'app/ui/molecules/form_modal';

export default function ElementEntityAuthor(oProps) {
    let { currentUser, setCurrentUser } = useCurrentUser();
    const [viewState, setViewState] = useState({ view: '' })
    const [postData, setPostData] = useState(null)
    const { setLayoutData } = useLayoutData()
    const { t } = useTranslation();
    const [pageData, setPageData] = useState(false);

    const sInfo = (
        <Row className='items-center '>
            <Time ts={oProps.data.entry_date}></Time>
            {
                !!oProps.data?.entry_context?.id && (

                    <>
                        <Text className=" text-neutral-500 dark:text-neutral-400 font-normal text-sm "> in </Text>
                        <Text className=" text-neutral-500 dark:text-neutral-400 font-normal text-sm ">
                            <Link href={oProps.data.entry_context.url}><Text className=" text-neutral-500 dark:text-neutral-400 font-normal text-sm ">{oProps.data.entry_context.display_name}</Text></Link>
                        </Text>
                    </>

                )}
        </Row>
    );

    let handleMenuManageSelect = false

    const item_id = oProps?.data?.entry_id;
    const redirectdRef = useRef();

    const { data: dynamicData, error } = useSWR(
        postData ? ['/api.php?r=bx_timeline/get_edit_form/&params[]=' + item_id, '', postData] : null,
        fetcher,
        !true ? undefined : { revalidateIfStale: false, revalidateOnFocus: false, revalidateOnReconnect: false }
    )

    useEffect(() => {
        if (dynamicData?.data?.item) {
            setLayoutData(getAlert('feed_item:content', dynamicData.data.item));
        }
    }, [dynamicData?.data?.item]);


    const onFormSubmit = (formData, d) => {
        setViewState({ view: '' })
        setPostData(formData);

    }

    let aMenuManageItems = [];
    if (!!currentUser && oProps?.data?.menu_manage?.items) {
        oProps.data.menu_manage.items.forEach((aItem) => {
            if (aItem?.display_type && (aItem.display_type != 'link' && aItem.name != 'report'))
                return;

            aMenuManageItems.push({
                id: aItem.id ? aItem.id : aItem.name,
                link: '/' + aItem.link,
                name: aItem.name,
                title: aItem?.title ? aItem?.title : ''
            });
        });
    }

    aMenuManageItems = aMenuManageItems.filter((item) => (item.title != ''))
    
    if (oProps?.data?.menu_manage?.object == 'bx_timeline_menu_item_manage') {
        handleMenuManageSelect = async (oItem, event) => {
           
            switch (oItem.name) {
                case 'item-edit':
                    const oResultEdit = await fetcher(
                        '/api.php?r=bx_timeline/get_edit_form/&params[]=' + item_id
                    )
                    setViewState({ view: 'edited', data: oResultEdit.data.form })
                    break

                case 'item-delete':
                    const oResultDeleted = await fetcher(
                        '/api.php?r=bx_timeline/delete/&params[]=' + item_id
                    )
                    redirectdRef.current.redirect('/');
                    break
            }
        }
    }
    else{
        handleMenuManageSelect = handleMenuManageSelectModal;
    }

    const menuOptions = handleMenuManageSelect ? { onSelect: (oItem, event) => handleMenuManageSelect(oItem, event, setPageData) } : {};

    return (
        <View className={false ? "mx-auto w-full max-w-5xl flex-row justify-between pt-4 px-4 sm:rounded-t-lg bg-bgrcard dark:bg-bgrcard-d sm:border-t  sm:m-0 border-bdr dark:border-bdr-d sm:border-x" : " w-full items-center flex-row justify-between  "}>
            <FormModal pageData={pageData} setPageData={setPageData} />
            <Redirect ref={redirectdRef} />
            {viewState.view == 'edited' && (<Modal
                title={t("Edit post")}
                onVisible={true}
                onClose={() => {
                    setViewState({ view: '' })
                }}

                transparent={true}
                headerBorder={true}
            >

                <Form
                    {...viewState.data}
                    classContainerName="flex-row flex-wrap px-2 w-full items-start justify-between"
                    onFormSubmit={onFormSubmit}
                />

            </Modal>)
            }

            <View className={oProps.data.text ? '' : 'flex-auto'}><Profile {...oProps.data.author_data} displayType="unit" displaySize="base" showInfo={sInfo} /></View>
            {(oProps.data.text && false) && (
                <View className='flex-auto overflow-hidden text-ellipsis w-1/2 lg:w-auto px-4'>
                    <Link href={oProps.data.url}>
                        <Text className=" lg:text-center overflow-hidden text-ellipsis text-lg font-bold font-bold  text-neutral-900 dark:text-neutral-50 overflow" numberOfLines={2}>
                            {oProps.data.text}
                        </Text>
                    </Link>
                </View>
            )
            }
            <View>
                {aMenuManageItems.length > 0 &&
                    <DropdownMenu items={aMenuManageItems} {...menuOptions}>
                        <Button variant="text" rounded="true" startDecorator="DotsThreeOutline" />
                    </DropdownMenu>
                }
            </View>
        </View>
    );
}