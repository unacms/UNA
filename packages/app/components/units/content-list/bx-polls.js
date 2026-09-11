import { View } from 'app/design/view'
import {
    UnitAuthor,
    UnitImage,
    UnitText,
    UnitTitle,
    UnitWrapper,
} from 'app/components/units/helpers'

export default function defaultUnit({ data }) {
    return (
        <UnitWrapper data={data} as="list" padding="p-2" className="mb-2 md:mb-0">
            <View className="flex-col h-full">
                <View className="flex-col  h-full w-full">
                    <View
                        className={
                            data.image
                                ? 'flex-row-reverse sm:flex-col w-full p-3 sm:p-1 gap-x-2'
                                : 'flex-col w-full p-3  sm:p-1 '
                        }
                    >
                        <View
                            className={
                                (!data.image ? 'hidden sm:block ' : '') +
                                ' aspect-square h-full sm:aspect-video rounded-lg sm:rounded-xl overflow-hidden w-1/4  sm:w-full'
                            }
                        >
                            <UnitImage
                                image={data.image}
                                alt={data.title}
                                view="cover"
                            />
                        </View>
                        <View className="flex-auto flex-col sm:h-24 mb-auto">
                            <View
                                className={`flex-auto flex-col ${data.image ? '  ' : ' '
                                    } gap-y-2 sm:p-2`}
                            >
                                <UnitTitle
                                    title={data.title}
                                />
                                <UnitText
                                    text={data.summary_plain}
                                    className="text-muted-foreground  mb-auto text-xs"
                                />
                            </View>
                        </View>
                    </View>
                    <View className="border-t border-border/60 mx-2.5 /50 mt-auto  pt-2 pb-2.5 ">
                        <UnitAuthor authorData={data.author_data} />
                    </View>
                </View>
            </View>
        </UnitWrapper>
    )
}
