import { View } from 'app/design/view'
import { useState, useEffect } from 'react'
import { Root, getData } from 'app/root'
import { useIsFocused } from '@react-navigation/native';
import PageLayout from 'app/components/page-layout';
export function NavScreen(params) {

    const isFocused2 = useIsFocused();

    const [pageData, setPageData] = useState(null);
    const _path = '/'+params.route.name;
    window.history.replaceState('', '', _path);
    useEffect(() => {
        (async () => {
            if (isFocused2 && _path && _path.startsWith('/')){
                const d = await getData(_path);
                if (d?.props) {
                    setPageData (d?.props)
                }
            }
        })();
    }, [_path, isFocused2]);

    let data = pageData?.data;
    return <View className="bg-screen dark:bg-screen-dark">
        { !!pageData?.data  && <PageLayout path={_path} data={pageData?.data} uri={pageData?.data.uri}/> }
    </View>
}