import { Modal } from 'app/design/controls'
import { getPageData } from 'app/lib/util';
import { BlockByData } from 'app/components/blocks-content/object-data-array-int';
import { ScrollView, View } from 'app/design/view'
import { useCallback } from 'react'
import { Keyboard } from 'react-native'

export default function FormModal({ pageData, setPageData }) {
    if (!pageData)
        return null

    const handleModalClose = useCallback(() => {
        Keyboard.dismiss()
    }, [])

    const isShowHeader = pageData.module != "bx_timeline";
    const Container = isShowHeader ? ScrollView : View;
    if (!pageData)
        return null;

    return (
        <Modal
            
            title={isShowHeader ? pageData.title : null}
            onVisible={!!pageData}
            outerClickClose={false}
            {...(isShowHeader && { onClose: () => { setPageData(false); handleModalClose() } })}
            padding={isShowHeader ? " p-3 " : " p-0 "}
            transparent={true}
            onRequestClose={handleModalClose}
        >
            <Container key={pageData.module + (pageData.ts)} className={`flex-1 ${isShowHeader ? '' : ''}`}>{/*px-3 sm:px-0*/}
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
    setPageData({...sResponse.data, ts: Date.now()});
}

export const getFormModal = async (oItem, params) => {
    const url = oItem.link.replace(/^\/*/, "") + (params ? `&params[]=&params[]=${JSON.stringify({ params })}` : "");
    return await getPageData(url);
}

