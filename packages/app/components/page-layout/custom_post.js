import { View } from 'app/design/view';
import {BlockByName} from 'app/components/block';

export default function PageLayout(props) {
    return (<View className="w-full sm:p-5 max-w-5xl mx-auto">
        <BlockByName data={props.data} name="bx_posts:entity_author"/>
        <BlockByName data={props.data} name="bx_posts:entity_text_block"/>
        <BlockByName data={props.data} name="bx_posts:entity_all_actions"/>
        <BlockByName data={props.data} name="bx_posts:entity_comments"/>
    </View>)
}
