
"use client"
import Layout from 'app/components/layout';
import PageLayout from 'app/components/page-layout';
import LayoutDataContext from 'app/context/layout';

export default function Layouts({path, data, uri, url}) {
    console.log('lay');
    return(
        <LayoutDataContext>
            <Layout path={path} data={data} uri={uri}>
                <PageLayout path={path} data={data} uri={uri} url={url} />
            </Layout>
        </LayoutDataContext>
    )
}