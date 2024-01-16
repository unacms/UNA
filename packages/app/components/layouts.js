
import Layout from 'app/components/layout';
import PageLayout from 'app/components/page-layout';
import LayoutDataContext from 'app/context/layout';
import BottomSheetDataContext from 'app/context/bottomsheet';

export default function Layouts({path, data, uri, url}) {
    return(
        <LayoutDataContext>
            <BottomSheetDataContext>
                <Layout path={path} data={data} uri={uri}>
                    <PageLayout path={path} data={data} uri={uri} url={url} />
                </Layout>
            </BottomSheetDataContext>
        </LayoutDataContext>
    )
}