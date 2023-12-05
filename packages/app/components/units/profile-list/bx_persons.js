import { useContext } from "react";
import CardDataContext from "app/context/card";
import { CardData } from "app/context/card";
import Link from "app/ui/atoms/link";
import Profile from "app/ui/molecules/profile";
import { getImageSizes } from "app/lib/util";
import { Text } from "app/design/typography";
import { View } from "app/design/view";
import Menu from "app/components/menu";

export default function Unit(props) {
    const imageSizes = getImageSizes();
    let data = props.data;

    const { cardData, setCardData } = useContext(CardData);

    if (!!cardData?.hidden) return;

    let sMeta = <></>;
    if (data?.meta)
        sMeta = (
            <View className="text-center flex-col  h-auto justify-end">
                <Menu
                    {...data.meta}
                    displayType="mixed"
                    params={{
                        showVertical: false,
                        button_size: "sm",
                        button_full_width: true,
                        button_rounded: false,
                        only_icon: true,
                    }}
                />
            </View>
        );
    return (
        <CardDataContext>
            <View className="">
                <Link href={data.url} emulate={true}>
                    <View
                        className=" px-3 py-2 flex-row  
                    group duration-200 rounded-xl  
                    active:opacity-50 active:translate-y-1 
                    hover:bg-bgritem-h dark:hover:bg-bgritem-dh
                    max-w-5xl self-center w-full  "
                    >
                        <View className=" mr-2 rounded-full flex-none ">
                            <Profile
                                url_avatar={data?.image?.src}
                                displayType="unit_wo_info"
                                displaySize="base"
                                display_name={data.title}
                            />
                        </View>
                        <View className="flex-auto my-auto ">
                            <View className="flex-row justify-between">
                                <View className="justify-center flex-auto ">
                                    <Text className="text-sm mr-2 font-semibold truncate text-neutral-900  dark:text-neutral-100">
                                        {data.title}
                                    </Text>
                                </View>

                                <View className="flex-none">{sMeta}</View>
                            </View>
                        </View>
                    </View>
                </Link>
            </View>
        </CardDataContext>
    );
}
