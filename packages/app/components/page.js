import PageDataContext from 'app/context/page';
import Cell from 'app/components/cell';
import PageLayout from 'app/components/page-layout';
import { View } from 'app/design/view'
import {Platform, PlatformIOSStatic} from 'react-native'
import { appSetting } from 'app/lib/util'

export default function Page(props) {
    let data = props.data;

    if (!data || !data.elements)
        return <></>
    
    let cells = Object.keys(data.elements).map(key => {
        return <Cell key={key} blocks={data.elements[key]} />
    });
    let content = cells;
    
    if (props.data.uri == 'home' && Platform.OS != 'web'){
        content = [cells[2]];
    }

    

    if (Platform.OS == 'web'){
        content = <View className={ appSetting('layout', 'max_width') + ' mx-auto w-full'}>
            <PageLayout {...props}>{cells}</PageLayout>
        </View>
    }
    
    return (
        <PageDataContext>{content}</PageDataContext>
    )
}