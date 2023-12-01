import { componentsMap } from './page-layout/_map';
import { appSetting } from 'app/lib/util'
import { Platform } from 'react-native'
import Cell from 'app/components/cell';
import { View } from 'app/design/view'
import { useCurrentUser } from 'app/context/user';
import ConfirmEmail from 'app/ui/molecules/confirm_email';

export default function PageLayout(props) {

    const isWeb = Platform.OS == 'web'

    let layoutCustomKey = appSetting('layouts', props.data.uri.toString())
    let layoutKey = '';
    let layoutBlocks = '';
    if (!layoutCustomKey){
        if (isWeb)
            layoutKey = props.data.layout;
    }
    else{
        layoutKey = layoutCustomKey.layout;
        layoutBlocks = layoutCustomKey.blocks
    }

    let Component = componentsMap[layoutKey];
    if (!Component)
        Component = componentsMap['default'];
    
    // return data for custom pages
    if(layoutCustomKey && layoutCustomKey.blocks)
        return Wrapper(<Component {...props} blocks={layoutBlocks}/>);

    let cells = null;

    let data = props.data;

    if (!data || !data.elements)
        return <></>
    
    cells = Object.keys(data.elements).map(key => {
        return <Cell key={key} uri={props.data.uri} blocks={data.elements[key]} />
    });

    
    // return data web layouts
    return Wrapper(<Component {...props} >{cells}</Component>);
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
