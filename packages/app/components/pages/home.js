import { View, Row } from 'app/design/view'
import ElementMainMenu from 'app/components/elements/mainmenu'

export default function Home(props) {
    const feed = Object.assign({}, props.children[2]);
    //TODO: make flexable
    feed.props.blocks[0].hidden = true;
    let post = Object.assign({}, props.children[3]);

    return (
        <View className="flex-auto relative w-full flex-row max-w-6xl mx-auto ">
            <View className="flex-auto">
                {feed}
            </View>
            <View className="hidden sticky top-0 lg:flex flex-none w-2/5">
                {post}
            </View>
        </View>
    );
}