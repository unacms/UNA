import {BlackBox} from 'app/ui/molecules/blackbox';

export default function PageLayout(props) {
    console.log(props.data.menu);
    return (<BlackBox 
        minHeaderHeight={0} 
        isHideDefaultHeader={false} 
        menu={props.data.menu} 
        data={props.data} 
        blocks={props.blocks}
    />)
}
