import { View, ScrollView, Row } from 'app/design/view'
import { appSetting } from 'app/lib/util'
import Card from 'app/ui/molecules/card'
import { Platform } from 'react-native'
import { Text } from 'app/design/typography';
import { memo } from 'react'
const items = Array(5).fill('');


const Default = memo(() => (
    <Card margin=" m-2 " rounded=" rounded-2xl " addClassName="flex-auto p-1">
        <View className="relative bg-neutral-500/20  aspect-video rounded-xl  w-full "></View>
        <View className=" h-32 py-4 p-3">
            <View className="h-5  w-1/2 bg-neutral-500/20 rounded-full"></View>
        </View>
    </Card>
));

const OneColumn = memo(() => (
    <View className=" p-2 flex-row gap-x-2 w-full animate-pulse">
        <View className="w-10 h-10 bg-neutral-500/10 rounded-full flex-none "></View>
        <View className="h-4 w-12 flex-auto mr-8 my-auto rounded-full   bg-neutral-500/20"></View>
        <View className="py-1.5 px-2 flex-none my-auto rounded-lg border border-neutral-500/10  ">
            <View className="h-4 my-0.5 w-16  rounded-full   bg-neutral-500/20"></View>
        </View>
        <View className="py-1.5 px-2 flex-none my-auto rounded-lg border border-neutral-500/10  ">
            <View className="h-4 my-0.5 w-4  rounded-full   bg-neutral-500/20"></View>
        </View>
    </View>
));

const Notif = memo(() => (
    
    <View className=" w-full">
        <Card margin=" mt-px sm:mb-2 sm:mx-2 p-3 sm:p-4 " border="border-none" rounded=" sm:rounded-2xl " >
        <View className="animate-pulse flex-row items-center gap-2">
            <View className="rounded-full bg-neutral-500/40 h-12 w-12"></View>
            <View className="flex-1 gap-1.5">
                <View className="flex-row justify-between">
                    <View className="h-3 w-1/2 bg-neutral-500/60 rounded-full"></View>
                   
                </View>
                <View className="h-3 w-full bg-neutral-500/50 rounded-full"></View>
            </View>
        </View>
        </Card>
    </View>
   
));

const Forum = memo(() => (
   
    <View className="flex-col p-2 lg:p-4 border-b border-bdr dark:border-bdr-d animate-pulse flex-col w-full mx-auto max-w-4xl gap-y-1">
        <View className="flex-row gap-x-2 mb-2 sm:hidden items-center">
            <View className="h-8 w-8 flex-none bg-neutral-500/50 rounded-full"></View>
            <View className="h-4 w-1/4 flex-none bg-neutral-500/50 rounded-full"></View>
        </View>
        <View className="h-4 w-2/3 bg-neutral-500/50 mb-2 rounded-full"></View>
        <View className="h-3 w-full bg-neutral-500/40 rounded-full"></View>
        <View className="h-3 w-full bg-neutral-500/40 rounded-full"></View>
        <View className="h-3 w-2/3 bg-neutral-500/40 rounded-full"></View>
        <View className="flex-row gap-x-2 mt-1 hidden sm:flex items-center">
            <View className="h-5 w-5 flex-none bg-neutral-500/50 rounded-full"></View>
            <View className="h-3 w-1/4 flex-none bg-neutral-500/40 rounded-full"></View>
        </View>
    </View>
   
));

const Posts = memo(() => (
    <View className="p-2 animate-pulse w-full mx-auto max-w-4xl">

    <View className=" shadow flex-auto flex-row-reverse rounded-2xl p-2 overflow-hidden  max-w-4xl bg-bgrcard dark:bg-bgrcard-d ">
        <View className="relative bg-neutral-500/20 aspect-square md:aspect-video rounded-xl w-1/3 "></View>
        <View className="flex-auto p-2 flex-col md:ml-0.5 md:mr-2 ">
            <View className="w-2/3 h-4 mt-1.5 rounded-full bg-neutral-500/20"></View>
            <View className="w-full h-3 mt-3 rounded-full bg-neutral-500/20"></View>
            <View className="w-full h-3 mt-2 rounded-full bg-neutral-500/20"></View>
            <View className="flex-row mt-3">
                <View className="w-9 h-9 rounded-full bg-neutral-500/20"></View>
                <View className="ml-2 w-1/4 h-3 my-auto rounded-full bg-neutral-500/20"></View>
            </View>
        </View>
    </View>
    </View>
));

