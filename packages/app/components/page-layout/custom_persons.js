import { View } from 'app/design/view';
import {BlockByName} from 'app/components/block';

export default function PageLayout(props) {
    console.log(666, props.blocks)
    return (<View className="w-full sm:mt-4">
         <BlockByName data={props.data} name={props.blocks.col1} hideTitle={true} hideBg={true} />
    </View>)
}
