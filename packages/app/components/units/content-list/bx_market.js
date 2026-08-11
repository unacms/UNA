import Image from "app/ui/atoms/image";
import { appSetting } from "app/lib/util";
import { Text } from "app/design/typography";
import { View, Row } from "app/design/view";
import { CardList } from 'app/ui/molecules/page/card'
import Profile from 'app/ui/molecules/profile/profile';
import { getComponent } from 'app/components/registry';
import LinkOrModal from 'app/ui/molecules/dialogs/link-or-modal'
import { Skeleton } from 'app/ui/atoms/skeleton';

export default function Unit(props) {
    const Stars = getComponent('molecule', 'stars');
    const data = props.data;
    let sMeta = (
        <Profile
            {...data.author_data}
            displayType="unit"
            displaySize="sm"
            showInfo="false"
        />
    );

    let cover_raw = data.cover_raw?.replace(
        /\\u([\d\w]{4})/gi,
        function (match, grp) {
            return String.fromCharCode(parseInt(grp, 16));
        },
    );

    let sRate = undefined;
    if (data.meta?.items)
        data.meta.items.forEach((aItem) => {
            if (aItem.name != 'votes' || aItem.data.type != 'stars')
                return;

            aItem.data.params = { ...aItem.data.params, show_counter: false };

            sRate = (
                <Stars {...aItem.data} />
            );
        });

    const isSkeleton = data?.skeleton;

    return (
        <CardList padding='p-1' className='mb-2 md:mb-0'>
            
                <View className="flex-col w-full">
                    <LinkOrModal href={data.url} showInModal={appSetting('browse', 'show_in_modal', data.module)}>
                        <View className="w-full p-1">
                            <View className="w-full mb-auto bg-muted  aspect-video overflow-hidden rounded-xl">
                                <Skeleton className="" rounded='rounded-lg' visible={isSkeleton}>
                                    {cover_raw?.trim() != "" && (
                                        <div
                                            dangerouslySetInnerHTML={{
                                                __html: cover_raw,
                                            }}
                                        ></div>
                                    )}
                                    {cover_raw?.trim() == "" && (
                                        <Image
                                            src = {data.cover.medium}
                                            alt={data.title}
                                            view="cover"
                                            className="u-cover"
                                            sizes='auto'
                                        />
                                    )}
                                </Skeleton>
                            </View>
                            <View className="flex-auto px-2 py-3 gap-y-2 h-34 ">
                                <Row className="justify-between">
                                    <View className=" gap-y-3 flex-auto">
                                        <Skeleton className="h-6 w-1/4" visible={isSkeleton}>
                                            <Text className="mr-auto bg-primary/20 rounded-lg font-semibold px-2 py-1 flex-none flex-auto text-secondary-foreground ">
                                                {data.price_recurring > 0
                                                    ? data.price_recurring +
                                                    "$/" +
                                                    data.duration_recurring
                                                    : data.price_single > 0
                                                        ? data.price_single + "$"
                                                        : "Free"}
                                            </Text>
                                        </Skeleton>
                                        <Skeleton className="h-6 w-full mt-2" visible={isSkeleton}>
                                            <View className="overflow-hidden">
                                                <Text
                                                    numberOfLines={1}
                                                    className="text-foreground tracking-tight  web:hover:text-primary leading-5 text-base font-bold"
                                                >
                                                    {data.title}
                                                </Text>
                                            </View>
                                        </Skeleton>
                                    </View>
                                    
                                </Row>
                                {sRate}
                                <Skeleton className="h-12 w-full" visible={isSkeleton}>
                                    <Text
                                        numberOfLines={2}
                                        className="text-muted-foreground  mb-auto text-sm"
                                    >
                                        {data.summary_plain}
                                    </Text>
                                </Skeleton>
                            </View>
                        </View>
                    </LinkOrModal>
                    <View className="p-2">
                        <Row>
                        <Skeleton preset="author" visible={isSkeleton}>
                            {sMeta}
                        </Skeleton>
                        {data.image && (
                                        <View className="h-8 w-8 aspect-square overflow-hidden  rounded-lg">
                                            <Image
                                                {...data.image}
                                                alt={data.title}
                                                view="cover"
                                                nobg={true}
                                                sizes='auto'
                                            />
                                        </View>
                                    )}
                        
                        
                        </Row>
                    </View>
                </View>
            
        </CardList>
    );
}
