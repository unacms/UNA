import { Modal } from 'app/design/controls'
import { getPageData, getLayoutName, BlockDataByType, BlockDataByName } from 'app/lib/util';
import { BlockByDataInt as BlockByData } from 'app/components/block';
import { ScrollView, View, Row } from 'app/design/view'
import { Keyboard } from 'react-native'
import { getComponent } from 'app/components/registry';
import { Platform } from 'react-native'
import { useEffect, useCallback, useRef } from 'react'

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
        return (
            <Modal
                onClose={handleClose}
                onVisible={!!pageData}
                title={`${authorData?.content?.[0]?.data?.author_data?.display_name}'s post`}
                padding=""
                outerClickClose={isWeb}
                usePadding={true}
            >
                <Component url={url} isModal={true} layoutName={'post'} data={pageData} blocks={layoutBlocks} />
            </Modal>
        );
    }

    const isShowHeader = pageData.module != "bx_timeline";
    const Container = isShowHeader ? ScrollView : View;

    let modalWidth = 'max-w-3xl';
    Object.keys(pageData?.elements || {}).forEach(key => {
        Object.keys(pageData.elements[key] || {}).forEach(key2 => {
            const value = pageData.elements[key][key2]?.content[0];

            if (value?.type === 'form' && value?.name === 'feed') {
                modalWidth = 'max-w-3xl';
            }
        });
    });
    
    return (
        <Modal
            maxWidth={modalWidth}
            scrollable={pageData?.module=='bx_timeline' ? false: true}
            title={isShowHeader ? pageData.title : null}
            onVisible={!!pageData}
            {...(isShowHeader && { onClose: () => { setPageData(false); handleModalClose() } })}
            padding={isShowHeader ? " p-0 " : " p-0 "}
            transparent={true}
            onRequestClose={handleModalClose}
            onClose={handleClose}
         
        >
            <View className='p-3 flex-auto'>
                <Container key={pageData.module + (pageData.ts)} className={`flex-1 ${isShowHeader ? '' : 'overflow-visible'}`}>{/*px-3 sm:px-0*/}
                    {
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

export const handleFormModal = async (oItem, event, setPageData, params) => {
    const sResponse = await getFormModal(oItem, params);
    setPageData({ ...sResponse.data, ts: Date.now(), url:oItem?.link?.replace(/^\/*/, "") + (params ? `&params[]=&params[]=${JSON.stringify({ params })}` : "") });
}

export const getFormModal = async (oItem, params) => {
    const url = oItem?.link?.replace(/^\/*/, "") + (params ? `&params[]=&params[]=${JSON.stringify({ params })}` : "");
    return await getPageData(url, true);
}