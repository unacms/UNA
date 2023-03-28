import { A, Text } from 'app/design/typography'
import { View } from 'app/design/view'
import { useState, useEffect } from 'react'
import All, { getData } from 'app/all'
import Page from 'app/components/page'

export function NavScreenWeb(params) {
    const [pageData, setPageData] = useState(null);
    const _path = '/'+params.route.name;

    useEffect(() => {
        (async () => {
            if (_path && _path.startsWith('/')){
                const d = await getData(_path);

                if (d?.props) {
                    setPageData (d?.props)
                }
            }
        })();
    }, [_path]);

    let data = pageData?.data;
    return <Page data={data}/>
}