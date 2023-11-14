import {Conductor} from 'app/ui/molecules/conductor';
import Cover, {CoverSmall} from 'app/components/elements/cover';
import  LayoutDataContext from 'app/context/layout';
import { getHeaderSettings } from 'app/lib/util';
import { useWindowDimensions } from 'react-native';
import { View } from 'app/design/view'

export default function PageLayout(props) {
    const windowDimen =  useWindowDimensions();
    const windowWidth = windowDimen.width;
    let headerSettings = getHeaderSettings(props.uri, windowWidth);
    let cover = headerSettings.cover

    let header = <Cover data={props.data.cover_block} mode={cover}/>
    let smallHeader = <CoverSmall data={props.data.cover_block}/>

    if (!props.data.menu.items){
        props.data.menu.items = [{name: 'view-channel-profile', link: props.data.url}];
    }
    return (<LayoutDataContext>
            <Conductor 
                header={header} 
                smallHeader={smallHeader} 
                minHeaderHeight={104} 
                offsetTop={300}
                isHideDefaultHeader={true} 
                menu={props.data.menu} 
                data={props.data} 
                blocks={props.blocks}
                cover={cover}
            />
        </LayoutDataContext>)
    
}
