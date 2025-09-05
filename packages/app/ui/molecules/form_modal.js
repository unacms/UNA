import { Modal } from 'app/design/controls'
import { getPageData, getLayoutName, BlockDataByType, BlockDataByName  } from 'app/lib/util';
import { BlockByData } from 'app/components/blocks-content/object-data-array-int';
import { ScrollView, View, Row } from 'app/design/view'
import { useCallback } from 'react'
import { Keyboard } from 'react-native'
import { getComponent } from 'app/components/registry';

export default function FormModal({ pageData, setPageData, modalView, url }) {
    const handleModalClose = useCallback(() => {
        Keyboard.dismiss()
    }, [])

    if (!pageData)
        return null;

    if (modalView == 'bx_timeline') {
        const authorData = BlockDataByType(pageData, 'entity_author');
        const Component = getComponent('layout', 'post');
        const layout = getLayoutName(pageData, 'item');
        const { layoutBlocks } = layout;
        return (
            <Modal
                outerClickClose={false}
                onClose={() => setPageData(false)}
                onVisible={!!pageData}
                title={`${authorData.content[0].data.author_data.display_name}'s post`}
                padding=""
            >
                <Component url={url} isModal={true} layoutName={'post'} data={pageData} blocks={layoutBlocks} />
            </Modal>
        );
    }

    const isShowHeader = pageData.module != "bx_timeline";
    const Container = isShowHeader ? ScrollView : View;

    let modalWidth = 'max-w-4xl';
    Object.keys(pageData?.elements || {}).forEach(key => {
        Object.keys(pageData.elements[key] || {}).forEach(key2 => {
            const value = pageData.elements[key][key2]?.content[0];

            if (value?.type === 'form' && value?.name === 'feed') {
                modalWidth = 'max-w-2xl';
            }
        });
    });

    return (
        <Modal
            maxWidth={modalWidth}
            title={isShowHeader ? pageData.title : null}
            onVisible={!!pageData}
            outerClickClose={false}
            {...(isShowHeader && { onClose: () => { setPageData(false); handleModalClose() } })}
            padding={isShowHeader ? " p-0 " : " p-0 "}
            transparent={true}
            onRequestClose={handleModalClose}
        >
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
        </Modal>
    )
}

export const handleFormModal = async (oItem, event, setPageData, params) => {
    const sResponse = await getFormModal(oItem, params);
    setPageData({ ...sResponse.data, ts: Date.now() });
}

export const getFormModal = async (oItem, params) => {
    const url = oItem.link.replace(/^\/*/, "") + (params ? `&params[]=&params[]=${JSON.stringify({ params })}` : "");
    return await getPageData(url, true);
}