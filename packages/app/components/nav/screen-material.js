import { useState, useEffect } from 'react'
import { Root, getData } from 'app/root'
import { View } from 'app/design/view'
import { useIsFocused } from '@react-navigation/native';
import Cover from 'app/components/elements/cover';
import { useTheme } from '@react-navigation/native';

export function NavScreenMaterial(params) {

    const { colors } = useTheme();
    
    const _path = params.route.params.url2;

    const [pageData, setPageData] = useState('/' + params.route.params.pageData.params[0] == _path ? params.route.params.pageData : null);

    const isFocused2 = useIsFocused();

    const isDrawer = params.route.params.checkDrawer && pageData && pageData.data.menu_top && pageData.data.menu_top.items && pageData.data.menu_top.items.length > 1 && _path == '/home';
    let isTabs1 = !params.route.params.ignoreTabs && pageData?.data?.menu?.items?.length > 1 && _path != '/home';           
    let isTabs = false;
    if (isTabs1){
        pageData.data.menu.items.forEach(function (k) { 
            if ('/' + k.link == _path)
                isTabs = true;
        });
    }

    let isCover = pageData?.data?.cover_block?.profile ? true : false;
    
    useEffect(() => {
        (async () => {
            
            if (!params.route.params.pageData || '/' + params.route.params.pageData.params[0] != _path){
                console.log('---',_path, '/' + params.route.params.pageData.params[0])
                if (isFocused2 && _path && _path.startsWith('/')){                
                    const d = await getData(_path);
                    console.log("$$$$$$$$$$$$$$$$$MATER Screen load data:", params.route.params.pageData.params[0], "$$$$$",_path, "$$$$$", d?.props);
                    if (d?.props) {
                        setPageData (d?.props);
                    }
                }
            }
        })();
    }, [_path, isFocused2]);
//isFocused2
    if (isDrawer){
        /*setTimeout(() => {
            params.navigation.setOptions({ headerShown: false })
        }, 100);*/
        return <></>
    }
    else{
       /* setTimeout(() => {
            params.navigation.setOptions({ headerShown: true })
        }, 100);*/
    }
    /*if (isTabs){   
        return (<View className='flex-1'>
            {(isCover) && <Cover data={pageData.data.cover_block}/>}
        </View>);
    }*/
    /*<Stack.Screen options={{'title': pageData?.data?.title}} />*/
    if (!isDrawer && !isTabs){
        return <View className='w-full' style={{alignItems: 'center', justifyContent: 'center', borderTopWidth:1, borderTopColor:colors.blockBorder }}>
            {!!pageData && <View className=' w-full'><Root path={_path} {...pageData} /></View> }
        </View>
    }
    return <></>
}