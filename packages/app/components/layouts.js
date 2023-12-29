
import Layout from 'app/components/layout';
import PageLayout from 'app/components/page-layout';
import LayoutDataContext from 'app/context/layout';

export default function Layouts({path, data, uri}) {
    return(
        <Layout path={path} data={data} uri={uri}>
            <LayoutDataContext>
                <PageLayout path={path} data={data} uri={uri} />
            </LayoutDataContext>
        </Layout>
    )
}