import { Modal } from 'app/design/controls'
import { getPageData } from 'app/lib/util';
import { BlockByData } from 'app/components/blocks-content/object-data-array-int';
import { ScrollView } from 'app/design/view'
import { useCallback } from 'react'
import { Keyboard } from 'react-native'

export default function FormModal({ pageData, setPageData }) {
    if (!pageData)
        return null

    const handleModalClose = useCallback(() => {
        Keyboard.dismiss()
    }, [])

    const isShowHeader = pageData.module != "bx_timeline";

    return (
        <Modal
            title={isShowHeader ? pageData.title : null}
            onVisible={!!pageData}
            outerClickClose={false}
            {...(isShowHeader && { onClose: () => { setPageData(false); handleModalClose() } })}
            padding=" sm:px-4 sm:pb-4 "
            transparent={true}
            onRequestClose={handleModalClose}
        >
            <ScrollView>
                {
                    Object.keys(pageData?.elements || {}).map(key =>
                        Object.keys(pageData.elements[key] || {}).map(key2 => (
                            <BlockByData
                                key={`${key}-${key2}`}
                                onFormEmpty={() => { setPageData(false) }}
                                block={pageData.elements[key][key2]}
                                exProps={{
                                    onClose: () => { setPageData(false); }
                                }}
                            />
                        ))
                    )
                }
            </ScrollView>
        </Modal>
    )
}

export const handleFormModal = async (oItem, event, setPageData, params) => {
    const url = oItem.link.replace(/^\/*/, "") + (params ? `&params[]=&params[]=${encodeURIComponent(JSON.stringify({ params }))}` : "");
    console.log("urlurl", url)
    const sResponse = await getPageData(url);
    setPageData(sResponse.data);
}
