import { getAlert } from 'app/lib/util';
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
import useFetchForm from 'app/lib/hooks/fetch'
import { Modal } from 'app/design/controls'
import Form from 'app/components/elements/form'
import { useLayoutData } from 'app/context/layout';
import FormModal, { handleFormModal } from 'app/ui/molecules/form_modal';
import { useIsDesktop } from 'app/context/measure';
import { BlockWrapper } from 'app/components/block-wrapper'

export default function ElementEntityAuthor({ data, blockWrapperProps }) {
    const { currentUser } = useCurrentUser();
    const [viewState, setViewState] = useState({ view: '' })
    const [postData, setPostData] = useState(null)
    const { setLayoutData } = useLayoutData()
    const [pageData, setPageData] = useState(false);
    const isDesktop = useIsDesktop();
    const sInfo = (
        <Row className='flex-none gap-1 items-center justify-start text-muted-foreground text-xs font-medium leading-4 '>
            <Time size="xs"
                ts={data.entry_date}
            />
            {
                !!data?.entry_context?.id && (

                    <Row className='items-center gap-x-1 justify-start'>
                        <Text className=" text-center font-medium text-muted-foreground">in</Text>
                        <Profile {...data.entry_context} displayType="unit_wo_info" displaySize="2xs" />
                        <Text className="text-muted-foreground text-xs  leading-5 text-center font-medium ">{data.entry_context.display_name}</Text>

                    </Row>

                )}
        </Row>
    );

    let handleMenuManageSelect = false

    const item_id = data?.entry_id;
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
    if (!!currentUser && data?.menu_manage?.items) {
        data.menu_manage.items.forEach((aItem) => {
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

    if (data?.menu_manage?.object == 'bx_timeline_menu_item_manage') {
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
    else {
        handleMenuManageSelect = handleFormModal;
    }

    const menuOptions = handleMenuManageSelect ? { onSelect: (oItem, event) => handleMenuManageSelect(oItem, event, setPageData) } : {};
    return (
        <BlockWrapper {...blockWrapperProps}>
            <Row className="justify-between gap-3">
                <FormModal pageData={pageData} setPageData={setPageData} />
                <Redirect ref={redirectdRef} />
                {viewState.view == 'edited' && (<Modal
                    onVisible={true}
                    transparent={true}
                    headerBorder={true}
                    padding=' '
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

                <View className={data.text ? '' : 'flex-auto'}>
                    <Profile {...data.author_data} displayType="unit" displaySize="base" className='hidden lg:flex' showInfo={sInfo} />
                </View>

                {(data.text && false) && (
                    <View className='flex-auto overflow-hidden text-ellipsis w-1/2 lg:w-auto px-4'>
                        <Link href={data.url}>
                            <Text className=" lg:text-center overflow-hidden text-ellipsis text-lg font-bold font-bold  text-popover-foreground  overflow" numberOfLines={2}>
                                {data.text}
                            </Text>
                        </Link>
                    </View>
                )
                }
                <View>
                    {aMenuManageItems.length > 0 &&
                        <DropdownMenu mode="popup" items={aMenuManageItems} {...menuOptions}>
                            <Button variant="text" rounded="true" startDecorator="Ellipsis" size="base" />
                        </DropdownMenu>
                    }
                </View>
            </Row>
        </BlockWrapper>
    );
}