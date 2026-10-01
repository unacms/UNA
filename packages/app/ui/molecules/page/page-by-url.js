import { useState, useEffect, useRef } from 'react'
import { getPageData } from 'app/lib/util';
import { BlockByDataInt as BlockByData } from 'app/components/block';
import Page from 'app/ui/molecules/page/page'
import emitter, { EVENTS } from 'app/context/emitter'

export default function PageByUrl({ url }) {

    const [pageData, setPageData] = useState(false);
    const urlRef = useRef(url);
    urlRef.current = url;

    useEffect(() => {
        const fetchData = async () => {
            const sResponse = await getPageData(url, false);
            if (sResponse.data !== pageData) {
                setPageData(sResponse.data);
            }
        }
        fetchData()
    }, [url]);

    useEffect(() => {
        const subscription = emitter.addListener(EVENTS.page, (payload) => {
            if (payload?.action !== 'reload') return;
            const currentUrl = urlRef.current;
            if (!currentUrl) return;
            getPageData(currentUrl, false).then((sResponse) => {
                if (sResponse?.data) {
                    setPageData(sResponse.data);
                }
            });
        });
        return () => subscription.remove();
    }, []);

    if (!pageData)
        return

    return (<Page>
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
    </Page>)
}
