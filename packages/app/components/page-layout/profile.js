import { Conductor } from 'app/ui/molecules/conductor';
import { useContext, useState, useEffect } from 'react';
import Cover, {CoverSmall} from 'app/components/elements/cover';
import { getHeaderSettings, getBlocksFromData, cloneObject, getPageData } from 'app/lib/util';
import { useWindowDimensions } from 'react-native';
import { useLayoutData } from 'app/context/layout';


export default function PageLayout(props) {
    const windowDimen =  useWindowDimensions();
    const { layoutData } = useLayoutData();
    const [ pageData, setPageData] = useState(props.data);
    let ts = 0;
    //reload page after some connection actions
    
    useEffect(() => {
        if(layoutData && layoutData?.type == 'сonnections:action'){
            (async () => {
                const sResponse = await getPageData(pageData.url);
                if (sResponse.data != pageData)
                    setPageData(sResponse.data);
            })();
            
        }
    }, [layoutData?.data?.time]);
      

    if (!pageData.menu.items){
        pageData.menu.items = [];
    }
    let menu = cloneObject(pageData.menu);
    let blocks = props.blocks;

    if (!menu.items)
        menu.items = [];
    
    const isNamePresent = menu.items.some(item => item.name === props.uri);
    const isNamePresent2 = pageData.menu.items.some(item => item.name === props.uri);

    if (!isNamePresent){
        menu.items.push({id:-1, name: props.uri, title:'', link: pageData.url, hideInTop: true});
    }

    const windowWidth = windowDimen.width;
    let headerSettings = getHeaderSettings(props.uri, windowWidth, 'profile');
    let cover = headerSettings.cover;

    let header = <Cover data={pageData.cover_block} mode={cover} uri={props.uri}/>
    let smallHeader = <CoverSmall data={pageData.cover_block}/>

    if (!blocks){
        blocks = getBlocksFromData(pageData)
    }

    return (
        
        <Conductor 
            layoutName={props.layoutName}
            header={header} 
            smallHeader={smallHeader} 
            minHeaderHeight={104} 
            offsetTop={300}
            isHideDefaultHeader={true} 
            menu={menu} 
            data={pageData} 
            blocks={blocks}
            cover={cover}
            ts={ts}
        />
       )
    
}
