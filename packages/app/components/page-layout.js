import { componentsMap } from 'app/components/page-layout/_map';
import { appSetting, getLayoutName } from 'app/lib/util'
import { Platform } from 'react-native'
import Cell from 'app/components/cell';
import { View } from 'app/design/view'
import { useCurrentUser } from 'app/context/user';
import ConfirmEmail from 'app/ui/molecules/confirm_email';

export default function PageLayout(props) {

    const isWeb = Platform.OS == 'web'
    let {layoutName, layoutBlocks, isCustomLayout}  = getLayoutName(props.data, props.data.uri.toString(), isWeb)
    let Component = componentsMap[layoutName];

    if(isCustomLayout && layoutBlocks)
        return Wrapper(<Component layoutName={layoutName} {...props} blocks={layoutBlocks}/>);

    let cells = null;

    let data = props.data;

    if (!data || !data.elements)
        return <></>
    
    cells = Object.keys(data.elements).map(key => {
        return <Cell key={key} uri={props.data.uri} blocks={data.elements[key]} />
    });
    console.log(layoutName);
    // return data web layouts
    return Wrapper(<Component layoutName={layoutName} {...props} >{cells}</Component>);
}

function Wrapper(p){
    let { currentUser, setCurrentUser } = useCurrentUser();
    if (!currentUser || currentUser?.confirmed || appSetting('layout', 'lock_unconfirmed') != true){
        return <View className='flex-1 mx-auto w-full h-full animated-view'>{p}</View>
    }
    else{
        return <View className='flex-1 mx-auto w-full h-full animated-view'><ConfirmEmail/></View>
    }
}
