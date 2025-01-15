import { Modal } from 'app/design/controls'
import { getPageData } from 'app/lib/util';
import { BlockByData } from 'app/components/blocks-content/object-data-array-int';
import { ScrollView } from 'app/design/view'

export default function FormModal({ pageData, setPageData }) {
    if (!pageData)
        return null
    
    return (
        <Modal title={pageData.title} onVisible={!!pageData} outerClickClose={false} onClose={() => setPageData(false)} >
            <ScrollView>
                {
                    Object.keys(pageData?.elements || {}).map(key =>
                        Object.keys(pageData.elements[key] || {}).map(key2 => (
                            <BlockByData
                                key={`${key}-${key2}`}
                                onFormEmpty={() => { setPageData(false) }}
                                block={pageData.elements[key][key2]}
                            />
                        ))
                    )
                }
            </ScrollView>
        </Modal>
    )
}

export const handleMenuManageSelect = async (oItem, event, setPageData) => {
    const sResponse = await getPageData(oItem.link.replace(/^\/*/, ""));
    setPageData(sResponse.data);
}
