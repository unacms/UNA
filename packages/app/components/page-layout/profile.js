import {Conductor} from 'app/ui/molecules/conductor';
import Cover, {CoverSmall} from 'app/components/elements/cover';
import  LayoutDataContext from 'app/context/layout';
export default function PageLayout(props) {

    let header = <Cover data={props.data.cover_block}/>
    let smallHeader = <CoverSmall data={props.data.cover_block}/>

    console.log("props.data.menu", props.data.menu)
    if (!props.data.menu.items){
        props.data.menu.items = [{name: 'view-channel-profile', link: 'view-channel-profile/unaplatform'}];
    }
    return (<LayoutDataContext><Conductor 
        header={header} 
        smallHeader={smallHeader} 
        minHeaderHeight={104} 
        offsetTop={300}
        isHideDefaultHeader={true} 
        menu={props.data.menu} 
        data={props.data} 
        blocks={props.blocks} 
    /></LayoutDataContext>)
    
}
