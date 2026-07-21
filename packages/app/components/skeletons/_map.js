import { View, ScrollView, Row } from 'app/design/view'
import Card, {CardList} from 'app/ui/molecules/card'
import { memo } from 'react'
const items = Array(5).fill('');


const Default = memo(() => (
    <Card className='flex-auto gap-1' padding="p-1.5">
        <View className="relative  bg-secondary aspect-video rounded-xl w-full"></View>
        <View className=" p-1.5 flex-auto justify-between gap-1.5">
            <View className=" h-5 w-3/4 bg-muted rounded-full"></View>
            <View className=" h-5 w-1/2 bg-muted rounded-full"></View>
        </View>
    </Card>
));

const Persons = memo(() => (
    <Card className='flex-auto' padding="p-1.5 sm:m-1.5">
        <View className="relative bg-secondary aspect-square rounded-xl w-full"></View>
        <View className="p-2 gap-1 flex-auto justify-between">
            <View className=" h-4 w-3/4 bg-muted rounded-full"></View>
            <View className=" h-4 w-1/2 bg-muted rounded-full"></View>
        </View>
    </Card>
));

const OneColumn = memo(() => (
    <View className=" p-2 flex-row gap-x-2 w-full animate-pulse">
        <View className="w-10 h-10 bg-muted-foreground/10 rounded-full flex-none "></View>
        <View className="h-4 w-12 flex-auto mr-8 my-auto rounded-full   bg-muted/50"></View>
        <View className="py-1.5 px-2 flex-none my-auto rounded-lg border border-border/60  ">
            <View className="h-4 my-0.5 w-16  rounded-full   bg-muted/50"></View>
        </View>
        <View className="py-1.5 px-2 flex-none my-auto rounded-lg border border-border/60  ">
            <View className="h-4 my-0.5 w-4  rounded-full   bg-muted/50"></View>
        </View>
    </View>
));

const Notif = memo(() => (
    
    <View className=" w-full max-w-4xl mx-auto">
        <View className="animate-pulse px-2 py-1.5 flex-row items-center gap-3">
            <View className="rounded-full bg-muted/50 h-11 w-11"></View>
            <View className="flex-auto gap-1">
                
                <View className="h-3 w-full bg-muted/50 rounded-full"></View>           
                
                <View className="h-3 w-8 bg-muted/50 rounded-full"></View>
            </View>
        </View>
    </View>
   
));

const Forum = memo(() => (
    <View className="flex-row p-2 lg:p-4 border-b border-border/60 animate-pulse w-full mx-auto max-w-4xl gap-x-3">
        <View className="h-10 w-10 flex-none rounded-lg bg-muted-foreground/40" />
        <View className="flex-auto gap-y-2 min-w-0">
            <View className="h-4 w-2/3 rounded-full bg-muted-foreground/50" />
            <View className="h-3 w-full rounded-full bg-muted-foreground/40" />
            <View className="h-3 w-4/5 rounded-full bg-muted-foreground/40" />
            <View className="flex-row gap-x-2 mt-1 items-center">
                <View className="h-6 w-12 rounded-lg bg-muted-foreground/40" />
                <View className="h-3 w-14 rounded-full bg-muted-foreground/40" />
                <View className="h-5 w-5 ml-auto rounded-full bg-muted-foreground/50" />
                <View className="h-3 w-16 rounded-full bg-muted-foreground/40" />
            </View>
        </View>
    </View>
));

const Posts = memo(() => (
    <View className="p-2 animate-pulse w-full mx-auto max-w-4xl">

    <View className=" shadow flex-auto flex-row-reverse rounded-2xl p-2 overflow-hidden  max-w-4xl bg-card ">
        <View className="relative bg-muted/50 aspect-square md:aspect-video rounded-xl w-1/3 "></View>
        <View className="flex-auto p-2 flex-col md:ml-0.5 md:mr-2 ">
            <View className="w-2/3 h-4 mt-1.5 rounded-full bg-muted/50"></View>
            <View className="w-full h-3 mt-3 rounded-full bg-muted/50"></View>
            <View className="w-full h-3 mt-2 rounded-full bg-muted/50"></View>
            <View className="flex-row mt-3">
                <View className="w-9 h-9 rounded-full bg-muted/50"></View>
                <View className="ml-2 w-1/4 h-3 my-auto rounded-full bg-muted/50"></View>
            </View>
        </View>
    </View>
    </View>
));

const PostsSmall = memo(() => (
    <View className="m-2 flex-auto shadow rounded-2xl p-2 overflow-hidden bg-card">
        <View className="relative bg-muted/50 aspect-video rounded-lg w-full "></View>
        <View className="flex-auto p-2 flex-col">
            <View className="w-full h-4 mt-2 rounded-full bg-muted/50"></View>
            <View className="w-2/3 h-4 mt-2 rounded-full bg-muted/50"></View>
            <View className="w-full h-3 mt-2 rounded-full bg-muted/50"></View>
            <View className="w-full h-3 mt-2 rounded-full bg-muted/50"></View>
            <View className="w-2/3 h-3 mt-2 rounded-full bg-muted/50"></View>
            <View className="flex-row mt-4">
                <View className="w-9 h-9 rounded-full bg-muted/50"></View>
                <View className="ml-2 w-1/4 h-3 my-auto rounded-full bg-muted/50"></View>
            </View>
        </View>
    </View>
));


const FeedDefault = memo(() => (
    <CardList className="animate-pulse w-full mb-0.5 sm:mb-3">
        
        <View className="flex-row gap-x-2 mb-2">
            <View className="relative flex-row">
                <View className="h-10 w-10 aspect-square overflow-hidden bg-muted/50 mx-auto rounded-full">
                    <View className="w-[50%] z-20 aspect-square bg-muted  mx-auto rounded-full mt-[15%] "></View>
                    <View className="w-[80%] translate-y-0.5 aspect-square bg-muted mx-auto rounded-t-full "></View>
                </View>
            </View>
            <View className="flex-col gap-y-1.5 flex-auto my-auto">
                <View className="w-full  flex-row justify-between">
                    <View className="h-3  w-24 bg-muted/50 rounded-full"></View>
                    <View className="h-3  w-6 bg-muted/50 rounded-full"></View>
                </View>
                <View className="h-3  w-16 bg-muted/50 rounded-full"></View>
            </View>
        </View>

        <View className="h-3 my-1 w-full bg-muted/50 rounded-full"></View>
        <View className="h-3 my-1 w-full bg-muted/50 rounded-full"></View>
        <View className="h-3 my-1 w-full bg-muted/50 rounded-full"></View>
        <View className="h-3 my-1 w-3/4 bg-muted/50 rounded-full"></View>
        
    </CardList>
));

export const skeletonsMapDefault = {
    default: Default,
    notifications: Notif,
    bx_forum: Forum,
    bx_posts: Posts,
    bx_posts_small: PostsSmall,
    feed: FeedDefault,
    one_column_browse: OneColumn,
    bx_persons: Persons,
    system_person_friends: Persons,
    system_browse_friend_requests: Persons,
    system_person_friend_requested: Persons,
    system_person_friend_requested: Persons,
    system_person_friends_recommendations: Persons,
    system_person_following_recommendations: Persons,
    system_person_followers: Persons,
    system_person_following: Persons,
};