const PostsSmall = memo(() => (
    <View className="m-2 flex-auto shadow rounded-2xl p-2 overflow-hidden bg-bgrcard dark:bg-bgrcard-d">
        <View className="relative bg-neutral-500/20 aspect-video rounded-lg w-full "></View>
        <View className="flex-auto p-2 flex-col">
            <View className="w-full h-4 mt-2 rounded-full bg-neutral-500/20"></View>
            <View className="w-2/3 h-4 mt-2 rounded-full bg-neutral-500/20"></View>
            <View className="w-full h-3 mt-2 rounded-full bg-neutral-500/20"></View>
            <View className="w-full h-3 mt-2 rounded-full bg-neutral-500/20"></View>
            <View className="w-2/3 h-3 mt-2 rounded-full bg-neutral-500/20"></View>
            <View className="flex-row mt-4">
                <View className="w-9 h-9 rounded-full bg-neutral-500/20"></View>
                <View className="ml-2 w-1/4 h-3 my-auto rounded-full bg-neutral-500/20"></View>
            </View>
        </View>
    </View>
));

const FeedSmall = memo(() => (<View className="sm:px-4 sm:pb-2 flex-auto ">
    <View className="bg-bgrcard dark:bg-bgrcard-d mt-px sm:rounded-lg p-2 flex flex-col gap-4 animate-pulse">
        <View className="flex-row gap-2">
            <View className="relative flex-row">
                <View className="h-12 w-12 aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-700 mx-auto rounded-full">
                    <View className="w-[50%] z-20 aspect-square bg-neutral-200 dark:bg-neutral-600 border-2 border-neutral-100 dark:border-neutral-700 mx-auto rounded-full mt-[15%] "></View>
                    <View className="w-[80%] -translate-y-[5%] aspect-square bg-neutral-200 dark:bg-neutral-600 mx-auto rounded-t-full "></View>
                </View>
            </View>
            <View className="flex-col flex-auto my-auto">
                <View className="w-full flex-row justify-between">
                    <View className="h-3 my-1 w-1/4 bg-neutral-500/20 rounded-full"></View>
                    <View className="h-3 my-1 w-6 bg-neutral-500/20 rounded-full"></View>
                </View>
                <View className="h-5 my-1 w-full bg-neutral-500/30 rounded-full"></View>
                <View className="h-3 my-1 w-3/4 bg-neutral-500/20 rounded-full"></View>
            </View>
        </View>
    </View>
</View>))

const FeedDefault = memo(() => (<View className=" pb-1 sm:pb-2 flex-auto">
    <View className="bg-bgrcard w-full mx-auto dark:bg-bgrcard-d mb-1 sm:mb-4 p-3 sm:p-4 sm:rounded-2xl flex flex-col animate-pulse ">
        <View className="flex-row gap-x-2 mb-2">
            <View className="relative flex-row">
                <View className="h-10 w-10 aspect-square overflow-hidden bg-neutral-500/20 mx-auto rounded-full">
                    <View className="w-[50%] z-20 aspect-square bg-neutral-500/20  mx-auto rounded-full mt-[15%] "></View>
                    <View className="w-[80%] translate-y-0.5 aspect-square bg-neutral-500/20 mx-auto rounded-t-full "></View>
                </View>
            </View>
            <View className="flex-col gap-y-1.5 flex-auto my-auto">
                <View className="w-full  flex-row justify-between">
                    <View className="h-3  w-24 bg-neutral-500/20 rounded-full"></View>
                    <View className="h-3  w-6 bg-neutral-500/20 rounded-full"></View>
                </View>
                <View className="h-3  w-16 bg-neutral-500/20 rounded-full"></View>
            </View>
        </View>

        <View className="h-3 my-1 w-full bg-neutral-500/20 rounded-full"></View>
        <View className="h-3 my-1 w-full bg-neutral-500/20 rounded-full"></View>
        <View className="h-3 my-1 w-full bg-neutral-500/20 rounded-full"></View>
        <View className="h-3 my-1 w-3/4 bg-neutral-500/20 rounded-full"></View>
    </View>
</View>));

const Feed = memo(() => (appSetting('feed', 'default_view') == 'small' ? <FeedSmall /> : <FeedDefault />));

export const skeletonsMapDefault = {
    default: Default,
    notifications: Notif,
    bx_forum: Forum,
    bx_posts: Posts,
    bx_posts_small: PostsSmall,
    feed: Feed,
    one_column_browse: OneColumn
};
