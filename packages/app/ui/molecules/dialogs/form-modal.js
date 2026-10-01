import { Modal } from 'app/design/controls'
import { getPageData, getLayoutName, BlockDataByType } from 'app/lib/util';
import { BlockByDataInt as BlockByData } from 'app/components/block';
import { View } from 'app/design/view';
import { Keyboard } from 'react-native'
import { components } from 'app/components/registry';
import { Platform } from 'react-native'
import { useEffect, useCallback, useRef } from 'react'
import { Loading } from 'app/customization/loading'
import { getModalPostTitle } from 'app/customization/functions'
import { appSetting } from 'app/lib/util';
import { useModal, useCloseModal, useOpenModalByUrl } from 'app/context/jotai/modal';
import emitter, { EVENTS } from 'app/context/emitter';
import { confirmDiscardUnsavedFormChanges } from 'app/lib/form/form-helpers';
import { useTranslation } from 'react-i18next'

const isWeb = Platform.OS === 'web';

// feed.modal_hash: feed post modal keeps the feed URL and stores the post in #fi=,
// so a reload renders the feed and reopens the modal (off: address bar shows the post URL)
const FEED_MODAL_HASH = '#fi=';

export const isFeedModalHash = () => isWeb && !!appSetting('feed', 'modal_hash');

export const getFeedModalHistoryUrl = (url) =>
    window.location.pathname + window.location.search + FEED_MODAL_HASH + encodeURIComponent(url);

const getFeedModalUrlFromHash = () => {
    const hash = window.location.hash;
    if (!hash.startsWith(FEED_MODAL_HASH))
        return '';
    try {
        return decodeURIComponent(hash.slice(FEED_MODAL_HASH.length));
    } catch {
        return '';
    }
};

