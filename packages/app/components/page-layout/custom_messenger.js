
import { View } from 'app/design/view';
import {BlockByName} from 'app/components/block';
// Layout file for Alexey

export default function PageLayout(props) {
    return (<View className="w-full sm:p-5 max-w-5xl mx-auto ">
        <BlockByName data={props.data} name="bx_messenger-get_block_inbox"/>
        <BlockByName data={props.data} name="bx_messenger-get_block_lot"/>
    </View>)
}
