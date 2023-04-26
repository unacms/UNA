import { View } from 'app/design/view';
import {BlockByName} from 'app/components/block';

export default function PageLayout(props) {
    return (<View className="w-full ">
         <BlockByName data={props.data} name={props.blocks.browse} hideTitle={true} hideBg={true} />
    </View>)
}
