import {BlackBox} from 'app/ui/molecules/blackbox';
import Cover, {CoverSmall} from 'app/components/elements/cover';
import  LayoutDataContext from 'app/context/layout';
export default function PageLayout(props) {

    let header = <Cover data={props.data.cover_block}/>
    let smallHeader = <CoverSmall data={props.data.cover_block}/>

    return (<LayoutDataContext><BlackBox 
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