export default function FormModal({ pageData, setPageData, modalView, url, historyUrl }) {
    const { t } = useTranslation()
    const previousUrlRef = useRef(null);

    const handleModalClose = useCallback(() => {
        Keyboard.dismiss()
    }, [])

    const handleClose = useCallback(() => {
        if (isWeb && previousUrlRef.current) {
            window.history.replaceState(null, '', previousUrlRef.current);
        }
        setPageData(false);
    }, [setPageData]);

    const handleRequestClose = useCallback(() => {
        handleModalClose();
        handleClose();
    }, [handleModalClose, handleClose]);

    useEffect(() => {
        if (!isWeb || !pageData || !url)
            return;

        const normalizedUrl = historyUrl || '/' + url.replace(/^\/+/, '');
        previousUrlRef.current = window.location.pathname + window.location.search;

        // reopened after reload (or url updated while open): the history entry is already there
        if (window.location.pathname + window.location.search + window.location.hash !== normalizedUrl)
            window.history.pushState({ modal: true }, '', normalizedUrl);

        const handlePopState = async () => {
            const proceed = await confirmDiscardUnsavedFormChanges();
            if (!proceed) {
                window.history.pushState({ modal: true }, '', normalizedUrl);
                return;
            }
            setPageData(false);
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [!!pageData, url, historyUrl]);

    if (!pageData)
        return null;

    if (modalView == 'content_page') {
        const authorData = BlockDataByType(pageData, 'entity_author');
        const Component = components['layout']['post'];
        const layout = getLayoutName(pageData, 'item');
        const { layoutBlocks } = layout;

        const layoutBlocks1 = pageData == 'loading' ? layoutBlocks : (layoutBlocks || appSetting('layouts', pageData?.uri)?.blocks);

        return (
            <Modal
                onClose={handleClose}
                onVisible={!!pageData}
                title={getModalPostTitle(authorData, t)}
                padding=""
                outerClickClose={isWeb}
                usePadding={true}
            >
                <Component url={url} isModal={true} layoutName={'post'} data={pageData} blocks={layoutBlocks1} />
            </Modal>
        );
    }

    const isShowHeader = pageData.module != "bx_timeline";
    // Form fields must sit directly inside the aware-scroll modal (no nested ScrollView),
    // otherwise the keyboard shifts layout incorrectly and won't scroll to the input.
    const Container = View;

    const modalWidth = 'max-w-3xl';
    /*Object.keys(pageData?.elements || {}).forEach(key => {
        Object.keys(pageData.elements[key] || {}).forEach(key2 => {
            const value = pageData.elements[key][key2]?.content[0];

            if (value?.type === 'form' && value?.name === 'feed') {
                modalWidth = 'max-w-3xl';
            }
        });
    });*/

    return (
        <Modal
            maxWidth={modalWidth}
            scrollable={pageData?.module == 'bx_timeline' ? false : true}
            title={isShowHeader ? pageData.title : null}
            onVisible={!!pageData}
            {...(isShowHeader && { onClose: () => { setPageData(false); handleModalClose() } })}
            //padding={isShowHeader ? " p-0 " : " p-0 "}
            transparent={true}
            onRequestClose={handleRequestClose}
            onClose={handleClose}

        >
            <View className='flex-auto'>{/*p-3*/}
                <Container key={pageData.module + (pageData.ts)} className={`flex-1 ${isShowHeader ? '' : 'overflow-visible'}`}>{/*px-3 sm:px-0*/}
                    {
                        pageData == 'loading' ? <View className="flex-1 items-center justify-center">
                            <Loading />
                        </View> :
                            Object.keys(pageData?.elements || {}).map(key =>
                                Object.keys(pageData.elements[key] || {}).map(key2 => (
                                    <BlockByData
                                        key={`${key}-${key2}`}
                                        onFormEmpty={() => { setPageData(false) }}
                                        block={pageData.elements[key][key2]}
                                        exProps={{
                                            onClose: () => { setPageData(false); },
                                            resetOnSubmit: true,
                                            formOnly: true,
                                            classes: 'p-3 sm:p-4'
                                        }}
                                    />
                                ))
                            )
                    }
                </Container>
            </View>
        </Modal>
    )
}


export const FormModalHost = () => {
    const modal = useModal();
    const closeModal = useCloseModal();
    const openModalByUrl = useOpenModalByUrl();

    useEffect(() => {
        if (!isFeedModalHash())
            return;
        const url = getFeedModalUrlFromHash();
        if (url)
            openModalByUrl(url, getFeedModalHistoryUrl(url));
    }, [openModalByUrl]);

    useEffect(() => {
        const subscription = emitter.addListener(EVENTS.link, async () => {
            const proceed = await confirmDiscardUnsavedFormChanges();
            if (!proceed) return;
            closeModal();
        });
        return () => subscription.remove();
    }, [closeModal]);

    let modalContent = null;
    if (modal.visible && modal.mode === 'content') {
        modalContent = (
            <Modal
                onVisible={true}
                onClose={closeModal}
                title={modal.title}
                scrollable={true}
                transparent={true}
                outerClickClose={isWeb}
            >
                <View>{modal.content}</View>
            </Modal>
        );
    } else {
        modalContent = (
            <FormModal
                modalView="content_page"
                pageData={modal.visible ? modal.pageData : false}
                setPageData={(v) => { if (!v) closeModal(); }}
                url={modal.url}
                historyUrl={modal.historyUrl}
            />
        );
    }

    return modalContent;
}

export const handleFormModal = async (oItem, event, setPageData, params) => {
    const sResponse = await getFormModal(oItem, params);
    setPageData({ ...sResponse.data, ts: Date.now(), url: oItem?.link?.replace(/^\/*/, "") + (params ? `&params[]=&params[]=${JSON.stringify({ params })}` : "") });
}

export const getFormModal = async (oItem, params) => {
    const url = oItem?.link?.replace(/^\/*/, "") + (params ? `&params[]=&params[]=${JSON.stringify({ params })}` : "");
    return await getPageData(url, true);
}