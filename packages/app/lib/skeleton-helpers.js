import { View, ScrollView, Row } from 'app/design/view'
import { appSetting } from 'app/lib/util'
import Card from 'app/ui/molecules/card'
import { Platform } from 'react-native'

const items = Array(5).fill('');
const maxWidth = appSetting('layout', 'max_width')

const one_column_browse = <>
    {items.map((item, index) => (
        <View key={'one_column_browse' + index}>
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
        </View>
    ))}
</>

const notifications = <>
    {items.map((item, index) => (
        <View
            key={index}
            className="max-w-4xl w-full mx-auto flex-col p-2 my-[2px] bg-bgrcard dark:bg-bgrcard-d rounded-md"
        >
            <View className="animate-pulse flex-row items-center gap-2">
                <View className="rounded-full bg-neutral-500/40 h-12 w-12"></View>
                <View className="flex-1 gap-1.5">
                    <View className="flex-row justify-between">
                        <View className="h-3 w-1/2 bg-neutral-500/60 rounded-full"></View>
                        <View className="h-3 w-20 bg-neutral-500/40 rounded-full"></View>
                    </View>
                    <View className="h-3 w-full bg-neutral-500/50 rounded-full"></View>
                </View>
            </View>
        </View>
    ))}
</>

const bx_forum = <>
    {items.map((item, index) => (
        <View
            key={index}
            className="flex-col p-4 mb-2 sm:mb-4 sm:mx-4 bg-bgrcard dark:bg-bgrcard-d sm:rounded-2xl"
        >
            <View className="animate-pulse flex-col w-full  gap-y-1">
                <View className="flex-row gap-x-2 mb-1 sm:hidden items-center">
                    <View className="h-5 w-5 flex-none bg-neutral-500/50 rounded-full"></View>

                    <View className="h-3 w-1/4 flex-none bg-neutral-500/40 rounded-full"></View>

                </View>

                <View className="h-4 w-full bg-neutral-500/50 rounded-full"></View>
                <View className="h-4 w-2/3 bg-neutral-500/50 rounded-full"></View>
                <View className="flex-row gap-x-2 mt-1 hidden sm:flex items-center">
                    <View className="h-5 w-5 flex-none bg-neutral-500/50 rounded-full"></View>

                    <View className="h-3 w-1/4 flex-none bg-neutral-500/40 rounded-full"></View>

                </View>


            </View>
        </View>
    ))}
</>

const bx_posts = <>
    {items.map((item, index) => (
        <View
            key={index}
            className="flex-col p-4 mb-2 sm:mb-4 sm:mx-4 bg-bgrcard dark:bg-bgrcard-d sm:rounded-2xl"
        >
             <View className=" mt-3 sm:mt-4 flex-auto md:flex-row-reverse rounded-2xl p-2 overflow-hidden bg-bgrcard dark:bg-bgrcard-d ">
                <View className="relative bg-neutral-500/20 aspect-video rounded-xl w-full md:w-2/5 "></View>
                <View className="flex-auto p-2 flex-col md:mr-2">
                        <View className="w-4/5 h-5 mt-2 rounded-full bg-neutral-500/20"></View>
                        <View className="w-full h-3.5 mt-4 rounded-full bg-neutral-500/20"></View>
                        <View className="w-4/5 h-3.5 mt-2 rounded-full bg-neutral-500/20"></View>
                        <View className="w-1/3 h-3.5 mt-4 rounded-full bg-neutral-500/20"></View>
                </View>
            </View>
        </View>
    ))}
</>

/*function browse_item(num) {
    return (<View className={Platform.OS === 'web' ? 'mt-0' : 'mt-16'}>{items.map((item, index) => (
        <View key={'browse_item' + index} className="flex-row lg:gap-x-4 w-full animate-pulse max-w-screen-xl mx-auto px-3 sm:px-4">
            <View className=" mt-3 sm:mt-4 flex-auto md:flex-row-reverse rounded-2xl p-2 overflow-hidden bg-bgrcard dark:bg-bgrcard-d ">
                <View className="relative bg-neutral-500/20 aspect-video rounded-xl w-full md:w-2/5"></View>
                <View className="flex-auto p-2 flex-col md:mr-2">
                        <View className="w-4/5 h-5 mt-2 rounded-full bg-neutral-500/20"></View>
                        <View className="w-full h-3.5 mt-4 rounded-full bg-neutral-500/20"></View>
                        <View className="w-4/5 h-3.5 mt-2 rounded-full bg-neutral-500/20"></View>
                        <View className="w-1/3 h-3.5 mt-4 rounded-full bg-neutral-500/20"></View>
                </View>
            </View>
            {num > 1 &&
                <View className=" mt-3 sm:mt-4 flex-auto aspect-square rounded-2xl p-1 overflow-hidden bg-bgrcard dark:bg-bgrcard-d ">
                    <View className="relative bg-neutral-500/20  aspect-video rounded-xl  w-full "></View>
                </View>
            }
            {num > 2 &&
                <View className=" mt-3 sm:mt-4 flex-auto aspect-square rounded-2xl p-1 overflow-hidden bg-bgrcard dark:bg-bgrcard-d ">
                    <View className="relative bg-neutral-500/20  aspect-video rounded-xl  w-full "></View>
                </View>
            }
            {num > 3 && <View className="mt-3 sm:mt-4 flex-auto aspect-square rounded-2xl p-1 overflow-hidden bg-bgrcard dark:bg-bgrcard-d ">
                <View className="relative bg-neutral-500/20  aspect-video rounded-xl  w-full "></View>
            </View>
            }

        </View>
    ))}
    </View>
    )
}*/

