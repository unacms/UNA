import Image from 'app/ui/atoms/image'
import Link from 'app/ui/atoms/link'
import Profile from 'app/ui/molecules/profile'
import { getImageSizes } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import { CardList } from 'app/ui/molecules/card'
import { cd } from 'app/lib/util'

export default function defaultUnit(props) {
    const data = props.data
    const imageSizes = getImageSizes()

    return (
        <CardList padding={cd('p-sm')} >
            <View className={`flex-col ${cd('gap-sm')}`}>
                <Link href={data.url}>
                    <View className="aspect-video rounded-xl overflow-hidden w-full">
                        <Image
                            {...data.image}
                            alt={data.title}
                            view="cover"
                            className="u-cover"
                            sizes={imageSizes}
                        />
                    </View></Link>

                <View className={`flex-auto flex-row ${cd('px-sm')} gap-2 `}>
                    <View className="flex-none  ">
                        <Profile
                            {...data.author_data}
                            displayType="unit_wo_info"
                            displaySize="base"
                            showInfo={false}
                        /></View>
                    <View className="flex-auto flex-col  ">
                        <Link href={data.url}>
                            <Text
                                numberOfLines={2}
                                className="text-card-foreground hover:bg-muted sm:hover:text-primary rounded-md p-1 leading-tight text-lg font-bold"
                            >
                                {data.title}
                            </Text>
                        </Link>
                        <View className={`flex-auto ${cd('p-sm')} mb-1`}>
                            <Profile
                                {...data.author_data}
                                displayType="unit_wo_image"
                                displaySize="xs"
                                showInfo="false"
                            /></View>
                    </View>
                </View>
            </View>
        </CardList>
    )
}
