import {BlackBox} from 'app/ui/molecules/blackbox';
import {BlockByName} from 'app/components/block';
import { View } from 'app/design/view';

export default function PageLayout(props) {

   /* return (<View className="w-full">
        
    <BlockByName data={props.data} name={props.blocks.browse}  />
</View>)
*/
    return (<BlackBox 
        minHeaderHeight={0} 
        isHideDefaultHeader={false} 
        menu={props.data.menu} 
        data={props.data} 
        blocks={props.blocks}
    />)
}
