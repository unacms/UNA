import { View } from 'app/design/view';
import {BlockByName} from 'app/components/block';
import {Tabs} from 'app/ui/molecules/tabs';
import Cover, {CoverSmall} from 'app/components/elements/cover';
import { processMenu, getURI } from 'app/lib/util'
import { Text, H1C } from 'app/design/typography';

export default function PageLayout(props) {

    let header = <Cover data={props.data.cover_block}/>
    let smallHeader = <CoverSmall data={props.data.cover_block}/>


    return (<Tabs header={header} smallHeader={smallHeader} minHeaderHeight={100} isHideDefaultHeader={true} menu={props.data.menu} data={props.data} blocks={props.blocks} />)
    
}
