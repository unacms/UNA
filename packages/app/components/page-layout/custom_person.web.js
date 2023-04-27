import { View } from 'app/design/view';
import {BlockByName} from 'app/components/block';
import Cover from 'app/components/elements/cover';

export default function PageLayout(props) {

    return (<View className="w-full ">
         
         <BlockByName data={props.data} name={props.blocks.col1} />
    </View>)
}
