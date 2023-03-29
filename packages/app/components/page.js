import PageDataContext from 'app/context/page';
import Cell from 'app/components/cell';
import { View, ScrollView } from 'app/design/view'
import Home from 'app/components/pages/home';
import {Platform, PlatformIOSStatic} from 'react-native'

export default function Page(props) {
    let data = props.data;

    if (!data || !data.elements)
        return <></>

    const cells = Object.keys(data.elements).map(key => {
        return <Cell key={key} blocks={data.elements[key]} />
    });

    let content = cells;
    if (props.data.uri == 'home'){
        content = <Home>{cells}</Home>
    }
    if (Platform.OS != 'web')
        return (
            <PageDataContext>{content}</PageDataContext>
        )
    else
        return (
            <PageDataContext>
                <View className="flex-row u-content3 mx-auto" > 
                    <View className="u-content4 mx-auto 2xl:m-0 py-2 sm:py-4">{content}</View>
                </View>
            </PageDataContext>
        );
}