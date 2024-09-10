
"use client"
import Layout from 'app/components/layout';
import PageLayout from 'app/components/page-layout';
//import LayoutDataContext from 'app/context/layout';
//<LayoutDataContext>
export default function Layouts({path, data, uri, url}) {
    return(
            <Layout path={path} data={data} uri={uri}>
                <PageLayout path={path} data={data} uri={uri} url={url} />
            </Layout>
    )
}
/*

"use client"
import Layout from 'app/components/layout';
import PageLayout from 'app/components/page-layout';
import LayoutDataContext from 'app/context/layout';
import BottomSheetDataContext from 'app/context/bottomsheet';

export default function Layouts({path, data, uri, url}) {
    console.log(9999);
    return(
        <BottomSheetDataContext>
        <LayoutDataContext>
            <Layout path={path} data={data} uri={uri}>
                <PageLayout path={path} data={data} uri={uri} url={url} />
            </Layout>
        </LayoutDataContext>
        </BottomSheetDataContext>
    )
}
    */