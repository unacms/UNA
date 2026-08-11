import Image from "app/ui/atoms/image";
import { appSetting } from "app/lib/util";
import { Text } from "app/design/typography";
import { View } from "app/design/view";
import Profile from "app/ui/molecules/profile/profile";
import { CardList } from 'app/ui/molecules/page/card'
import LinkOrModal from 'app/ui/molecules/dialogs/link-or-modal'

export default function Unit(props) {
    const data = props.data;
    let sMeta = (
        <Profile
            {...data.author_data}
            displayType="unit"
            displaySize="xs"
            showInfo="false"
        />
    );
    return (

        <CardList padding='p-2' >
            <View className="h-full">
                <View className="h-full w-full">
                    <LinkOrModal href={data.url} showInModal={appSetting('browse', 'show_in_modal', data.module)}>
                        <View
                            className={
                                data.image
                                    ? "flex-row-reverse sm:flex-col w-full p-3 sm:p-1 gap-2"
                                    : "w-full p-3 sm:p-1 "
                            }
                        >
                            <View
                                className={
                                    (!data.image
                                        ? "hidden sm:block "
                                        : "") +
                                    " aspect-square h-full sm:aspect-video rounded-lg overflow-hidden w-1/4 sm:w-full"
                                }
                            >
                                <Image
                                    {...data.image}
                                    alt={data.title}
                                    view="cover"
                                    className="u-cover"
                                    sizes='auto'
                                />
                            </View>
                            <View className="flex-auto sm:h-24 gap-2 mb-auto">
                                
                                    <Text className="mr-auto bg-accent text-sm rounded-lg font-semibold px-2 py-1 flex-none text-accent-foreground ">
                                        {data.price > 0
                                            ?  "$" + data.price 
                                            : "Free"}
                                    </Text>
                                    {true && (
                                        <Text
                                            numberOfLines={2}
                                            className="text-foreground tracking-tight  web:hover:text-primary leading-tight text-base font-bold"
                                        >
                                            {data.title}
                                        </Text>
                                    )}
                                    <Text
                                        numberOfLines={true ? 2 : 6}
                                        className="text-muted-foreground  mb-auto text-xs"
                                    >
                                        {data.summary_plain}
                                    </Text>
                                
                            </View>
                        </View>
                    </LinkOrModal>
                    <View className="border-t border-border/50 mt-auto pt-2 ">
                        {sMeta}
                    </View>
                </View>
            </View>
        </CardList>

    );
}
