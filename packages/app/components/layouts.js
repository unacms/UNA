
"use client"
import Layout from 'app/components/layout';
import PageLayout from 'app/components/page-layout';

export default function Layouts({ path, data, uri, url }) {
    return (

        <Layout path={path} data={data} uri={uri}>
            <PageLayout path={path} data={data} uri={uri} url={url} />
        </Layout>
    )
}
