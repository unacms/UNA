import { componentsMap } from 'app/components/page-layout/_map';
import { appSetting } from 'app/lib/util'
import { Platform } from 'react-native'
import Cell from 'app/components/cell';
import { View } from 'app/design/view'
import { useCurrentUser } from 'app/context/user';
import ConfirmEmail from 'app/ui/molecules/confirm_email';
import { appStatic } from 'app/lib/app-static'
import Redirect from 'app/ui/atoms/redirect'
import { useRef, useEffect  } from 'react';

function Page404() {
    const r = appSetting('layout', 'redirect_on_not_found');
    const redirectdRef = useRef()
    useEffect(() => {
        if (r) {
            redirectdRef.current.redirect(r);
        }
    }, []);
    return (
        <>
            <Redirect ref={redirectdRef} />
            {!r && appStatic('page_not_found')}
        </>
    );
}

function Page403() {

    const r = appSetting('layout', 'redirect_on_forbidden');
    const redirectdRef = useRef()
    useEffect(() => {
        if (r) {
            redirectdRef.current.redirect(r);
        }
    }, []);
    return (
        <>
            <Redirect ref={redirectdRef} />
            {!r && appStatic('page_not_allowed')}
        </>
    );
}

export default function PageLayout(props) {

    const isWeb = Platform.OS == 'web'
    let {layoutName, layoutBlocks, isCustomLayout}  = getLayoutName(props.data, props.data?.uri?.toString(), isWeb)
    let Component = componentsMap[layoutName];

    if(isCustomLayout && layoutBlocks)
        return Wrapper(<Component layoutName={layoutName} {...props} blocks={layoutBlocks}/>);

    let cells = null;

    let data = props.data;
    if (data.page_status == 404){
        return <Page404/>
    }

    if (data.page_status == 403){
        return <Page403/>
    }

    if (!data || !data.elements)
        return <></>
   

    cells = Object.keys(data.elements).map(key => {
        return <Cell key={key} uri={props.data.uri} url={props.url} blocks={data.elements[key]} />
    });
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

export function getLayoutName(data, uri, isWeb) {
    let layoutCustomKey = appSetting('layouts', uri)
    let layoutKey = '';
    let layoutBlocks = '';

    if (data.page_status){
        return {layoutName : 'default'};
    }

    if (layoutCustomKey){
        layoutKey = layoutCustomKey.layout;
        layoutBlocks = layoutCustomKey.blocks
    }

    let isCustomLayout =  layoutCustomKey ? true : false;

    if (componentsMap[layoutKey])
        return {layoutName : layoutKey, layoutBlocks: layoutBlocks, isCustomLayout: isCustomLayout};
    
    if (data?.cover_block?.profile)
        return {layoutName : 'profile', layoutBlocks: layoutBlocks, isCustomLayout: isCustomLayout};

    if (data?.menu?.items?.length > 0 && !uri.includes('create-') )
        return {layoutName : 'navigator', layoutBlocks: layoutBlocks, isCustomLayout: isCustomLayout};

    if (isWeb)
        layoutKey = data?.layout;

    if (componentsMap[layoutKey])
        return {layoutName : layoutKey, layoutBlocks: layoutBlocks, isCustomLayout: isCustomLayout};

    return {layoutName : 'default', layoutBlocks: layoutBlocks, isCustomLayout: isCustomLayout};
}
