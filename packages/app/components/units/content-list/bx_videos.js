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
        <CardList padding="p-1.5">
            
                <Link href={data.url}>
                    <View className="aspect-video rounded-xl overflow-hidden w-full">
                        <Image
                            {...data.image}
                            alt={data.title}
                            view="cover"
                            className="u-cover"
                            sizes={imageSizes}
                        />
                    </View>
                </Link>

                <View className="flex-auto p-2 flex-col gap-2">
                    <Link href={data.url}>
                        <Text
                            numberOfLines={2}
                            className="text-card-foreground sm:hover:text-accent-foreground leading-tight text-lg font-semibold"
                        >
                            {data.title}
                        </Text>
                    </Link>
                    <View className="flex-row  gap-2 w-full items-center">
                        <Profile
                            {...data.author_data}
                            displayType="unit_wo_info"
                            displaySize="2xs"
                            showInfo={false}
                        />
                        <Profile
                        {...data.author_data}
                        displayType="unit_wo_image"
                        displaySize="xs"
                        showInfo="false"
                    />
                    </View>
                    
                </View>
            
        </CardList>
    )
}
