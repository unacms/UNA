import { View } from 'app/design/view';
import {BlockByName} from 'app/components/block';

export default function PageLayout(props) {
    return (<View className="w-full sm:p-5 max-w-5xl mx-auto">
        <BlockByName data={props.data} name={props.blocks.author}/>
        <BlockByName data={props.data} name={props.blocks.text}/>
        <BlockByName data={props.data} name={props.blocks.actions}/>
        <BlockByName data={props.data} name={props.blocks.comments}/>
    </View>)
}
