
"use client"
import Layout from 'app/components/layout';
import PageLayout from 'app/components/page-layout';
import { useCurrentUser } from 'app/context/user'

export default function Layouts({ path, data, uri, url }) {
    //TODO MAY BE NEED IMPROVE key={`layout${currentUser?.id}`} TO USE MORE PROPS
    const { currentUser, setCurrentUser } = useCurrentUser();
    return (
        <Layout path={path} data={data} uri={uri} key={`layout${currentUser?.id}`}>
            <PageLayout path={path} data={data} uri={uri} url={url} />
        </Layout>
    )
}
