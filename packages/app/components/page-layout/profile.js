import {Conductor} from 'app/ui/molecules/conductor';
import Cover, {CoverSmall} from 'app/components/elements/cover';
import  LayoutDataContext from 'app/context/layout';
import { getHeaderSettings, getBlocksFromData } from 'app/lib/util';
import { useWindowDimensions } from 'react-native';
import { View } from 'app/design/view'

export default function PageLayout(props) {
    const windowDimen =  useWindowDimensions();
    const windowWidth = windowDimen.width;
    let headerSettings = getHeaderSettings(props.uri, windowWidth, 'profile');
    let cover = headerSettings.cover

    let header = <Cover data={props.data.cover_block} mode={cover}/>
    let smallHeader = <CoverSmall data={props.data.cover_block}/>

    if (!props.data.menu.items){
        props.data.menu.items = [];
    }
    let menu = props.data.menu;
    let blocks = props.blocks;
    const isNamePresent = menu.items.some(item => item.name === props.uri);
    if (!isNamePresent){
        menu.items.push({id:-1, name: props.uri, title:'', link: props.data.url, hideInTop: true});
    }

    if (!blocks){
        blocks = getBlocksFromData(props.data)
    }

    return (<LayoutDataContext>
            <Conductor 
                layoutName={props.layoutName}
                header={header} 
                smallHeader={smallHeader} 
                minHeaderHeight={104} 
                offsetTop={300}
                isHideDefaultHeader={true} 
                menu={menu} 
                data={props.data} 
                blocks={blocks}
                cover={cover}
            />
        </LayoutDataContext>)
    
}
