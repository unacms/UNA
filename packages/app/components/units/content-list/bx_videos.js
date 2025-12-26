import Image from 'app/ui/atoms/image'
import Profile from 'app/ui/molecules/profile'
import { appSetting } from 'app/lib/util'
import { Text } from 'app/design/typography'
import { View } from 'app/design/view'
import { Card } from 'app/ui/molecules/card'
import LinkOrModal from 'app/ui/molecules/link-or-modal'

export default function defaultUnit(props) {
    const data = props.data

    return (
        <Card className="gap-1" padding="p-1.5">
            <LinkOrModal href={data.url} showInModal={appSetting('browse', 'show_in_modal', data.module)}>
                <View className="aspect-video rounded-xl overflow-hidden w-full">
                    <Image
                        {...data.image}
                        alt={data.title}
                        view="cover"
                        className="u-cover"
                        sizes='auto'
                    />
                </View>
            </LinkOrModal>
            <View className="flex-auto p-1.5 gap-1.5">
                <LinkOrModal href={data.url} showInModal={appSetting('browse', 'show_in_modal', data.module)}>
                    <Text
                        numberOfLines={2}
                        className="text-card-foreground sm:hover:text-accent-foreground leading-tight text-base font-semibold"
                    >
                        {data.title}
                    </Text>
                </LinkOrModal>
                <View className="flex-row gap-2 w-full items-center">
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
        </Card>
    )
}