function browse_item(num) {
    return (<View className={Platform.OS === 'web' ? 'mt-0' : 'mt-0'}>{items.map((item, index) => (
        <View key={'browse_item' + index} className="flex-row lg:gap-x-4 w-full animate-pulse max-w-screen-xl mx-auto px-3 sm:px-4">
           <View className=" mt-3 sm:mt-4 flex-auto aspect-square rounded-2xl p-1 overflow-hidden bg-bgrcard dark:bg-bgrcard-d ">
                    <View className="relative bg-neutral-500/20  aspect-video rounded-xl  w-full "></View>
                </View>
            {num > 1 &&
                <View className=" mt-3 sm:mt-4 flex-auto aspect-square rounded-2xl p-1 overflow-hidden bg-bgrcard dark:bg-bgrcard-d ">
                    <View className="relative bg-neutral-500/20  aspect-video rounded-xl  w-full "></View>
                </View>
            }
            {num > 2 &&
                <View className=" mt-3 sm:mt-4 flex-auto aspect-square rounded-2xl p-1 overflow-hidden bg-bgrcard dark:bg-bgrcard-d ">
                    <View className="relative bg-neutral-500/20  aspect-video rounded-xl  w-full "></View>
                </View>
            }
            {num > 3 && <View className="mt-3 sm:mt-4 flex-auto aspect-square rounded-2xl p-1 overflow-hidden bg-bgrcard dark:bg-bgrcard-d ">
                <View className="relative bg-neutral-500/20  aspect-video rounded-xl  w-full "></View>
            </View>
            }

        </View>
    ))}
    </View>
    )
}

const feed = <View className="sm:px-4 sm:py-2 sm:gap-2">
    {appSetting('feed', 'default_view') == 'small' &&
        items.map((item, index) => (
            <View
                key={'intro' + index}
                className="bg-bgrcard dark:bg-bgrcard-d mt-[1px] sm:rounded-lg p-2 flex flex-col gap-4 animate-pulse"
            >
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
        ))}
    {appSetting('feed', 'default_view') != 'small' &&
        items.map((item, index) => (
            <View
                key={'home3' + index}
                className="bg-bgrcard dark:bg-bgrcard-d p-4 sm:mb-2 rounded-xl flex flex-col animate-pulse "
            >
                <View className="flex-row gap-x-2 mb-2">
                    <View className="relative flex-row">
                        <View className="h-10 w-10 aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-700 mx-auto rounded-full">
                            <View className="w-[50%] z-20 aspect-square bg-neutral-200 dark:bg-neutral-600 border-2 border-neutral-100 dark:border-neutral-700 mx-auto rounded-full mt-[15%] "></View>
                            <View className="w-[80%] -translate-y-[5%] aspect-square bg-neutral-200 dark:bg-neutral-600 mx-auto rounded-t-full "></View>
                        </View>
                    </View>
                    <View className="flex-col gap-y-1.5 flex-auto my-auto">
                        <View className="w-full  flex-row justify-between">
                            <View className="h-3  w-24 bg-neutral-500/30 rounded-full"></View>
                            <View className="h-3  w-6 bg-neutral-500/20 rounded-full"></View>
                        </View>
                        <View className="h-2  w-16 bg-neutral-500/20 rounded-full"></View>
                    </View>
                </View>

                <View className="h-3 my-1 w-full bg-neutral-500/20 rounded-full"></View>
                <View className="h-3 my-1 w-full bg-neutral-500/20 rounded-full"></View>
                <View className="h-3 my-1 w-full bg-neutral-500/20 rounded-full"></View>
                <View className="h-3 my-1 w-3/4 bg-neutral-500/20 rounded-full"></View>
            </View>
        ))}
</View>

