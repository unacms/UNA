import { Text } from 'app/design/typography'
import { View, Row, ScrollView } from 'app/design/view'
import { Button, Input } from 'app/design/controls';
import { useCurrentUser } from 'app/context/user';
import { useState, useEffect, useRef } from 'react'
import Msg from 'app/ui/molecules/dialogs/msg';
import { fetcher } from 'app/lib/fetcher';
import { useTranslation } from 'react-i18next';
import { FormError } from 'app/components/form-fields/_field';
import Redirect from 'app/ui/atoms/redirect';
import { storageClear } from 'app/lib/util';
import { Platform } from 'react-native';
import Link from 'app/ui/atoms/link';
import { Block, BlockHeader, BlockContent, BlockFooter, BlockTitle, BlockDescription, BlockIcon, BlockName, BlockActions } from 'app/ui/molecules/page/page-block'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from 'app/ui/molecules/page/card'
import { getPageData, getLayoutName, BlockDataByType, BlockDataByName } from 'app/lib/util';
import { BlockByDataInt as BlockByData } from 'app/components/block';
import Page from 'app/ui/molecules/page/page'
import emitter from 'app/context/emitter'

export default function ElementCreateProfile({ url }) {

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
        const subscription = emitter.addListener('page', (payload) => {
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
