import { Modal } from 'app/design/controls'
import { getPageData, getLayoutName, BlockDataByType, BlockDataByName } from 'app/lib/util';
import { BlockByDataInt as BlockByData } from 'app/components/block';
import { ScrollView, View, Row } from 'app/design/view'
import { Keyboard } from 'react-native'
import { getComponent } from 'app/components/registry';
import { Platform } from 'react-native'
import { useEffect, useCallback, useRef } from 'react'
import { Loading } from 'app/customization/loading'
import { getModalPostTitle } from 'app/customization/functions'
import { appSetting } from 'app/lib/util';
import { useModal, useCloseModal } from 'app/context/jotai/modal';


const isWeb = Platform.OS === 'web';

export default function FormModal({ pageData, setPageData, modalView, url }) {
    const previousUrlRef = useRef(null);

    const handleModalClose = useCallback(() => {
        Keyboard.dismiss()
    }, [])

    const handleClose = useCallback(() => {
        if (isWeb && previousUrlRef.current) {
            window.history.replaceState(null, '', previousUrlRef.current);
        }
        setPageData(false);
    }, []);

    const handleRequestClose = useCallback(() => {
        handleModalClose();
        handleClose();
    }, [handleModalClose, handleClose]);

    useEffect(() => {
        if (!isWeb || !pageData || !url)
            return;

        const normalizedUrl = '/' + url.replace(/^\/+/, '');
        previousUrlRef.current = window.location.pathname + window.location.search;

        window.history.pushState({ modal: true }, '', normalizedUrl);

        const handlePopState = () => {
            setPageData(false);
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [!!pageData, url]);

    if (!pageData)
        return null;

    if (modalView == 'content_page') {
        const authorData = BlockDataByType(pageData, 'entity_author');
        const Component = getComponent('layout', 'post');
        const layout = getLayoutName(pageData, 'item');
        const { layoutBlocks } = layout;

        const layoutBlocks1 = pageData == 'loading' ? layoutBlocks : (layoutBlocks || appSetting('layouts', pageData?.uri)?.blocks);

        return (
            <Modal
                onClose={handleClose}
                onVisible={!!pageData}
                title={getModalPostTitle(authorData)}
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
    if (modal.visible && modal.mode === 'content') {
        return (
            <Modal
                onVisible={true}
                onClose={closeModal}
                title={modal.title}
                scrollable={true}
                transparent={true}
                outerClickClose={isWeb}
            >
                <View >{modal.content}</View>
            </Modal>
        );
    }
    return (
        <FormModal
            modalView="content_page"
            pageData={modal.visible ? modal.pageData : false}
            setPageData={(v) => { if (!v) closeModal(); }}
            url={modal.url}
        />
    );
}

export const handleFormModal = async (oItem, event, setPageData, params) => {
    const sResponse = await getFormModal(oItem, params);
    setPageData({ ...sResponse.data, ts: Date.now(), url: oItem?.link?.replace(/^\/*/, "") + (params ? `&params[]=&params[]=${JSON.stringify({ params })}` : "") });
}

export const getFormModal = async (oItem, params) => {
    const url = oItem?.link?.replace(/^\/*/, "") + (params ? `&params[]=&params[]=${JSON.stringify({ params })}` : "");
    return await getPageData(url, true);
}