var pageSkeletons = {
    default: (
        <View className={maxWidth + ' mx-auto w-full animate-pulse '}>
            <View className=" rounded-lg bg-bgrcard dark:bg-bgrcard-d m-4 p-4 flex flex-col gap-6">
                <View className="flex-col gap-y-4 ">
                    <View className="h-6 w-2/3 bg-neutral-500/20 rounded-lg"></View>
                    <View className="flex-col gap-y-2">
                        <View className="h-4 bg-neutral-500/10 rounded-lg"></View>
                        <View className="h-4 bg-neutral-500/10 rounded-lg"></View>
                        <View className="h-4 bg-neutral-500/10 rounded-lg"></View>
                    </View>
                </View>
            </View>
        </View>
    ),
    home: (
        <View className={maxWidth + ' mx-auto w-full '}>
            <View className="flex-auto relative w-full flex-row mx-auto">
                <View className="hidden md:block w-1/4 xl:w-1/5 ">
                    <View className="flex-col flex-auto px-4 py-2 animate-pulse gap-y-0.5 ">
                        {items.map((item, index) => (
                            <View key={'home1' + index}>
                                <View className="p-2 border border-transparent flex-row gap-2 ">
                                    <View className="h-6 w-6 flex-none bg-neutral-500/30 rounded-full"></View>
                                    <View className="h-5 flex-auto my-0.5 bg-neutral-500/20 rounded-full"></View>
                                </View>
                                <View className="p-2 border border-transparent flex-row gap-2 ">
                                    <View className="h-6 w-6 flex-none bg-neutral-500/30 rounded-full"></View>
                                    <View className="h-5 w-3/4 my-0.5 bg-neutral-500/20 rounded-full"></View>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                <View className="flex-auto w-3/4 xl:w-4/5 flex-row">
                    <View className="flex-auto w-2/3">{getSkeleton('feed')}</View>
                    <View className="hidden xl:flex flex-col top-0 flex-none w-1/3 ">
                        {getSkeleton('bx_posts:browse')}
                    </View>
                </View>
            </View>
        </View>
    ),
    post: (
        <View className="flex w-full justify-center sm:p-4 flex-row gap-4">
            <Card addClassName="max-w-5xl w-full p-4">
                <View className="flex-row gap-x-2 mb-2">
                    <View className="relative flex-row">
                        <View className="h-12 w-12 aspect-square overflow-hidden bg-neutral-100 dark:bg-neutral-700 mx-auto rounded-full">
                            <View className="w-[50%] z-20 aspect-square bg-neutral-200 dark:bg-neutral-600 border-2 border-neutral-100 dark:border-neutral-700 mx-auto rounded-full mt-[15%] "></View>
                            <View className="w-[80%] -translate-y-[5%] aspect-square bg-neutral-200 dark:bg-neutral-600 mx-auto rounded-t-full "></View>
                        </View>
                    </View>
                    <View className="flex-col flex-auto my-auto">
                        <View className="w-full flex-row justify-between">
                            <View className="h-4 my-1 w-1/3 bg-neutral-500/20 rounded-full"></View>
                            <View className="h-4 my-1 w-6 bg-neutral-500/20 rounded-full"></View>
                        </View>
                        <View className="h-3 my-1 w-1/4 bg-neutral-500/30 rounded-full"></View>
                    </View>
                </View>
                <View className="h-4 my-1 w-full bg-neutral-500/30 rounded-full"></View>
                <View className="h-4 my-1 w-3/4 bg-neutral-500/30 rounded-full"></View>
                <View className="h-3 my-1 w-full bg-neutral-500/20 rounded-full"></View>
                <View className="h-3 my-1 w-full bg-neutral-500/20 rounded-full"></View>
                <View className="h-3 my-1 w-full bg-neutral-500/20 rounded-full"></View>
                <View className="h-3 my-1 w-3/4 bg-neutral-500/20 rounded-full"></View>
            </Card>
        </View>
    ),
    profile: (
        <View className='flex-col sm:px-4 relative'>

            <View className="bg-neutral-500/5 w-full aspect-video  sm:aspect-3/1 max-w-screen-xl mx-auto rounded-b-xl"></View>
            <View className="w-full mx-auto px-8 -translate-16 sm:-translate-y-24  max-w-screen-xl flex-row gap-x-3">
                <View className="rounded-full absolute right-4 sm:relative bg-neutral-200 dark:bg-neutral-800 border-4 sm:border-8 border-neutral-100 dark:border-neutral-950 h-32 w-32 sm:h-48 sm:w-48"></View>
                <View className="flex-auto mt-28 sm:mt-auto mb-4 gap-y-4 ">

                    <View className="h-6 sm:h-8 w-40 sm:w-48 bg-neutral-500/20 rounded-full"></View>
                    <View className="h-4 w-24 bg-neutral-500/10 rounded-full "></View>

                </View>
            </View>
        </View>
    ),
}

export function getSkeleton(name, num = 5) {
    if (name == 'feed')
        return feed;

    if (name == 'one_column_browse')
        return one_column_browse;

    if (name == 'notifications')
        return notifications;

    if (name == 'bx_forum')
        return bx_forum;
    if (name == 'bx_posts')
        return bx_posts;

    return browse_item(num)
}

export function getPageSkeleton(name) {
    return pageSkeletons[name]
}