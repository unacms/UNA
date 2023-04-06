import { View, Row } from 'app/design/view'

export default function Home(props) {
    const feed = Object.assign({}, props.children[2]);
    //TODO: make flexable
    //feed.props.blocks[0].hidden = true;
    let post = Object.assign({}, props.children[3]);

    let profile = Object.assign({}, props.children[1]);

    return (
        <View className="flex-auto relative w-full flex-row mx-auto">
             <View className="hidden lg:flex w-1/3 max-w-xs ">
                {profile}
            </View>
            <View className="flex-auto w-2/3 flex-row">
                <View className="flex-auto w-2/3 sm:m-4 sm:mr-0">
                    {feed}
                </View>
                <View className="hidden sticky lg:flex sticky top-0 lg:flex flex-none w-1/3 sm:m-4">
                    {post}
                </View>
            </View>
        </View>
    );
}