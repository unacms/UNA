import { View } from 'app/design/view';
import {BlockByName} from 'app/components/block';
import {Tabs} from 'app/ui/molecules/tabs';

export default function PageLayout(props) {
    
    let header = null
    let smallHeader = null


    return (<Tabs header={header} smallHeader={smallHeader} minHeaderHeight={0} isHideDefaultHeader={false} menu={props.data.menu} data={props.data} blocks={props.blocks} />)
   /*
    
    return (<View className="w-full">
        
         <BlockByName data={props.data} name={props.blocks.browse}  />
    </View>)*/
}
