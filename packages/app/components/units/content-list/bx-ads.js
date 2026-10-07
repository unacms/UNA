import { Text } from "app/design/typography";
import { View } from "app/design/view";
import {
    UnitAuthor,
    UnitImage,
    UnitText,
    UnitTitle,
    UnitWrapper,
} from 'app/components/units/helpers'

export default function Unit({ data }) {
    return (
        <UnitWrapper data={data} as="list" padding="p-2">
            <View className="h-full">
                <View className="h-full w-full">
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
                            <UnitImage
                                image={data.image}
                                alt={data.title}
                                view="cover"
                            />
                        </View>
                        <View className="flex-auto sm:h-24 gap-2 mb-auto">
                            <Text className="mr-auto bg-accent text-sm rounded-lg font-semibold px-2 py-1 flex-none text-accent-foreground ">
                                {data.price > 0
                                    ? "$" + data.price
                                    : "Free"}
                            </Text>
                            <UnitTitle
                                title={data.title}
                            />
                            <UnitText
                                text={data.summary_plain}
                                className="text-muted-foreground  mb-auto text-xs"
                            />
                        </View>
                    </View>
                    <View className="border-t border-border/50 mt-auto pt-2 ">
                        <UnitAuthor authorData={data.author_data} />
                    </View>
                </View>
            </View>
        </UnitWrapper>
    );
}
