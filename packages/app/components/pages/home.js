import { View, Row } from 'app/design/view'

export default function Home(props) {
    const feed = Object.assign({}, props.children[2]);
    //TODO: make flexable
    //feed.props.blocks[0].hidden = true;
    let post = Object.assign({}, props.children[3]);

    let profile = Object.assign({}, props.children[1]);

    return (
        <View className="flex-auto relative w-full flex-row mx-auto ">
             <View className="flex-auto hidden lg:flex">
                {profile}
            </View>
            <View className="flex-auto w-2/5">
                {feed}
            </View>
            <View className="hidden sticky top-0 lg:flex flex-none w-2/5">
                {post}
            </View>
        </View>
    );
}