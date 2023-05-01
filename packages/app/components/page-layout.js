import PageLayoutDefault from './page-layout/default';

import PageCustomPost from './page-layout/custom_post';
import PageCustomMessenger from './page-layout/custom_messenger';
import PageCustomBrowse from './page-layout/custom_browse';
import PageCustomPerson from './page-layout/custom_person';
import PageCustomHome from './page-layout/custom_home';

import PageLayout1 from './page-layout/layout_top_area_bar_right';
import PageLayout2 from './page-layout/layout_topbottom_area_bar_left';
import PageLayout3 from './page-layout/layout_topbottom_area_bar_right';

import { appSetting } from 'app/lib/util'
import { Platform } from 'react-native'
import Cell from 'app/components/cell';
import { View } from 'app/design/view'
import { Text } from 'app/design/typography'
const componentsMap = {
    'default': PageLayoutDefault,

    'custom_post': PageCustomPost,
    'custom_browse': PageCustomBrowse,
    'custom_messenger': PageCustomMessenger,
    'custom_persons': PageCustomPerson,
    'custom_home': PageCustomHome,

    'layout_top_area_bar_right': PageLayout1,
    'layout_topbottom_area_bar_left': PageLayout2,
    'layout_topbottom_area_bar_right': PageLayout3
};

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

    const Component = componentsMap[layoutKey];
    
    // return data for custom pages
    if(layoutCustomKey)
        return Wrapper(<Component {...props} blocks={layoutBlocks}/>);

    let cells = null;
    if (!layoutCustomKey){
        let data = props.data;

        if (!data || !data.elements)
            return <></>
        
        cells = Object.keys(data.elements).map(key => {
            return <Cell key={key} uri={props.data.uri} blocks={data.elements[key]} />
        });
    }
    
    // return data defaults
    if (!Component)
       return Wrapper(<PageLayoutDefault {...props} >{cells}</PageLayoutDefault>);
    
    // return data web layouts
    return Wrapper(<Component {...props} >{cells}</Component>);
}

function Wrapper(p){

    const isWeb = Platform.OS == 'web'

    if (isWeb){
        return <View className={ appSetting('layout', 'max_width') + ' mx-auto w-full'}>{p}</View>
    }

    return <View className='flex-1 mx-auto w-full'>{p}</View>
}
