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
//import use-SWR from 'swr'
import useFetchForm from 'app/lib/hooks/fetch'
import { Modal } from 'app/design/controls'
import { useTranslation } from 'react-i18next';
import Form from 'app/components/elements/form'
import { useLayoutData } from 'app/context/layout';
import FormModal, { handleFormModal } from 'app/ui/molecules/form_modal';
import { LAYOUT_BREAKPOINTS } from 'app/lib/util'
import { useWindowDimensions } from 'react-native';

export default function ElementEntityAuthor(oProps) {
    let { currentUser, setCurrentUser } = useCurrentUser();
    const [viewState, setViewState] = useState({ view: '' })
    const [postData, setPostData] = useState(null)
    const { setLayoutData } = useLayoutData()
    const { t } = useTranslation();
    const [pageData, setPageData] = useState(false);
    const windowWidth = useWindowDimensions().width;

    const sInfo = (
        <Row className='items-center '>
            <Time ts={oProps.data.entry_date}></Time>
            {
                !!oProps.data?.entry_context?.id && (

                    <>
                        <Text className=" text-neutral-600 dark:text-neutral-400 font-medium text-sm "> in </Text>
                        <Profile {...oProps.data.entry_context} displayType="unit_wo_info" displaySize="xxs" />
                        <Text className=" text-neutral-600 dark:text-neutral-400 leading-6 font-medium text-sm ">
                            <Link href={oProps.data.entry_context.url}><Text className="ml-0.5 text-neutral-600 dark:text-neutral-400 font-medium text-xs ">{oProps.data.entry_context.display_name}</Text></Link>
                        </Text>
                    </>

                )}
        </Row>
    );

    let handleMenuManageSelect = false

    const item_id = oProps?.data?.entry_id;
    const redirectdRef = useRef();

    /*const { data: dynamicData, error } = useSWR(
        postData ? ['/api.php?r=bx_timeline/get_edit_form/&params[]=' + item_id, '', postData] : null,
        fetcher,
        !true ? undefined : { revalidateIfStale: false, revalidateOnFocus: false, revalidateOnReconnect: false }
    )*/
   
    const { data: dynamicData, error } = useFetchForm('/api.php?r=bx_timeline/get_edit_form/&params[]=' + item_id, postData);

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
        handleMenuManageSelect = handleFormModal;
    }

    const menuOptions = handleMenuManageSelect ? { onSelect: (oItem, event) => handleMenuManageSelect(oItem, event, setPageData) } : {};

    return (
        <View className={"  lg:p-4 w-full items-center flex-row justify-between  "}>
            <FormModal pageData={pageData} setPageData={setPageData} />
            <Redirect ref={redirectdRef} />
            {viewState.view == 'edited' && (<Modal
                onVisible={true}
                transparent={true}
                headerBorder={true}
                padding= ' '
            >
                <Form
                    {...viewState.data}
                    classContainerName="flex-row flex-wrap px-2 w-full items-start justify-between"
                    onFormSubmit={onFormSubmit}
                    exProps={{
                        onClose: () => { setViewState({ view: '' }) }
                    }}
                />
            </Modal>)
            }

            <View className={oProps.data.text ? '' : 'flex-auto  mx-2'}>
                <Profile {...oProps.data.author_data} displayType="unit" displaySize={windowWidth < LAYOUT_BREAKPOINTS.lg ? "base" : "lg"} className='hidden lg:flex' showInfo={sInfo} />
            </View>
          
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
                        <Button variant="text" rounded="true" startDecorator="Ellipsis" size="base" />
                    </DropdownMenu>
                }
            </View>
        </View>
    );
}