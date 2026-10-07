import { useCurrentUser } from 'app/context/user';
import { View, Row } from 'app/design/view';
import Time from 'app/ui/atoms/time';
import Profile from 'app/ui/molecules/profile/profile';
import DropdownMenu from 'app/ui/atoms/dropdown-menu';
import Link from 'app/ui/atoms/link'
import { Text } from 'app/design/typography'
import { fetcher } from 'app/lib/fetcher'
import Redirect from 'app/ui/atoms/redirect'
import { useRef, useState } from 'react';
import useFetchForm from 'app/lib/hooks/use-fetch-form'
import { Modal } from 'app/design/controls'
import Form from 'app/components/elements/form'
import FormModal, { handleFormModal } from 'app/ui/molecules/dialogs/form-modal';
import { useIsDesktop } from 'app/context/measure';
import { BlockWrapper } from 'app/components/block-wrapper'
import { runMenuItemCallback } from 'app/lib/util'
import { useTranslation } from 'react-i18next'

export default function ElementEntityAuthor({ data, blockWrapperProps }) {
    const { t } = useTranslation();
    const { currentUser } = useCurrentUser();
    const [viewState, setViewState] = useState({ view: '' })
    const [postData, setPostData] = useState(null)
    const [pageData, setPageData] = useState(false);
    const isDesktop = useIsDesktop();
    const context = data?.entry_context;
    const contextUrl = typeof context?.url === 'string' ? context.url.trim() : '';
    const isContextLinkable = contextUrl && !/^\/?javascript:/i.test(contextUrl);

    const contextIdentity = context ? (
        <Row className='items-center gap-x-1 justify-start'>
            <Profile {...context} displayType="unit_wo_info" displaySize="2xs" showLinks={false} />
            <Text className="text-secondary-foreground text-xs leading-5 text-center font-medium ">{context.display_name}</Text>
        </Row>
    ) : null;

    const sInfo = (
        <Row className='flex-none gap-1 items-center justify-start text-muted-foreground text-sm font-medium leading-5 '>
            <Time className="text-muted-foreground text-xs leading-5 text-center font-medium " size="xs"
                ts={data.entry_date}
            />
            {
                !!context?.id && (

                    <Row className='items-center gap-x-1 justify-start'>
                        <Text className=" text-center font-medium leading-5 text-xs text-secondary-foreground">{t('in')}</Text>
                        {isContextLinkable ? (
                            <Link href={contextUrl} size="xs" variant="secondary">
                                {contextIdentity}
                            </Link>
                        ) : contextIdentity}

                    </Row>

                )}
        </Row>
    );

    let handleMenuManageSelect = false

    const item_id = data?.entry_id;
    const redirectdRef = useRef();

    // Submit edit form; UI refresh comes via bx_timeline_0 "edited" socket
    useFetchForm('/api.php?r=bx_timeline/get_edit_form/&params[]=' + item_id, postData);


    const onFormSubmit = (formData, d) => {
        setViewState({ view: '' })
        setPostData(formData);

    }

    let aMenuManageItems = [];
    if (!!currentUser && data?.menu_manage?.items) {
        data.menu_manage.items.forEach((aItem) => {
            if (aItem?.display_type && (aItem.display_type != 'link' && aItem.display_type != 'callback' && aItem.name != 'report'))
                return;

            aMenuManageItems.push({
                id: aItem.id ? aItem.id : aItem.name,
                link: '/' + aItem.link,
                name: aItem.name,
                title: aItem?.title ? aItem?.title : '',
                icon: aItem.icon,
                image: aItem.image,
                data: aItem.data,
            });
        });
    }

    aMenuManageItems = aMenuManageItems.filter((item) => (item.title != ''))

    if (data?.menu_manage?.object == 'bx_timeline_menu_item_manage') {
        handleMenuManageSelect = async (oItem, event) => {
            switch (oItem.name) {
                case 'item-edit':
                    setPageData('loading');
                    const oResultEdit = await fetcher(
                        '/api.php?r=bx_timeline/get_edit_form/&params[]=' + item_id
                    )
                    setViewState({ view: 'edited', data: oResultEdit.data.form })
                    break

                case 'item-delete':
                    setPageData('loading');
                    const oResultDeleted = await fetcher(
                        '/api.php?r=bx_timeline/delete/&params[]=' + item_id
                    )
                    redirectdRef.current.redirect('/');
                    break

                default:
                    await runMenuItemCallback(oItem)
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
            <Row className="justify-between gap-2">
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
                            <Text className=" lg:text-center overflow-hidden text-ellipsis text-lg font-bold text-popover-foreground overflow" numberOfLines={2}>
                                {data.text}
                            </Text>
                        </Link>
                    </View>
                )
                }
                <View>
                    {aMenuManageItems.length > 0 &&
                        <DropdownMenu
                            mode="popup"
                            items={aMenuManageItems}
                            {...menuOptions}
                            buttonProps={{
                                image: 'Ellipsis',
                                style: 'borderless',
                                borderShape: 'circle',
                                controlSize: 'regular',
                                accessibilityLabel: 'More options',
                            }}
                        />
                    }
                </View>
            </Row>
        </BlockWrapper>
    );
}